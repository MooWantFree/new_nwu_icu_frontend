import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref, type App } from 'vue'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import Guestbook from '@/views/guestbook/Guestbook.vue'
import GuestbookDetail from '@/views/guestbook/GuestbookDetail.vue'
import GuestbookComposerModal from './GuestbookComposerModal.vue'
import GuestbookReplyComposer from './GuestbookReplyComposer.vue'
import { api } from '@/lib/requests'
import { loadGuestbookDraft, saveGuestbookDraft } from '@/lib/guestbook'
import type { DiscussionBoard, GuestbookEntry } from '@/types/api/guestbook'

const dialogs = vi.hoisted(() => ({ confirm: vi.fn(), prompt: vi.fn() }))
const shadcnToast = vi.hoisted(() => ({ error: vi.fn(), info: vi.fn(), success: vi.fn(), warning: vi.fn() }))
vi.mock('@/lib/useShadcnDialog', () => ({ useShadcnDialog: () => dialogs }))
vi.mock('@/lib/useShadcnToast', () => ({ useShadcnToast: () => shadcnToast }))

vi.mock('@/lib/requests', () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }))
vi.mock('@/lib/useUser', async () => {
  const { ref } = await import('vue')
  const userInfo = ref(null)
  const isLoggedIn = ref(false)
  return { useUser: () => ({ userInfo, isLoggedIn }) }
})
vi.mock('@/components/common/ShadcnModal.vue', () => ({
  default: { inheritAttrs: false, props: ['show', 'title', 'busy', 'suspended'], emits: ['update:show'], setup: (_props: unknown, context: any) => () => context.slots.default() },
}))
vi.mock('./GuestbookEditor.vue', async () => {
  const { h } = await import('vue')
  return { default: {
    props: ['modelValue', 'disabled', 'appearance'], emits: ['update:modelValue'],
    setup: (props: any, context: any) => () => h('textarea', {
      value: props.modelValue,
      disabled: props.disabled,
      onInput: (event: Event) => context.emit('update:modelValue', (event.target as HTMLTextAreaElement).value),
    }),
  } }
})

