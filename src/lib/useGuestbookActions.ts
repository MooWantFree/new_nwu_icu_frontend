import { reactive, toValue, type MaybeRefOrGetter } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { api } from './requests'
import { useUser } from './useUser'
import type { DiscussionBoard, GuestbookEntry, APIReportGuestbook } from '../types/api/guestbook'

export function useGuestbookActions(board: MaybeRefOrGetter<DiscussionBoard> = 'guestbook') {
  const router = useRouter()
  const route = useRoute()
  const message = useMessage()
  const { isLoggedIn } = useUser(false)
  const pending = reactive(new Set<number>())

  const requireLogin = (redirect = route.fullPath) => {
    if (isLoggedIn.value) return true
    void router.push({ name: 'login', query: { redirect, reason: `请先登录，再参与${toValue(board) === 'announcements' ? '公告栏' : '留言板'}讨论` } })
    return false
  }
  const perform = async (entry: GuestbookEntry, action: () => Promise<void>, error: string) => {
    if (!requireLogin() || pending.has(entry.id) || entry.is_deleted) return
    pending.add(entry.id)
    try { await action() } catch { message.error(error) } finally { pending.delete(entry.id) }
  }
  const setLike = (entry: GuestbookEntry) => perform(entry, async () => {
    const request = { params: { id: entry.id }, query: { liked: !entry.liked_by_me } }
    const response = toValue(board) === 'announcements'
      ? await api.put({ url: '/api/announcements/:id/like/', ...request })
      : await api.put({ url: '/api/guestbook/:id/like/', ...request })
    if (response.status !== 200) throw new Error()
    entry.liked_by_me = response.content.liked
    entry.like_count = response.content.like_count
  }, '点赞失败，请稍后重试')
  const remove = (entry: GuestbookEntry) => perform(entry, async () => {
    const response = toValue(board) === 'announcements'
      ? await api.delete({ url: '/api/announcements/:id/', params: { id: entry.id } })
      : await api.delete({ url: '/api/guestbook/:id/', params: { id: entry.id } })
    if (response.status !== 200) throw new Error()
    entry.is_deleted = true
    entry.content = '[内容已删除]'
  }, '删除失败，请稍后重试')
  const report = (entry: GuestbookEntry, reason: APIReportGuestbook['query']['reason']) => perform(entry, async () => {
    const detail = reason === 'other' ? prompt('请补充举报说明（可选，最多 500 字）：') : ''
    if (detail === null) return
    if (Array.from(detail).length > 500) { message.error('举报说明不能超过 500 字'); return }
    const request = { params: { id: entry.id }, query: { reason, detail } }
    const response = toValue(board) === 'announcements'
      ? await api.post({ url: '/api/announcements/:id/reports/', ...request })
      : await api.post({ url: '/api/guestbook/:id/reports/', ...request })
    if (response.status !== 200 && response.status !== 201) throw new Error()
    message.success(response.content.created ? '举报已提交' : '你已经举报过此内容')
  }, '举报失败，请稍后重试')
  return { pending, requireLogin, setLike, remove, report }
}
