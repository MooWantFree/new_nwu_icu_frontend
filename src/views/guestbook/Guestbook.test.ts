import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, type App, type SetupContext } from 'vue'
import { createMemoryHistory, createRouter, RouterView, type RouteLocationNormalized, type Router } from 'vue-router'
import Guestbook from './Guestbook.vue'
import GuestbookDetail from './GuestbookDetail.vue'
import { api } from '@/lib/requests'
import { loadGuestbookDraft, saveGuestbookDraft } from '@/lib/guestbook'
import type { GuestbookEntry } from '@/types/api/guestbook'

const toast = vi.hoisted(() => ({ error: vi.fn(), info: vi.fn(), success: vi.fn(), warning: vi.fn() }))
const dialogs = vi.hoisted(() => ({ confirm: vi.fn(), prompt: vi.fn() }))
const session = vi.hoisted(() => ({ userInfo: { value: null as { id: number } | null }, isLoggedIn: { value: false } }))
vi.mock('@/lib/requests', () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }))
vi.mock('@/lib/useShadcnToast', () => ({ useShadcnToast: () => toast }))
vi.mock('@/lib/useShadcnDialog', () => ({ useShadcnDialog: () => dialogs }))
vi.mock('@/lib/useUser', async () => {
  const { ref } = await import('vue')
  session.userInfo = ref<{ id: number } | null>(null)
  session.isLoggedIn = ref(false)
  return { useUser: () => session }
})
vi.mock('naive-ui', async () => {
  const { h } = await import('vue')
  return {
    useMessage: () => toast,
    NModal: {
      props: ['show'], emits: ['update:show'],
      setup: (props: { show: boolean }, { slots }: SetupContext) => () => props.show === false ? null : h('div', slots.default?.()),
    },
  }
})
vi.mock('@/components/guestbook/GuestbookEditor.vue', async () => {
  const { h } = await import('vue')
  return { default: {
    props: ['modelValue', 'disabled'], emits: ['update:modelValue'],
    setup: (props: { modelValue: string; disabled: boolean }, { emit, expose }: SetupContext) => {
      expose({ focus: () => document.querySelector<HTMLTextAreaElement>('textarea[aria-label="留言正文"]')?.focus() })
      return () => h('textarea', {
        'aria-label': '留言正文', value: props.modelValue, disabled: props.disabled,
        onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLTextAreaElement).value),
      })
    },
  } }
})
vi.mock('@/components/common/UserAvatar.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/tinyComponents/Time.vue', async () => {
  const { h } = await import('vue')
  return { default: { props: ['time'], setup: (props: { time: string }) => () => h('time', props.time) } }
})

type ReadRequest = { url: string; params?: { id: number }; query?: { page?: number; pageSize?: number } }
type ReadResponse = { status: number; content: unknown; data?: { message: string } }
const entry = (id = 1, overrides: Partial<GuestbookEntry> = {}): GuestbookEntry => ({
  id, root_id: null, parent_id: null, content: `<p>留言正文 ${id}</p>`,
  author: { id: 8, nickname: '同学甲', avatar: null }, anonymous: false, is_deleted: false,
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
  if (url === '/api/guestbook/') return pageResponse([entry()])
  if (url === '/api/guestbook/:id/') return { status: 200, content: { entry: entry(params?.id) } }
  if (url === '/api/guestbook/:id/replies/') return pageResponse([])
  throw new Error(`Unexpected read: ${url}`)
}
const flush = async () => { for (let i = 0; i < 20; i += 1) { await Promise.resolve(); await nextTick() } }
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
    { path: '/guestbook', name: 'guestbook', component: Guestbook },
    { path: '/guestbook/:id', name: 'guestbookDetail', component: GuestbookDetail },
    { path: '/announcements', name: 'announcements', component: Guestbook },
    { path: '/login', name: 'login', component: { render: () => null } },
    { path: '/user/:id', component: { render: () => null } },
  ] })
  await router.push(path)
  await router.isReady()
  app = createApp({ render: () => h(RouterView) }).use(router)
  app.mount(container)
  await flush()
  return router
}
const buttonWithText = (text: string) => [...container.querySelectorAll<HTMLButtonElement>('button')]
  .find(button => button.textContent?.trim() === text)!

