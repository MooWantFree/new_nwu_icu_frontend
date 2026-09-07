import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createApp,
  defineComponent,
  h,
  nextTick,
  onMounted,
  onUnmounted,
  type App,
} from 'vue'
import Settings from './Settings.vue'
import { useUser } from '@/lib/useUser'
import { api } from '@/lib/requests'

vi.mock('@/lib/requests', () => ({
  api: { get: vi.fn() },
}))

const flush = async () => {
  for (let index = 0; index < 5; index += 1) {
    await Promise.resolve()
    await nextTick()
  }
}

const profile = {
  id: 1,
  uuid: '00000000-0000-0000-0000-000000000001',
  username: 'tester',
  nickname: 'Tester',
  bio: '',
  avatar: '',
  has_avatar: false,
  email: 'tester@example.com',
  college_email: '',
  verified: false,
  date_joined: '2026-01-01T00:00:00Z',
  unread: {},
} as never

let app: App | undefined
let container: HTMLDivElement
let childMounts: number
let childUnmounts: number

beforeEach(() => {
  vi.clearAllMocks()
  childMounts = 0
  childUnmounts = 0
  container = document.createElement('div')
  document.body.append(container)
  useUser(false).login(profile)
})

afterEach(() => {
  app?.unmount()
  useUser(false).logout()
  container.remove()
})

describe('user settings', () => {
  it('keeps the active settings page mounted during a focus refresh', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ status: 200, content: profile } as never)
      .mockResolvedValueOnce({ status: 200, content: {} } as never)

    const refreshResponses: Array<(value: never) => void> = []
    vi.mocked(api.get).mockImplementation(() => new Promise(resolve => {
      refreshResponses.push(resolve)
    }))

    const ChildPage = defineComponent({
      setup: () => {
        onMounted(() => { childMounts += 1 })
        onUnmounted(() => { childUnmounts += 1 })
        return () => h('div', { 'data-testid': 'settings-child' }, '个人资料内容')
      },
    })
    const RouterViewStub = defineComponent({
      setup: (_props, { slots }) => () => slots.default?.({ Component: ChildPage }),
    })
    const RouterLinkStub = defineComponent({
      setup: (_props, { slots }) => () => h('a', slots.default?.()),
    })

    app = createApp(Settings)
    app.component('RouterView', RouterViewStub)
    app.component('RouterLink', RouterLinkStub)
    ;(app.config.globalProperties as Record<string, unknown>).$route = {
      name: 'profileSettings',
    }
    app.mount(container)
    await flush()

    expect(childMounts).toBe(1)
    expect(container.querySelector('[data-testid="settings-child"]')).not.toBeNull()

    window.dispatchEvent(new Event('focus'))
    await nextTick()

    expect(useUser(false).isLoading.value).toBe(true)
    expect(container.querySelector('[data-testid="settings-child"]')).not.toBeNull()
    expect(container.textContent).not.toContain('加载中，请稍候...')
    expect(childUnmounts).toBe(0)

    for (const resolve of refreshResponses) {
      resolve({ status: 200, content: {} } as never)
    }
    await flush()
  })
})
