import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, ref, type App } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useGuestbookActions } from './useGuestbookActions'
import type { DiscussionBoard, GuestbookEntry } from '@/types/api/guestbook'

const mocks = vi.hoisted(() => ({
  post: vi.fn(), put: vi.fn(), delete: vi.fn(), prompt: vi.fn(),
  standard: { error: vi.fn(), success: vi.fn() },
  shadcn: { error: vi.fn(), success: vi.fn() },
}))
vi.mock('@/lib/requests', () => ({ api: { post: mocks.post, put: mocks.put, delete: mocks.delete } }))
vi.mock('naive-ui', () => ({ useMessage: () => mocks.standard }))
vi.mock('./useShadcnToast', () => ({ useShadcnToast: () => mocks.shadcn }))
vi.mock('./useShadcnDialog', () => ({ useShadcnDialog: () => ({ prompt: mocks.prompt }) }))
vi.mock('./useUser', async () => {
  return { useUser: () => ({ isLoggedIn, userInfo }) }
})

const entry = (): GuestbookEntry => ({
  id: 7, parent_id: 1, root_id: 1, content: '<p>公告回复</p>',
  author: { id: 1, nickname: '用户', avatar: null }, anonymous: false, is_deleted: false,
  children_count: 0, reply_count: 0, like_count: 0, created_at: '2026-10-01T00:00:00Z',
  updated_at: '2026-10-01T00:00:00Z', priority: 0, is_visible: true,
  is_me: false, liked_by_me: false,
})
let app: App | undefined
let container: HTMLDivElement
const board = ref<DiscussionBoard>('announcements')
const isLoggedIn = ref(true)
const userInfo = ref<{ id: number } | null>({ id: 1 })
let actions: ReturnType<typeof useGuestbookActions>
const mount = async () => {
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/announcements', component: { render: () => null } }] })
  await router.push('/announcements')
  app = createApp({ setup() { actions = useGuestbookActions(board); return () => h('div') } }).use(router)
  app.mount(container)
  return router
}
beforeEach(() => {
  vi.resetAllMocks()
  board.value = 'announcements'
  isLoggedIn.value = true
  userInfo.value = { id: 1 }
  container = document.createElement('div')
  document.body.append(container)
})
afterEach(() => { app?.unmount(); app = undefined; container.remove(); vi.restoreAllMocks() })

describe('discussion board actions', () => {
  it('cancels an announcement report without posting and releases the entry lock', async () => {
    mocks.prompt.mockResolvedValue(null)
    await mount()
    await actions.report(entry(), 'other')
    expect(mocks.prompt).toHaveBeenCalledWith(expect.objectContaining({ maxLength: 500, confirmText: '提交举报' }))
    expect(mocks.post).not.toHaveBeenCalled()
    expect(actions.pending.size).toBe(0)
    expect(mocks.shadcn.success).not.toHaveBeenCalled()
  })

  it('keeps one report prompt/request pending and posts the accepted detail to announcements', async () => {
    let resolve!: (detail: string) => void
    mocks.prompt.mockReturnValue(new Promise<string>(accept => { resolve = accept }))
    mocks.post.mockResolvedValue({ status: 201, content: { created: true } })
    await mount()
    const item = entry()
    const report = actions.report(item, 'other')
    await actions.report(item, 'other')
    expect(mocks.prompt).toHaveBeenCalledOnce()
    expect(actions.pending.has(item.id)).toBe(true)
    expect(mocks.post).not.toHaveBeenCalled()
    resolve('请管理员检查这条回复')
    await report
    expect(mocks.post).toHaveBeenCalledExactlyOnceWith({
      url: '/api/announcements/:id/reports/', params: { id: item.id },
      query: { reason: 'other', detail: '请管理员检查这条回复' },
    })
    expect(mocks.shadcn.success).toHaveBeenCalledWith('举报已提交')
    expect(mocks.standard.success).not.toHaveBeenCalled()
    expect(actions.pending.size).toBe(0)
  })

  it('does not send a pending announcement report to another board after route reuse', async () => {
    let resolve!: (detail: string) => void
    mocks.prompt.mockReturnValue(new Promise<string>(accept => { resolve = accept }))
    await mount()
    const report = actions.report(entry(), 'other')
    board.value = 'guestbook'
    resolve('旧公告说明')
    await report
    expect(mocks.post).not.toHaveBeenCalled()
    expect(actions.pending.size).toBe(0)
  })

  it.each(['signed out', 'account changed', 'route changed'] as const)('cancels a pending report when %s', async change => {
    let resolve!: (detail: string) => void
    mocks.prompt.mockReturnValue(new Promise<string>(accept => { resolve = accept }))
    const router = await mount()
    const report = actions.report(entry(), 'other')
    if (change === 'signed out') { isLoggedIn.value = false; userInfo.value = null }
    else if (change === 'account changed') userInfo.value = { id: 2 }
    else await router.push('/announcements?focus=8')
    resolve('旧上下文的举报说明')
    await report
    expect(mocks.post).not.toHaveBeenCalled()
    expect(actions.pending.size).toBe(0)
    expect(mocks.shadcn.success).not.toHaveBeenCalled()
  })

  it('counts Unicode characters and rejects descriptions longer than 500 before posting', async () => {
    mocks.prompt.mockResolvedValue('😀'.repeat(501))
    await mount()
    await actions.report(entry(), 'other')
    expect(mocks.post).not.toHaveBeenCalled()
    expect(mocks.shadcn.error).toHaveBeenCalledWith('举报说明不能超过 500 字')
    expect(actions.pending.size).toBe(0)
  })

  it('uses the current board and toast for later actions, preserving the native guestbook prompt', async () => {
    mocks.post.mockResolvedValue({ status: 200, content: { created: false } })
    const nativePrompt = vi.spyOn(window, 'prompt').mockReturnValue('留言说明')
    await mount()
    board.value = 'guestbook'
    await actions.report(entry(), 'other')
    expect(nativePrompt).toHaveBeenCalledOnce()
    expect(mocks.prompt).not.toHaveBeenCalled()
    expect(mocks.post).toHaveBeenCalledWith({
      url: '/api/guestbook/:id/reports/', params: { id: 7 }, query: { reason: 'other', detail: '留言说明' },
    })
    expect(mocks.standard.success).toHaveBeenCalledWith('你已经举报过此内容')
    board.value = 'announcements'
    await actions.report(entry(), 'spam')
    expect(mocks.post).toHaveBeenLastCalledWith({
      url: '/api/announcements/:id/reports/', params: { id: 7 }, query: { reason: 'spam', detail: '' },
    })
    expect(mocks.shadcn.success).toHaveBeenCalledWith('你已经举报过此内容')
  })
})
