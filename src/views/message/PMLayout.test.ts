import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, onMounted, onUnmounted, ref, type App } from 'vue'
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

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  mocks.isLoggedIn = ref(true)
  mocks.isLoading = ref(false)
  mocks.userInfo = ref({ unread: { unread: { user: 0, reply: 0, like: 0, system: 0 } } })
  mocks.fetchUnreadCount.mockResolvedValue(undefined)
  container = document.createElement('div')
  document.body.append(container)
})

afterEach(() => {
  app?.unmount()
  app = undefined
  container.remove()
  vi.useRealTimers()
})

describe('message layout authentication refresh', () => {
  it('waits for a slow poll before starting another unread request', async () => {
    let finish!: () => void
    mocks.fetchUnreadCount.mockReturnValueOnce(new Promise<void>(resolve => { finish = resolve }))
    app = createApp(PMLayout)
    app.component('RouterLink', defineComponent({ render: () => null }))
    app.component('RouterView', defineComponent({ render: () => null }))
    app.mount(container)
    await vi.advanceTimersByTimeAsync(9000)
    expect(mocks.fetchUnreadCount).toHaveBeenCalledOnce()
    finish(); await Promise.resolve()
    await vi.advanceTimersByTimeAsync(3000)
    expect(mocks.fetchUnreadCount).toHaveBeenCalledTimes(2)
  })

  it('uses shared unread counts and polls without an extra local count', async () => {
    app = createApp(PMLayout)
    app.component('RouterLink', defineComponent({
      setup: (_, { slots }) => () => h('a', slots.default?.()),
    }))
    app.component('RouterView', defineComponent({ render: () => null }))
    app.mount(container)
    await nextTick()

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

    app = createApp(PMLayout)
    app.component('RouterLink', defineComponent({
      setup: (_, { slots }) => () => h('a', slots.default?.()),
    }))
    app.component('RouterView', inbox)
    app.mount(container)
    await nextTick()

    mocks.isLoading.value = true
    await nextTick()

    expect(container.querySelector('[data-inbox]')).not.toBeNull()
    expect(mounts).toBe(1)
    expect(unmounts).toBe(0)
    expect(container.querySelector('[data-message-layout]')?.classList.contains('h-[calc(100vh-4rem)]')).toBe(true)
    expect(container.querySelector('[data-message-shell]')?.classList.contains('h-full')).toBe(true)
  })

  it('still shows the blocking loader during the initial authentication check', async () => {
    mocks.isLoggedIn.value = false
    mocks.isLoading.value = true
    app = createApp(PMLayout)
    app.component('RouterLink', defineComponent({ render: () => null }))
    app.component('RouterView', defineComponent({ render: () => null }))
    app.mount(container)
    await nextTick()

    expect(container.querySelector('.animate-spin')).not.toBeNull()
    expect(container.textContent).not.toContain('需要登录')
  })
})