describe.each(['guestbook', 'announcements'] as const)('%s reply safeguards', board => {
  const routePath = `/${board}`
  const otherBoard = board === 'guestbook' ? 'announcements' : 'guestbook'
  const draftContent = '<p>尚未发布的回复</p>'
  const mountReply = async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [
      { path: routePath, component: { render: () => null } },
      { path: '/other', component: { render: () => null } },
    ] })
    await router.push(routePath)
    const opened = ref(true)
    const closed = vi.fn(() => { opened.value = false })
    const created = vi.fn(() => { opened.value = false })
    const userId = ref(1)
    const currentBoard = ref<DiscussionBoard>(board)
    const parent = ref(entry(9, null))
    app = createApp({ render: () => opened.value ? h(GuestbookReplyComposer, {
      userId: userId.value, parent: parent.value, board: currentBoard.value, onClose: closed, onCreated: created,
    }) : null }).use(router)
    app.mount(container)
    await flush()
    return { router, closed, created, userId, currentBoard, parent }
  }
  const saveReply = () => saveGuestbookDraft(1, 9, {
    content: draftContent, anonymous: false, updatedAt: '',
  }, board)
  const closeButton = () => container.querySelector<HTMLButtonElement>('button[aria-label="关闭回复框"]')!

  it('saves the draft and keeps it open after cancelling the Shadcn close confirmation', async () => {
    saveReply()
    dialogs.confirm.mockResolvedValue(false)
    const nativeConfirm = vi.spyOn(window, 'confirm')
    const { closed } = await mountReply()
    closeButton().click()
    await flush()
    expect(dialogs.confirm).toHaveBeenCalledWith(expect.objectContaining({
      title: '关闭回复框', description: expect.stringContaining('已自动保存'), cancelText: '继续编辑',
    }))
    expect(closed).not.toHaveBeenCalled()
    expect(nativeConfirm).not.toHaveBeenCalled()
    expect(container.querySelector('textarea')?.value).toBe(draftContent)
    expect(loadGuestbookDraft(1, 9, board)?.content).toBe(draftContent)
  })

  it('opens only one close confirmation and emits close once after accepting it without deleting the saved draft', async () => {
    saveReply()
    let accept!: (value: boolean) => void
    dialogs.confirm.mockReturnValue(new Promise<boolean>(resolve => { accept = resolve }))
    const { closed } = await mountReply()
    closeButton().click()
    closeButton().click()
    await flush()
    expect(dialogs.confirm).toHaveBeenCalledOnce()
    expect(closeButton().disabled).toBe(true)
    expect(container.querySelector('textarea')?.disabled).toBe(true)
    expect(closed).not.toHaveBeenCalled()
    accept(true)
    await flush()
    expect(closed).toHaveBeenCalledOnce()
    expect(container.querySelector('form')).toBeNull()
    expect(loadGuestbookDraft(1, 9, board)?.content).toBe(draftContent)
  })

  it('lets the async confirmation block or accept route changes while retaining the board-specific draft', async () => {
    saveReply()
    dialogs.confirm.mockResolvedValueOnce(false).mockResolvedValueOnce(true)
    const { router } = await mountReply()
    await router.push('/other')
    expect(router.currentRoute.value.path).toBe(routePath)
    expect(dialogs.confirm).toHaveBeenCalledOnce()
    await router.push('/other')
    expect(router.currentRoute.value.path).toBe('/other')
    expect(dialogs.confirm).toHaveBeenCalledTimes(2)
    expect(loadGuestbookDraft(1, 9, board)?.content).toBe(draftContent)
    expect(loadGuestbookDraft(1, 9, otherBoard)).toBeNull()
  })

  it('synchronously stops logout and keeps native refresh protection when saving a reply fails', async () => {
    saveReply()
    await mountReply()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
    const logout = new Event('guestbook:before-logout', { cancelable: true })
    expect(window.dispatchEvent(logout)).toBe(false)
    expect(logout.defaultPrevented).toBe(true)
    expect(dialogs.confirm).not.toHaveBeenCalled()
    expect(shadcnToast.info).toHaveBeenCalledWith(expect.stringContaining('草稿保存失败'))
    const unload = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(unload)
    expect(unload.defaultPrevented).toBe(true)
    await flush()
    expect(container.textContent).toContain('草稿保存失败')
    dialogs.confirm.mockResolvedValue(false)
    closeButton().click()
    await flush()
    expect(dialogs.confirm).toHaveBeenCalledWith(expect.objectContaining({ description: expect.stringContaining('可能丢失') }))
  })

  it('prevents duplicate replies, blocks logout while posting, and clears only the published draft', async () => {
    saveReply()
    saveGuestbookDraft(1, 9, { content: '<p>另一版块草稿</p>', anonymous: false, updatedAt: '' }, otherBoard)
    let complete!: (value: unknown) => void
    vi.mocked(api.post).mockReturnValueOnce(new Promise(resolve => { complete = resolve }) as never)
    const { created } = await mountReply()
    const form = container.querySelector('form')!
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    expect(api.post).toHaveBeenCalledOnce()
    expect(api.post).toHaveBeenCalledWith(expect.objectContaining({
      url: `/api/${board}/:id/replies/`, params: { id: 9 },
      query: { content: draftContent, submission_id: expect.any(String) },
    }))
    const logout = new Event('guestbook:before-logout', { cancelable: true })
    expect(window.dispatchEvent(logout)).toBe(false)
    expect(shadcnToast.info).toHaveBeenCalledWith('正在回复，请稍候。')
    complete({ status: 201, content: { entry: entry(10, 9) }, data: { message: '' } })
    await flush()
    expect(created).toHaveBeenCalledOnce()
    expect(shadcnToast.success).toHaveBeenCalledWith('回复已发布')
    expect(loadGuestbookDraft(1, 9, board)).toBeNull()
    expect(loadGuestbookDraft(1, 9, otherBoard)?.content).toBe('<p>另一版块草稿</p>')
    expect(window.dispatchEvent(new Event('guestbook:before-logout', { cancelable: true }))).toBe(true)
  })

  it.each(['account changed', 'board changed', 'target changed', 'unmounted'] as const)('ignores a late close confirmation after %s', async change => {
    saveReply()
    let accept!: (value: boolean) => void
    dialogs.confirm.mockReturnValue(new Promise<boolean>(resolve => { accept = resolve }))
    const { closed, userId, currentBoard, parent } = await mountReply()
    closeButton().click()
    await flush()
    if (change === 'account changed') userId.value = 2
    else if (change === 'board changed') currentBoard.value = otherBoard
    else if (change === 'target changed') parent.value = entry(19, null)
    else { app?.unmount(); app = undefined }
    await flush()
    accept(true)
    await flush()
    expect(closed).not.toHaveBeenCalled()
    expect(loadGuestbookDraft(1, 9, board)?.content).toBe(draftContent)
  })
})
vi.mock('@/components/common/UserAvatar.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/tinyComponents/Time.vue', () => ({ default: { render: () => null } }))

