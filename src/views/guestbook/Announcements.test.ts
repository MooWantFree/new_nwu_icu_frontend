import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, type App } from 'vue'
import { createMemoryHistory, createRouter, RouterView, type RouteLocationNormalized, type Router } from 'vue-router'
import Guestbook from './Guestbook.vue'
import GuestbookDetail from './GuestbookDetail.vue'
import { api } from '@/lib/requests'
import type { GuestbookEntry } from '@/types/api/guestbook'

const toast = vi.hoisted(() => ({ error: vi.fn(), info: vi.fn(), success: vi.fn(), warning: vi.fn() }))
const dialogs = vi.hoisted(() => ({ confirm: vi.fn(), prompt: vi.fn() }))
vi.mock('@/lib/requests', () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }))
vi.mock('@/lib/useShadcnToast', () => ({ useShadcnToast: () => toast }))
vi.mock('@/lib/useShadcnDialog', () => ({ useShadcnDialog: () => dialogs }))
vi.mock('@/lib/useUser', async () => {
  const { ref } = await import('vue')
  const userInfo = ref(null)
  const isLoggedIn = ref(false)
  return { useUser: () => ({ userInfo, isLoggedIn }) }
})
vi.mock('naive-ui', () => ({
  useMessage: () => toast,
  NModal: { props: ['show'], render: () => null },
}))
vi.mock('@/components/guestbook/GuestbookEditor.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/common/UserAvatar.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/tinyComponents/Time.vue', async () => {
  const { h } = await import('vue')
  return { default: { props: ['time'], setup: (props: { time: string }) => () => h('time', props.time) } }
})

type ReadRequest = { url: string; params?: { id: number }; query?: { page?: number; pageSize?: number } }
type ReadResponse = { status: number; content: unknown }
const announcement = (id = 91, overrides: Partial<GuestbookEntry> = {}): GuestbookEntry => ({
  id, root_id: null, parent_id: null, title: `公告 ${id}`, content: `<p>公告正文 ${id}</p>`,
  author: { id: 8, nickname: '公告作者', avatar: null }, anonymous: false, is_deleted: false,
  children_count: 0, reply_count: 0, like_count: 3, created_at: '2026-10-01T00:00:00Z',
  updated_at: '2026-10-02T00:00:00Z', priority: 0, is_visible: true, is_me: false, liked_by_me: false,
  ...overrides,
})
const pageResponse = (results: GuestbookEntry[], count = results.length, maxPage = 1, page = 1): ReadResponse => ({
  status: 200, content: { page, max_page: maxPage, count, results },
})
const mockRead = (read: (request: ReadRequest) => Promise<ReadResponse>) => {
  vi.mocked(api.get).mockImplementation(read as unknown as typeof api.get)
}
const defaultRead = async ({ url, params }: ReadRequest): Promise<ReadResponse> => {
  if (url === '/api/announcements/') return pageResponse([announcement()])
  if (url === '/api/announcements/:id/') return { status: 200, content: { entry: announcement(params?.id) } }
  if (url === '/api/announcements/:id/replies/') return pageResponse([])
  throw new Error(`Unexpected read: ${url}`)
}
const flush = async () => { for (let i = 0; i < 15; i += 1) { await Promise.resolve(); await nextTick() } }
const deferred = () => {
  let resolve!: (response: ReadResponse) => void
  const promise = new Promise<ReadResponse>(complete => { resolve = complete })
  return { promise, resolve }
}
const nextNavigation = (router: Router, matches: (route: RouteLocationNormalized) => boolean) => new Promise<void>(resolve => {
  const stop = router.afterEach(route => { if (matches(route)) { stop(); resolve() } })
})
let app: App | undefined
let container: HTMLDivElement
const mountPage = async (path: string) => {
  const router = createRouter({ history: createMemoryHistory(), routes: [
    { path: '/announcements', alias: '/blog', name: 'announcements', component: Guestbook },
    { path: '/announcements/:id', alias: '/blog/:id', name: 'announcementDetail', component: GuestbookDetail },
    { path: '/login', name: 'login', component: { render: () => null } },
    { path: '/user/:id', component: { render: () => null } },
  ] })
  await router.push(path)
  await router.isReady()
  app = createApp({ render: () => h(RouterView) }).use(router)
  app.component('n-pagination', { render: () => null })
  app.mount(container)
  await flush()
  return router
}
const buttonWithText = (text: string) => [...container.querySelectorAll<HTMLButtonElement>('button')]
  .find(button => button.textContent?.trim() === text)!

