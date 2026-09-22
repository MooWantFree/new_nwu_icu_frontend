import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, onMounted, onUnmounted, ref, type App } from 'vue'
import PMLayout from './PMLayout.vue'

type BooleanRef = { value: boolean }

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  isLoggedIn: undefined as unknown as BooleanRef,
  isLoading: undefined as unknown as BooleanRef,
}))

vi.mock('@/lib/useUser', () => ({
  useUser: () => ({
    isLoggedIn: mocks.isLoggedIn,
    isLoading: mocks.isLoading,
  }),
}))
vi.mock('@/lib/requests', () => ({ api: { get: mocks.get } }))

let app: App | undefined
let container: HTMLDivElement

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  mocks.isLoggedIn = ref(true)
  mocks.isLoading = ref(false)
  mocks.get.mockResolvedValue({
    content: { unread: { user: 0, reply: 0, like: 0, system: 0 } },
  })
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
