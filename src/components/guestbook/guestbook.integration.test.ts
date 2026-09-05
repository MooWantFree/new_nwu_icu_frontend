import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref, type App } from 'vue'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import Guestbook from '@/views/guestbook/Guestbook.vue'
import GuestbookDetail from '@/views/guestbook/GuestbookDetail.vue'
import GuestbookComposerModal from './GuestbookComposerModal.vue'
import GuestbookReplyComposer from './GuestbookReplyComposer.vue'
import { api } from '@/lib/requests'
import { loadGuestbookDraft, saveGuestbookDraft } from '@/lib/guestbook'
import type { GuestbookEntry } from '@/types/api/guestbook'

vi.mock('@/lib/requests', () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }))
vi.mock('@/lib/useUser', async () => {
  const { ref } = await import('vue')
  const userInfo = ref(null)
  const isLoggedIn = ref(false)
  return { useUser: () => ({ userInfo, isLoggedIn }) }
})
vi.mock('naive-ui', () => ({
  useMessage: () => ({ error: vi.fn(), info: vi.fn(), success: vi.fn(), warning: vi.fn() }),
  NModal: { props: ['show'], emits: ['update:show'], setup: (_props: unknown, context: any) => () => context.slots.default() },
}))
vi.mock('./GuestbookEditor.vue', async () => {
  const { h } = await import('vue')
  return { default: {
    props: ['modelValue'], emits: ['update:modelValue'],
    setup: (props: any, context: any) => () => h('textarea', {
      value: props.modelValue,
      onInput: (event: Event) => context.emit('update:modelValue', (event.target as HTMLTextAreaElement).value),
    }),
  } }
})
vi.mock('@/components/common/UserAvatar.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/tinyComponents/Time.vue', () => ({ default: { render: () => null } }))

const entry = (id: number, parent: number | null, children = 0): GuestbookEntry => ({
  id, parent_id: parent, root_id: parent === null ? null : 1, content: `<p>content ${id}</p>`,
  author: { id: 1, nickname: 'author', avatar: null }, anonymous: false, is_deleted: false,
  children_count: children, reply_count: children, like_count: 0, created_at: '2026-09-01T00:00:00Z',
  is_me: false, liked_by_me: false,
})
const flush = async () => { for (let i = 0; i < 15; i += 1) { await Promise.resolve(); await nextTick() } }
let app: App | undefined
let container: HTMLDivElement

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  container = document.createElement('div')
  document.body.append(container)
  Element.prototype.scrollIntoView = vi.fn()
})
afterEach(() => { app?.unmount(); container.remove(); vi.restoreAllMocks() })