beforeEach(() => {
  vi.resetAllMocks()
  dialogs.confirm.mockResolvedValue(true)
  dialogs.prompt.mockResolvedValue(null)
  mockRead(defaultRead)
  container = document.createElement('div')
  document.body.append(container)
  Element.prototype.scrollIntoView = vi.fn()
})
afterEach(() => { app?.unmount(); app = undefined; container.remove(); vi.restoreAllMocks() })

describe('announcement page flows', () => {
  it('reads the legacy board alias and complete reply tree, then follows the canonical title link', async () => {
    const root = announcement(91, { children_count: 1, reply_count: 2 })
    const child = announcement(92, { parent_id: 91, root_id: 91, children_count: 1, content: '<p>第一层回复</p>' })
    const leaf = announcement(93, { parent_id: 92, root_id: 91, content: '<p>第二层回复</p>' })
    mockRead(async request => {
      if (request.url === '/api/announcements/') return pageResponse([root], 13, 2)
      if (request.url === '/api/announcements/:id/replies/') return pageResponse(request.params?.id === 91 ? [child] : [leaf])
      return defaultRead(request)
    })
    const router = await mountPage('/blog?source=email')

    expect(router.currentRoute.value.name).toBe('announcements')
    expect(api.get).toHaveBeenCalledWith({ url: '/api/announcements/', query: { page: 1, pageSize: 10 } })
    expect(api.get).toHaveBeenCalledWith({ url: '/api/announcements/:id/replies/', params: { id: 91 }, query: { page: 1, pageSize: 100 } })
    expect(api.get).toHaveBeenCalledWith({ url: '/api/announcements/:id/replies/', params: { id: 92 }, query: { page: 1, pageSize: 100 } })
    expect(container.textContent).toMatch(/共\s*13\s*条公告/)
    expect(container.querySelector('#guestbook-92')?.textContent).toContain('第一层回复')
    expect(container.querySelector('#guestbook-93')?.textContent).toContain('第二层回复')
    expect(container.querySelector('#guestbook-91 time')?.textContent).toBe(root.updated_at)
    expect(vi.mocked(api.get).mock.calls.every(([request]) => request.url.startsWith('/api/announcements/'))).toBe(true)
    const title = container.querySelector<HTMLAnchorElement>('#guestbook-91 h2 a')!
    expect(title.textContent).toBe('公告 91')
    expect(title.getAttribute('href')).toBe('/announcements/91')

    const navigation = nextNavigation(router, route => route.name === 'announcementDetail')
    title.click()
    await navigation
    await flush()
    expect(router.currentRoute.value.path).toBe('/announcements/91')
    expect(api.get).toHaveBeenCalledWith({ url: '/api/announcements/:id/', params: { id: 91 } })
    expect(container.querySelector('#guestbook-91 h2')?.textContent).toBe('公告 91')
  })

  it('keeps legacy detail URLs on announcement endpoints and offers the canonical board link', async () => {
    const router = await mountPage('/blog/91')
    expect(router.currentRoute.value.name).toBe('announcementDetail')
    expect(api.get).toHaveBeenCalledWith({ url: '/api/announcements/:id/', params: { id: 91 } })
    expect(api.get).toHaveBeenCalledWith(expect.objectContaining({ url: '/api/announcements/:id/replies/', params: { id: 91 } }))
    expect(container.querySelector('#guestbook-91')?.textContent).toContain('公告正文 91')
    const back = [...container.querySelectorAll('a')].find(link => link.textContent?.includes('返回公告栏'))!
    expect(back.getAttribute('href')).toBe('/announcements')
    expect(vi.mocked(api.get).mock.calls.every(([request]) => request.url.startsWith('/api/announcements/'))).toBe(true)
  })

  it.each([
    ['/blog?source=email', '回复'], ['/blog?source=email', '点赞'],
    ['/blog/91', '回复'], ['/blog/91', '点赞'],
  ])('sends a signed-out visitor from %s %s to login without a mutation', async (path, action) => {
    const router = await mountPage(path)
    const root = container.querySelector('#guestbook-91')!
    const button = action === '点赞'
      ? root.querySelector<HTMLButtonElement>('button[aria-label="点赞"]')!
      : [...root.querySelectorAll<HTMLButtonElement>('button')].find(item => item.textContent?.trim() === '回复')!
    const navigation = nextNavigation(router, route => route.name === 'login')
    button.click()
    await navigation
    await flush()

    expect(router.currentRoute.value.query.intent).toBe('announcements')
    expect(router.currentRoute.value.query.redirect).toBeTruthy()
    expect(api.post).not.toHaveBeenCalled()
    expect(api.put).not.toHaveBeenCalled()
    expect(api.delete).not.toHaveBeenCalled()
    expect(dialogs.confirm).not.toHaveBeenCalled()
    expect(dialogs.prompt).not.toHaveBeenCalled()
  })

  it('changes pages through the shared pagination while retaining the other URL queries', async () => {
    mockRead(async request => {
      if (request.url === '/api/announcements/') {
        const page = request.query?.page ?? 1
        return pageResponse([announcement(page === 1 ? 91 : 101)], 20, 2, page)
      }
      return defaultRead(request)
    })
    const router = await mountPage('/announcements?source=email&filter=pinned')
    const navigation = nextNavigation(router, route => route.query.page === '2')
    container.querySelector<HTMLButtonElement>('button[aria-label="下一页"]')!.click()
    await navigation
    await flush()

    expect(router.currentRoute.value.query).toEqual({ source: 'email', filter: 'pinned', page: '2' })
    expect(vi.mocked(api.get).mock.calls.filter(([request]) => request.url === '/api/announcements/').map(([request]) => request.query))
      .toEqual([{ page: 1, pageSize: 10 }, { page: 2, pageSize: 10 }])
    expect(container.querySelector('#guestbook-91')).toBeNull()
    expect(container.querySelector('#guestbook-101')?.textContent).toContain('公告正文 101')
    expect(container.querySelector('button[aria-current="page"]')?.getAttribute('aria-label')).toBe('第 2 页')
    expect(container.querySelector<HTMLButtonElement>('button[aria-label="下一页"]')?.disabled).toBe(true)
  })

  it('shows loading, exposes a retry after failure, and renders the recovered announcement', async () => {
    const first = deferred()
    const retry = deferred()
    let attempts = 0
    mockRead(request => request.url === '/api/announcements/'
      ? (++attempts === 1 ? first.promise : retry.promise)
      : defaultRead(request))
    await mountPage('/announcements')
    expect(container.querySelector('[role="status"]')?.getAttribute('aria-label')).toBe('正在加载公告')
    expect(container.textContent).not.toContain('暂无公告')

    first.resolve({ status: 503, content: {} })
    await flush()
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('公告加载失败')
    expect(container.querySelector('[role="status"]')).toBeNull()
    buttonWithText('重试').click()
    await flush()
    expect(container.querySelector('[role="status"]')).not.toBeNull()
    expect(container.querySelector('[role="alert"]')).toBeNull()

    retry.resolve(pageResponse([announcement()]))
    await flush()
    expect(attempts).toBe(2)
    expect(container.querySelector('[role="status"]')).toBeNull()
    expect(container.querySelector('[role="alert"]')).toBeNull()
    expect(container.querySelector('#guestbook-91')?.textContent).toContain('公告正文 91')
    expect(container.textContent).toMatch(/共\s*1\s*条公告/)
  })

  it('shows an empty board without requesting reply trees', async () => {
    mockRead(async () => pageResponse([]))
    await mountPage('/announcements')
    expect(container.textContent).toContain('暂无公告')
    expect(container.querySelector('[role="status"]')).toBeNull()
    expect(container.querySelector('[role="alert"]')).toBeNull()
    expect(container.querySelector('[id^="guestbook-"]')).toBeNull()
    expect(api.get).toHaveBeenCalledTimes(1)
  })

  it('renders safe announcement rich text and retains uploaded image size metadata', async () => {
    const imageUrl = '/api/download/123e4567-e89b-12d3-a456-426614174000/'
    const content = [
      '<p><strong>重要通知</strong> <a href="/announcements/12?source=body#reply">关联公告</a></p>',
      `<img src="${imageUrl}" data-size="75" alt="活动安排" onerror="alert(1)">`,
      '<script>alert(1)</script><img src="https://example.com/unsafe.png">',
      '<a href="javascript:alert(1)">危险链接文字</a>',
    ].join('')
    mockRead(async request => request.url === '/api/announcements/'
      ? pageResponse([announcement(91, { content })]) : defaultRead(request))
    await mountPage('/announcements')
    const body = container.querySelector('#guestbook-91 .guestbook-content')!
    expect(body.querySelector('strong')?.textContent).toBe('重要通知')
    expect(body.querySelector('a')?.getAttribute('href')).toBe('/announcements/12?source=body#reply')
    expect(body.querySelectorAll('a')).toHaveLength(1)
    expect(body.textContent).toContain('危险链接文字')
    expect(body.querySelectorAll('img')).toHaveLength(1)
    expect(body.querySelector('img')?.getAttribute('src')).toBe(imageUrl)
    expect(body.querySelector('img')?.getAttribute('data-size')).toBe('75')
    expect(body.querySelector('img')?.getAttribute('alt')).toBe('活动安排')
    expect(body.querySelector('img')?.hasAttribute('onerror')).toBe(false)
    expect(body.querySelector('script')).toBeNull()
  })
})
