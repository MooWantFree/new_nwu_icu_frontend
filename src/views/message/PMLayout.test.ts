import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, onMounted, onUnmounted, ref, type App } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import PMLayout from './PMLayout.vue'

type BooleanRef = { value: boolean }
type UserRef = { value: { unread: { unread: { user: number; reply: number; like: number; system: number } } } }

const mocks = vi.hoisted(() => ({
  fetchUnreadCount: vi.fn(),
  userInfo: undefined as unknown as UserRef,
  isLoggedIn: undefined as unknown as BooleanRef,
  isLoading: undefined as unknown as BooleanRef,
}))

vi.mock('@/lib/useUser', () => ({
  useUser: () => ({
    isLoggedIn: mocks.isLoggedIn,
    isLoading: mocks.isLoading,
    userInfo: mocks.userInfo,
    fetchUnreadCount: mocks.fetchUnreadCount,
  }),
}))

let app: App | undefined
let container: HTMLDivElement
let originalBodyOverflow: string

const mountLayout = async (path = '/message/inbox', content = defineComponent({ render: () => null })) => {
  const router = createRouter({ history: createMemoryHistory(), routes: [
    { path: '/message/:section', component: content },
    { path: '/login', component: defineComponent({ render: () => null }) },
    { path: '/', component: defineComponent({ render: () => null }) },
  ] })
  await router.push(path)
  app = createApp(PMLayout).use(router)
  app.mount(container)
  await nextTick()
  return router
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  mocks.isLoggedIn = ref(true)
  mocks.isLoading = ref(false)
  mocks.userInfo = ref({ unread: { unread: { user: 0, reply: 0, like: 0, system: 0 } } })
  mocks.fetchUnreadCount.mockResolvedValue(undefined)
  container = document.createElement('div')
  document.body.append(container)
  originalBodyOverflow = document.body.style.overflow
})

afterEach(() => {
  app?.unmount()
  app = undefined
  container.remove()
  document.body.style.overflow = originalBodyOverflow
  vi.useRealTimers()
})

describe('message layout authentication refresh', () => {
  it('waits for a slow poll before starting another unread request', async () => {
    let finish!: () => void
    mocks.fetchUnreadCount.mockReturnValueOnce(new Promise<void>(resolve => { finish = resolve }))
    await mountLayout()
    await vi.advanceTimersByTimeAsync(9000)
    expect(mocks.fetchUnreadCount).toHaveBeenCalledOnce()
    finish(); await Promise.resolve()
    await vi.advanceTimersByTimeAsync(3000)
    expect(mocks.fetchUnreadCount).toHaveBeenCalledTimes(2)
  })

  it('uses shared unread counts and polls without an extra local count', async () => {
    await mountLayout()

    mocks.userInfo.value = { unread: { unread: { user: 0, reply: 0, like: 0, system: 4 } } }
    await nextTick()
    expect(container.querySelectorAll('nav a')[3]?.textContent).toContain('4')
    expect(mocks.fetchUnreadCount).toHaveBeenCalledOnce()
    await vi.advanceTimersByTimeAsync(3000)
    expect(mocks.fetchUnreadCount).toHaveBeenCalledTimes(2)

    mocks.userInfo.value = { unread: { unread: { user: 0, reply: 0, like: 0, system: 0 } } }
    await nextTick()
    expect(container.querySelectorAll('nav a')[3]?.textContent).not.toContain('4')
  })
  it('keeps the inbox mounted while a logged-in user refreshes in the background', async () => {
    let mounts = 0
    let unmounts = 0
    const inbox = defineComponent({
      setup: () => {
        onMounted(() => { mounts += 1 })
        onUnmounted(() => { unmounts += 1 })
        return () => h('div', { 'data-inbox': '' }, 'Inbox')
      },
    })

    await mountLayout('/message/inbox', inbox)

    mocks.isLoading.value = true
    await nextTick()

    expect(container.querySelector('[data-inbox]')).not.toBeNull()
    expect(mounts).toBe(1)
    expect(unmounts).toBe(0)
    expect(container.querySelector('[data-message-layout]')).not.toBeNull()
    expect(container.querySelector('[data-message-shell]')).not.toBeNull()
  })

  it('still shows the blocking loader during the initial authentication check', async () => {
    mocks.isLoggedIn.value = false
    mocks.isLoading.value = true
    await mountLayout()

    expect(container.querySelector('.animate-spin')).not.toBeNull()
    expect(container.textContent).not.toContain('需要登录')
  })

  it('starts unread refresh when authentication succeeds and skips polls after logout', async () => {
    mocks.isLoggedIn.value = false
    mocks.isLoading.value = true
    await mountLayout()
    expect(mocks.fetchUnreadCount).not.toHaveBeenCalled()
    mocks.isLoggedIn.value = true
    mocks.isLoading.value = false
    await nextTick()
    expect(mocks.fetchUnreadCount).toHaveBeenCalledOnce()
    expect(container.querySelector('[data-message-shell]')).not.toBeNull()

    mocks.isLoggedIn.value = false
    await nextTick()
    await vi.advanceTimersByTimeAsync(6000)
    expect(mocks.fetchUnreadCount).toHaveBeenCalledOnce()
    expect(container.querySelector('[data-message-shell]')).toBeNull()
  })

  it('links the login gate back to the requested conversation without polling as a guest', async () => {
    mocks.isLoggedIn.value = false
    const router = await mountLayout('/message/inbox?talkTo=42')
    const login = container.querySelector<HTMLAnchorElement>('a[href^="/login"]')!
    expect(login).not.toBeNull()
    expect(container.querySelector('[data-message-shell]')).toBeNull()
    await vi.advanceTimersByTimeAsync(6000)
    expect(mocks.fetchUnreadCount).not.toHaveBeenCalled()

    await new Promise<void>(resolve => {
      const stop = router.afterEach(() => { stop(); resolve() })
      login.click()
    })
    expect(router.currentRoute.value.path).toBe('/login')
    expect(router.currentRoute.value.query.redirect).toBe('/message/inbox?talkTo=42')
  })

  it('keeps collapsed navigation accessible and preserves the host page scroll setting', async () => {
    document.body.style.overflow = 'clip'
    await mountLayout()
    const collapse = container.querySelector<HTMLButtonElement>('[aria-label="收起消息导航"]')!
    collapse.click()
    await nextTick()
    expect(container.querySelector('[aria-label="展开消息导航"]')).not.toBeNull()
    const inboxLink = container.querySelector<HTMLAnchorElement>('nav a[href="/message/inbox"]')!
    expect(inboxLink.getAttribute('aria-label') || inboxLink.textContent).toContain('我的消息')
    expect(document.body.style.overflow).toBe('clip')
    app?.unmount()
    app = undefined
    expect(document.body.style.overflow).toBe('clip')
  })
})