beforeEach(() => {
  vi.resetAllMocks()
  session.userInfo.value = null
  session.isLoggedIn.value = false
  dialogs.confirm.mockResolvedValue(true)
  dialogs.prompt.mockResolvedValue(null)
  mockRead(defaultRead)
  localStorage.clear()
  container = document.createElement('div')
  document.body.append(container)
  Element.prototype.scrollIntoView = vi.fn()
})
afterEach(() => { app?.unmount(); app = undefined; container.remove(); vi.restoreAllMocks() })

describe('guestbook page flows', () => {
  it('loads guestbook entries and replies, then changes pages without dropping other queries', async () => {
    const child = entry(2, { root_id: 1, parent_id: 1, content: '<p>留言回复</p>' })
    mockRead(async request => {
      if (request.url === '/api/guestbook/') {
        const page = request.query?.page ?? 1
        return pageResponse([entry(page === 1 ? 1 : 11, { children_count: page === 1 ? 1 : 0 })], 20, 2, page)
      }
      if (request.url === '/api/guestbook/:id/replies/') return pageResponse(request.params?.id === 1 ? [child] : [])
      return defaultRead(request)
    })
    const router = await mountPage('/guestbook?source=profile&sort=recent')
    expect(container.querySelector('h1')?.textContent).toBe('留言板')
    expect(container.querySelector('#guestbook-1')?.textContent).toContain('留言正文 1')
    expect(container.querySelector('#guestbook-2')?.textContent).toContain('留言回复')
    expect(container.querySelector('#guestbook-1 time')?.textContent).toBe(entry().created_at)
    expect(api.get).toHaveBeenCalledWith({ url: '/api/guestbook/:id/replies/', params: { id: 1 }, query: { page: 1, pageSize: 100 } })

    const navigation = nextNavigation(router, route => route.query.page === '2')
    container.querySelector<HTMLButtonElement>('button[aria-label="下一页"]')!.click()
    await navigation
    await flush()

    expect(router.currentRoute.value.query).toEqual({ source: 'profile', sort: 'recent', page: '2' })
    expect(vi.mocked(api.get).mock.calls.filter(([request]) => request.url === '/api/guestbook/').map(([request]) => request.query))
      .toEqual([{ page: 1, pageSize: 10 }, { page: 2, pageSize: 10 }])
    expect(vi.mocked(api.get).mock.calls.every(([request]) => request.url.startsWith('/api/guestbook/'))).toBe(true)
    expect(container.querySelector('#guestbook-1')).toBeNull()
    expect(container.querySelector('#guestbook-11')?.textContent).toContain('留言正文 11')
    expect(container.querySelector('button[aria-current="page"]')?.getAttribute('aria-label')).toBe('第 2 页')
  })

  it.each([
    ['添加留言', '/guestbook?compose=1'], ['回复', '/guestbook'], ['点赞', '/guestbook?source=profile'],
  ])('guides a signed-out visitor using %s to the guestbook login intent', async (action, redirect) => {
    const router = await mountPage('/guestbook?source=profile')
    const button = action === '点赞'
      ? container.querySelector<HTMLButtonElement>('#guestbook-1 button[aria-label="点赞"]')!
      : buttonWithText(action)
    const navigation = nextNavigation(router, route => route.name === 'login')
    button.click()
    await navigation
    await flush()

    expect(router.currentRoute.value.query).toEqual({ redirect, intent: 'guestbook' })
    expect(api.post).not.toHaveBeenCalled()
    expect(api.put).not.toHaveBeenCalled()
    expect(api.delete).not.toHaveBeenCalled()
    expect(dialogs.confirm).not.toHaveBeenCalled()
    expect(dialogs.prompt).not.toHaveBeenCalled()
    expect(container.querySelector('[role="dialog"]')).toBeNull()
  })

  it('opens compose=1 with the current account draft and publishes anonymously before refreshing page one', async () => {
    session.userInfo.value = { id: 7 }
    session.isLoggedIn.value = true
    saveGuestbookDraft(7, null, { content: '<p>账号七的留言草稿</p>', anonymous: true, updatedAt: '' }, 'guestbook')
    saveGuestbookDraft(7, null, { content: '<p>公告草稿应保持独立</p>', anonymous: false, updatedAt: '' }, 'announcements')
    const published = deferred()
    vi.mocked(api.post).mockImplementation(() => published.promise as unknown as ReturnType<typeof api.post>)
    mockRead(async request => request.url === '/api/guestbook/'
      ? pageResponse([entry(request.query?.page === 2 ? 11 : 1)], 20, 2, request.query?.page ?? 1)
      : defaultRead(request))
    const router = await mountPage('/guestbook?compose=1&page=2&source=profile')
    const dialog = container.querySelector('[role="dialog"]')!
    expect(dialog).not.toBeNull()
    expect(router.currentRoute.value.query).toEqual({ page: '2', source: 'profile' })
    expect(dialog.querySelector<HTMLTextAreaElement>('textarea')?.value).toBe('<p>账号七的留言草稿</p>')
    expect(dialog.textContent).toContain('匿名发布')
    expect(dialog.querySelector<HTMLInputElement>('input[type="checkbox"]')?.checked).toBe(true)

    const form = dialog.querySelector('form')!
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await flush()
    expect(api.post).toHaveBeenCalledTimes(1)
    expect(api.post).toHaveBeenCalledWith({
      url: '/api/guestbook/',
      query: { content: '<p>账号七的留言草稿</p>', anonymous: true, submission_id: expect.any(String) },
    })
    expect(dialog.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true)

    const navigation = nextNavigation(router, route => route.query.page === '1')
    published.resolve({ status: 201, content: { entry: entry(21, { anonymous: true }) }, data: { message: '' } })
    await navigation
    await flush()
    expect(router.currentRoute.value.query).toEqual({ page: '1', source: 'profile' })
    expect(container.querySelector('[role="dialog"]')).toBeNull()
    expect(api.get).toHaveBeenCalledWith({ url: '/api/guestbook/', query: { page: 1, pageSize: 10 } })
    expect(loadGuestbookDraft(7, null, 'guestbook')).toBeNull()
    expect(loadGuestbookDraft(7, null, 'announcements')?.content).toBe('<p>公告草稿应保持独立</p>')
    expect(toast.success).toHaveBeenCalledWith('留言已发布')
  })

  it('keeps compose=1 inert for visitors and for the announcement board', async () => {
    await mountPage('/guestbook?compose=1')
    expect(container.querySelector('[role="dialog"]')).toBeNull()
    expect(api.post).not.toHaveBeenCalled()

    app?.unmount()
    app = undefined
    session.userInfo.value = { id: 7 }
    session.isLoggedIn.value = true
    mockRead(async request => request.url === '/api/announcements/' ? pageResponse([]) : defaultRead(request))
    const router = await mountPage('/announcements?compose=1')
    expect(router.currentRoute.value.query.compose).toBe('1')
    expect(container.querySelector('[role="dialog"]')).toBeNull()
    expect(container.textContent).not.toContain('添加留言')
    expect(api.post).not.toHaveBeenCalled()
  })

  it('closes the guestbook composer when the shared page switches boards and does not reopen on return', async () => {
    session.userInfo.value = { id: 7 }
    session.isLoggedIn.value = true
    mockRead(async request => request.url === '/api/announcements/' ? pageResponse([]) : defaultRead(request))
    const router = await mountPage('/guestbook?compose=1&source=profile')
    expect(container.querySelector('[role="dialog"]')).not.toBeNull()

    await router.push('/announcements?source=profile')
    await flush()
    expect(container.querySelector('h1')?.textContent).toBe('公告栏')
    expect(container.querySelector('[role="dialog"]')).toBeNull()
    expect(container.textContent).not.toContain('添加留言')
    expect(api.get).toHaveBeenCalledWith({ url: '/api/announcements/', query: { page: 1, pageSize: 10 } })

    await router.push('/guestbook?source=profile')
    await flush()
    expect(container.querySelector('h1')?.textContent).toBe('留言板')
    expect(container.querySelector('[role="dialog"]')).toBeNull()
    expect(container.querySelector('#guestbook-1')).not.toBeNull()
    expect(api.post).not.toHaveBeenCalled()
    expect(dialogs.confirm).not.toHaveBeenCalled()
  })

  it('recovers from a failed guestbook load through the rendered retry action', async () => {
    const first = deferred()
    let attempts = 0
    mockRead(request => request.url === '/api/guestbook/' && ++attempts === 1 ? first.promise : defaultRead(request))
    await mountPage('/guestbook')
    expect(container.querySelector('[role="status"]')?.getAttribute('aria-label')).toBe('正在加载留言')
    first.resolve({ status: 503, content: {} })
    await flush()
    expect(container.querySelector('[role="alert"]')).not.toBeNull()
    buttonWithText('重试').click()
    await flush()
    expect(container.querySelector('[role="alert"]')).toBeNull()
    expect(container.querySelector('#guestbook-1')?.textContent).toContain('留言正文 1')
    expect(attempts).toBe(2)
  })

  it('ignores a previous page response after the query moves to another page', async () => {
    const first = deferred()
    mockRead(request => request.url === '/api/guestbook/'
      ? (request.query?.page === 1 ? first.promise : Promise.resolve(pageResponse([entry(11)], 20, 2, 2)))
      : defaultRead(request))
    const router = await mountPage('/guestbook?source=profile')
    await router.push({ query: { source: 'profile', page: '2' } })
    await flush()
    expect(container.querySelector('#guestbook-11')).not.toBeNull()

    first.resolve(pageResponse([entry(1)], 20, 2))
    await flush()
    expect(container.querySelector('#guestbook-1')).toBeNull()
    expect(container.querySelector('#guestbook-11')?.textContent).toContain('留言正文 11')
    expect(container.querySelector('[role="status"]')).toBeNull()
  })

  it('reveals a nested detail focus through the guestbook context API and preserves it in the login link', async () => {
    const root = entry(1, { children_count: 1 })
    const child = entry(12, { root_id: 1, parent_id: 1, children_count: 1 })
    const target = entry(13, { root_id: 1, parent_id: 12 })
    mockRead(async request => {
      if (request.url === '/api/guestbook/:id/') return { status: 200, content: { entry: root } }
      if (request.url === '/api/guestbook/:id/context/') return { status: 200, content: { root_id: 1, path: [1, 12, 13], entries: [root, child, target] } }
      return defaultRead(request)
    })
    const router = await mountPage('/guestbook/1?focus=13&source=profile')
    expect(api.get).toHaveBeenCalledWith({ url: '/api/guestbook/:id/context/', params: { id: 13 } })
    expect(container.querySelector('#guestbook-13')?.textContent).toContain('留言正文 13')
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ block: 'center', behavior: 'smooth' })
    expect(vi.mocked(api.get).mock.calls.every(([request]) => request.url.startsWith('/api/guestbook/'))).toBe(true)

    const login = [...container.querySelectorAll<HTMLAnchorElement>('a')].find(link => link.textContent?.trim() === '登录')!
    expect(login).not.toBeUndefined()
    const navigation = nextNavigation(router, route => route.name === 'login')
    login.click()
    await navigation
    await flush()
    expect(router.currentRoute.value.query).toEqual({ redirect: '/guestbook/1?focus=13&source=profile', intent: 'guestbook' })
    expect(api.post).not.toHaveBeenCalled()
    expect(api.put).not.toHaveBeenCalled()
  })
})