describe('guestbook rendered flows', () => {
  it('renders the complete discussion tree on the board without detail links', async () => {
    const root = { ...entry(1, null, 1), reply_count: 2 }
    const child = entry(2, 1, 1)
    const leaf = entry(3, 2)
    vi.mocked(api.get).mockImplementation(async ({ url, params }: any) => {
      if (url === '/api/guestbook/') return { status: 200, content: { results: [root], max_page: 1 } } as any
      return { status: 200, content: { results: params.id === 1 ? [child] : [leaf], max_page: 1 } } as any
    })
    const router = createRouter({ history: createMemoryHistory(), routes: [
      { path: '/guestbook', component: Guestbook },
      { path: '/user/:id', component: { render: () => null } },
      { path: '/login', name: 'login', component: { render: () => null } },
    ] })
    await router.push('/guestbook')
    app = createApp({ render: () => h(RouterView) }).use(router)
    app.component('n-pagination', { render: () => null })
    app.mount(container)
    await flush()
    expect(container.querySelector('#guestbook-1')).not.toBeNull()
    expect(container.querySelector('#guestbook-2')).not.toBeNull()
    expect(container.querySelector('#guestbook-3')).not.toBeNull()
    expect([...container.querySelectorAll('a')].some(link => /^\/guestbook\/\d/.test(link.getAttribute('href') || ''))).toBe(false)
  })

  it('lets visitors read and locate nested replies on later pages and sends reply actions to login', async () => {
    const root = entry(1, null, 11)
    const target = entry(12, 1, 1)
    const leaf = entry(13, 12)
    vi.mocked(api.get).mockImplementation(async ({ url, params }: any) => {
      if (url.endsWith('/context/')) return { status: 200, content: { root_id: 1, path: [1, 12, 13], entries: [root, target, leaf] } } as any
      if (url.endsWith('/replies/')) return { status: 200, content: {
        results: params.id === 1 ? Array.from({ length: 10 }, (_, i) => entry(i + 2, 1)) : [leaf], max_page: params.id === 1 ? 2 : 1,
      } } as any
      return { status: 200, content: { entry: root } } as any
    })
    const router = createRouter({ history: createMemoryHistory(), routes: [
      { path: '/guestbook/:id', component: GuestbookDetail },
      { path: '/guestbook', component: { render: () => null } },
      { path: '/user/:id', component: { render: () => null } },
      { path: '/login', name: 'login', component: { render: () => null } },
    ] })
    await router.push('/guestbook/1?focus=13')
    app = createApp({ render: () => h(RouterView) }).use(router)
    app.mount(container)
    await flush()
    expect(container.querySelector('#guestbook-12')).not.toBeNull()
    expect(container.querySelector('#guestbook-13')?.textContent).toContain('content 13')
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled()
    const reply = [...container.querySelectorAll('#guestbook-13 button')].find(button => button.textContent?.trim() === '回复') as HTMLButtonElement
    reply.click()
    await flush()
    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.redirect).toBe('/guestbook/1?reply=13')
    expect(api.post).not.toHaveBeenCalled()
  })

  it('guards route changes, logout, and refresh even when draft saving fails', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [
      { path: '/edit', component: { render: () => null } }, { path: '/other', component: { render: () => null } },
    ] })
    await router.push('/edit')
    saveGuestbookDraft(1, null, { content: '<p>unsaved text</p>', anonymous: false, updatedAt: '' })
    app = createApp({ render: () => h(GuestbookComposerModal, { userId: 1 }) }).use(router)
    app.mount(container)
    const dialog = container.querySelector('[role="dialog"]')
    expect(dialog?.classList.contains('mx-4')).toBe(false)
    expect(dialog?.classList.contains('w-[calc(100vw-2rem)]')).toBe(true)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    await router.push('/other')
    expect(router.currentRoute.value.path).toBe('/edit')
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('保存失败'))
    const logout = new Event('guestbook:before-logout', { cancelable: true })
    expect(window.dispatchEvent(logout)).toBe(false)
    const refresh = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(refresh)
    expect(refresh.defaultPrevented).toBe(true)
    await nextTick()
    expect(container.textContent).toContain('草稿保存失败')
  })

  it('prevents double submission and clears the draft after the published modal unmounts', async () => {
    let complete!: (value: any) => void
    vi.mocked(api.post).mockImplementation(() => new Promise(resolve => { complete = resolve }))
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/edit', component: { render: () => null } }] })
    await router.push('/edit')
    saveGuestbookDraft(1, null, { content: '<p>publish me</p>', anonymous: false, updatedAt: '' })
    const Host = defineComponent({ setup() {
      const opened = ref(true)
      return () => opened.value ? h(GuestbookComposerModal, { userId: 1, onCreated: () => { opened.value = false } }) : null
    } })
    app = createApp(Host).use(router)
    app.mount(container)
    const form = container.querySelector('form')!
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    expect(api.post).toHaveBeenCalledTimes(1)
    complete({ status: 201, content: { entry: entry(1, null) }, data: { message: '' } })
    await flush()
    expect(container.querySelector('form')).toBeNull()
    expect(loadGuestbookDraft(1, null)).toBeNull()
  })

  it('submits a reply from the inline floor composer', async () => {
    const parent = entry(9, null)
    const reply = entry(10, 9)
    saveGuestbookDraft(1, 9, { content: '<p>inline reply</p>', anonymous: false, updatedAt: '' })
    vi.mocked(api.post).mockResolvedValue({ status: 201, content: { entry: reply }, data: { message: '' } } as any)
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/guestbook', component: { render: () => null } }] })
    await router.push('/guestbook')
    const Host = defineComponent({ setup() {
      const opened = ref(true)
      return () => opened.value ? h(GuestbookReplyComposer, {
        userId: 1,
        parent,
        onCreated: () => { opened.value = false },
      }) : null
    } })
    app = createApp(Host).use(router)
    app.mount(container)
    container.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await flush()
    expect(api.post).toHaveBeenCalledWith(expect.objectContaining({
      url: '/api/guestbook/:id/replies/',
      params: { id: 9 },
    }))
    expect(container.querySelector('form')).toBeNull()
    expect(loadGuestbookDraft(1, 9)).toBeNull()
  })
})