const entry = (id: number, parent: number | null, children = 0): GuestbookEntry => ({
  id, parent_id: parent, root_id: parent === null ? null : 1, content: `<p>content ${id}</p>`,
  author: { id: 1, nickname: 'author', avatar: null }, anonymous: false, is_deleted: false,
  children_count: children, reply_count: children, like_count: 0, created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z', priority: 0, is_visible: true,
  is_me: false, liked_by_me: false,
})
const flush = async () => { for (let i = 0; i < 15; i += 1) { await Promise.resolve(); await nextTick() } }
let app: App | undefined
let container: HTMLDivElement

beforeEach(() => {
  vi.clearAllMocks()
  dialogs.confirm.mockReset()
  dialogs.prompt.mockReset()
  localStorage.clear()
  container = document.createElement('div')
  document.body.append(container)
  Element.prototype.scrollIntoView = vi.fn()
})
afterEach(() => { app?.unmount(); app = undefined; container.remove(); vi.restoreAllMocks() })

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
    expect(router.currentRoute.value.query.intent).toBe('guestbook')
    expect(router.currentRoute.value.query.reason).toBeUndefined()
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
    expect(document.getElementById(dialog!.getAttribute('aria-labelledby')!)?.textContent).toBe('添加留言')
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
    const nativeConfirm = vi.spyOn(window, 'confirm')
    dialogs.confirm.mockResolvedValue(false)
    await router.push('/other')
    expect(router.currentRoute.value.path).toBe('/edit')
    expect(dialogs.confirm).toHaveBeenCalledWith(expect.objectContaining({ description: expect.stringContaining('保存失败') }))
    expect(nativeConfirm).not.toHaveBeenCalled()
    const logout = new Event('guestbook:before-logout', { cancelable: true })
    expect(window.dispatchEvent(logout)).toBe(false)
    expect(shadcnToast.info).toHaveBeenCalledWith(expect.stringContaining('请先关闭编辑窗口'))
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

  it('requires a second explicit click before clearing a saved guestbook draft', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/edit', component: { render: () => null } }] })
    await router.push('/edit')
    saveGuestbookDraft(1, null, { content: '<p>不要误删</p>', anonymous: false, updatedAt: '' })
    app = createApp({ render: () => h(GuestbookComposerModal, { userId: 1 }) }).use(router)
    app.mount(container)
    await flush()

    const findButton = (text: string) => [...container.querySelectorAll<HTMLButtonElement>('button')]
      .find(item => item.textContent?.trim() === text)!
    findButton('清空草稿').click()
    await flush()
    expect(container.querySelector('textarea')?.value).toBe('<p>不要误删</p>')
    expect(loadGuestbookDraft(1, null)).not.toBeNull()

    findButton('确认清空').click()
    await flush()
    expect(container.querySelector('textarea')?.value).toBe('')
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

describe('guestbook modal safeguards', () => {
  const draftContent = '<p>匿名留言草稿</p>'
  const mountModal = async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [
      { path: '/edit', component: { render: () => null } },
      { path: '/other', component: { render: () => null } },
    ] })
    await router.push('/edit')
    const opened = ref(true)
    const userId = ref(1)
    const board = ref<DiscussionBoard>('guestbook')
    const parentId = ref<number | null>(null)
    const closed = vi.fn(() => { opened.value = false })
    const created = vi.fn(() => { opened.value = false })
    app = createApp({ render: () => opened.value ? h(GuestbookComposerModal, {
      userId: userId.value, board: board.value, parentId: parentId.value, onClose: closed, onCreated: created,
    }) : null }).use(router)
    app.mount(container)
    await flush()
    return { router, userId, board, parentId, closed, created }
  }
  const saveDraft = () => saveGuestbookDraft(1, null, { content: draftContent, anonymous: true, updatedAt: '' })
  const closeButton = () => container.querySelector<HTMLButtonElement>('button[aria-label="关闭编辑窗口"]')!

  it('opens one async confirmation, keeps anonymous content after cancellation, and retains the draft after closing', async () => {
    saveDraft()
    let decide!: (accepted: boolean) => void
    dialogs.confirm.mockImplementation(() => new Promise<boolean>(resolve => { decide = resolve }))
    const { closed } = await mountModal()
    closeButton().click()
    closeButton().click()
    await flush()
    expect(dialogs.confirm).toHaveBeenCalledOnce()
    expect(dialogs.confirm).toHaveBeenCalledWith(expect.objectContaining({ title: '关闭编辑窗口', cancelText: '继续编辑' }))
    expect(container.querySelector('textarea')?.disabled).toBe(true)
    expect(container.querySelector<HTMLInputElement>('input[type="checkbox"]')?.disabled).toBe(true)
    expect(window.dispatchEvent(new Event('guestbook:before-logout', { cancelable: true }))).toBe(false)
    expect(shadcnToast.info).toHaveBeenCalledWith(expect.stringContaining('请先关闭编辑窗口'))
    decide(false)
    await flush()
    expect(closed).not.toHaveBeenCalled()
    expect(container.querySelector('textarea')?.value).toBe(draftContent)
    expect(container.querySelector<HTMLInputElement>('input[type="checkbox"]')?.checked).toBe(true)
    expect(loadGuestbookDraft(1, null)?.anonymous).toBe(true)
    closeButton().click()
    await flush()
    decide(true)
    await flush()
    expect(closed).toHaveBeenCalledOnce()
    expect(container.querySelector('form')).toBeNull()
    expect(loadGuestbookDraft(1, null)?.content).toBe(draftContent)
  })

  it('retains anonymous content and the submission id for retry after a failed publish', async () => {
    saveDraft()
    vi.mocked(api.post).mockRejectedValueOnce(new Error('连接失败'))
      .mockResolvedValueOnce({ status: 201, content: { entry: entry(1, null) }, data: { message: '' } } as never)
    const { created } = await mountModal()
    const submit = () => container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    submit()
    await flush()
    expect(shadcnToast.error).toHaveBeenCalledWith('连接失败')
    expect(created).not.toHaveBeenCalled()
    expect(loadGuestbookDraft(1, null)?.anonymous).toBe(true)
    expect(container.querySelector('textarea')?.value).toBe(draftContent)
    const firstRequest = vi.mocked(api.post).mock.calls[0]![0]
    expect(firstRequest).toEqual({
      url: '/api/guestbook/', query: { content: draftContent, anonymous: true, submission_id: expect.any(String) },
    })
    submit()
    await flush()
    expect(vi.mocked(api.post).mock.calls[1]![0]).toEqual(firstRequest)
    expect(created).toHaveBeenCalledOnce()
    expect(shadcnToast.success).toHaveBeenCalledWith('留言已发布')
    expect(loadGuestbookDraft(1, null)).toBeNull()
  })

  it.each(['account changed', 'board changed', 'target changed', 'unmounted'] as const)('ignores a late close confirmation after %s', async change => {
    saveDraft()
    let accept!: (value: boolean) => void
    dialogs.confirm.mockReturnValue(new Promise<boolean>(resolve => { accept = resolve }))
    const { closed, userId, board, parentId } = await mountModal()
    closeButton().click()
    await flush()
    if (change === 'account changed') userId.value = 2
    else if (change === 'board changed') board.value = 'announcements'
    else if (change === 'target changed') parentId.value = 9
    else { app?.unmount(); app = undefined }
    await flush()
    accept(true)
    await flush()
    expect(closed).not.toHaveBeenCalled()
    expect(loadGuestbookDraft(1, null)?.content).toBe(draftContent)
  })

  it.each([GuestbookComposerModal, GuestbookReplyComposer])('keeps the draft and ignores a late publish after its composer unmounts', async Composer => {
    const parentId = Composer === GuestbookReplyComposer ? 9 : null
    saveGuestbookDraft(1, parentId, { content: draftContent, anonymous: true, updatedAt: '' })
    let complete!: (value: unknown) => void
    vi.mocked(api.post).mockReturnValueOnce(new Promise(resolve => { complete = resolve }) as never)
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/edit', component: { render: () => null } }] })
    await router.push('/edit')
    const created = vi.fn()
    app = createApp({ render: () => Composer === GuestbookReplyComposer
      ? h(GuestbookReplyComposer, { userId: 1, parent: entry(9, null), onCreated: created })
      : h(GuestbookComposerModal, { userId: 1, onCreated: created }) }).use(router)
    app.mount(container)
    await flush()
    container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    expect(api.post).toHaveBeenCalledOnce()
    app.unmount()
    app = undefined
    complete({ status: 201, content: { entry: entry(10, parentId) }, data: { message: '' } })
    await flush()
    expect(created).not.toHaveBeenCalled()
    expect(shadcnToast.success).not.toHaveBeenCalled()
    expect(loadGuestbookDraft(1, parentId)?.content).toBe(draftContent)
  })
})
