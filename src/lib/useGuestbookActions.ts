import { onScopeDispose, reactive, toValue, type MaybeRefOrGetter } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from './requests'
import { useUser } from './useUser'
import { useShadcnToast } from './useShadcnToast'
import { useShadcnDialog } from './useShadcnDialog'
import type { DiscussionBoard, GuestbookEntry, APIReportGuestbook } from '../types/api/guestbook'

export function useGuestbookActions(board: MaybeRefOrGetter<DiscussionBoard> = 'guestbook') {
  const router = useRouter()
  const route = useRoute()
  const message = useShadcnToast()
  const dialog = useShadcnDialog()
  const { isLoggedIn, userInfo } = useUser(false)
  const pending = reactive(new Set<number>())
  let active = true
  onScopeDispose(() => { active = false })

  const requireLogin = (redirect = route.fullPath) => {
    if (isLoggedIn.value) return true
    void router.push({
      name: 'login',
      query: {
        redirect,
        intent: toValue(board) === 'announcements' ? 'announcements' : 'guestbook',
      },
    })
    return false
  }
  const perform = async (entry: GuestbookEntry, action: (actionBoard: DiscussionBoard) => Promise<void>, error: string) => {
    if (!active || !requireLogin() || pending.has(entry.id) || entry.is_deleted) return
    const actionBoard = toValue(board)
    const entryId = entry.id
    pending.add(entryId)
    try { await action(actionBoard) }
    catch { if (active) message.error(error) }
    finally { pending.delete(entryId) }
  }
  const setLike = (entry: GuestbookEntry) => perform(entry, async actionBoard => {
    const request = { params: { id: entry.id }, query: { liked: !entry.liked_by_me } }
    const response = actionBoard === 'announcements'
      ? await api.put({ url: '/api/announcements/:id/like/', ...request })
      : await api.put({ url: '/api/guestbook/:id/like/', ...request })
    if (response.status !== 200) throw new Error()
    entry.liked_by_me = response.content.liked
    entry.like_count = response.content.like_count
  }, '点赞失败，请稍后重试')
  const remove = (entry: GuestbookEntry) => perform(entry, async actionBoard => {
    const response = actionBoard === 'announcements'
      ? await api.delete({ url: '/api/announcements/:id/', params: { id: entry.id } })
      : await api.delete({ url: '/api/guestbook/:id/', params: { id: entry.id } })
    if (response.status !== 200) throw new Error()
    entry.is_deleted = true
    entry.content = '[内容已删除]'
  }, '删除失败，请稍后重试')
  const report = (entry: GuestbookEntry, reason: APIReportGuestbook['query']['reason']) => perform(entry, async actionBoard => {
    const startingUserId = userInfo.value?.id
    const startingRoute = route.fullPath
    const startingEntryId = entry.id
    const isCurrentReport = () => active && isLoggedIn.value && userInfo.value?.id === startingUserId
      && toValue(board) === actionBoard && route.fullPath === startingRoute
      && entry.id === startingEntryId && !entry.is_deleted
    const detail = reason !== 'other' ? ''
      : await dialog.prompt({ title: actionBoard === 'announcements' ? '举报公告内容' : '举报留言内容', description: '请补充举报说明（可选，最多 500 字）。', placeholder: '说明需要管理员关注的问题', maxLength: 500, confirmText: '提交举报' })
    if (detail === null) return
    if (!isCurrentReport()) return
    if (Array.from(detail).length > 500) { message.error('举报说明不能超过 500 字'); return }
    const request = { params: { id: entry.id }, query: { reason, detail } }
    const response = actionBoard === 'announcements'
      ? await api.post({ url: '/api/announcements/:id/reports/', ...request })
      : await api.post({ url: '/api/guestbook/:id/reports/', ...request })
    if (!isCurrentReport()) return
    if (response.status !== 200 && response.status !== 201) throw new Error()
    message.success(response.content.created ? '举报已提交' : '你已经举报过此内容')
  }, '举报失败，请稍后重试')
  return { pending, requireLogin, setLike, remove, report }
}
