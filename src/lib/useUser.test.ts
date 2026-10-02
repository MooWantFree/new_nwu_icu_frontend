import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, type App } from 'vue'
import { api } from '@/lib/requests'
import { useUser } from './useUser'
import ActionButtons from '@/components/navbar/ActionButtons.vue'

vi.mock('@/lib/requests', () => ({ api: { get: vi.fn() } }))

const unread = (system: number) => ({ unread: { user: 0, reply: 0, like: 0, system }, total: system })
const profile: Parameters<ReturnType<typeof useUser>['login']>[0] = {
  id: 1, username: 'tester', nickname: 'Tester', email: 'tester@example.com',
  date_joined: '2026-01-01T00:00:00Z', avatar: '',
  uuid: '00000000-0000-0000-0000-000000000001', has_avatar: false,
  verified: false, is_staff: false, unread: unread(0),
}
const response = (system: number) => ({ status: 200, content: unread(system) }) as never
const deferred = () => {
  let resolve!: (value: never) => void
  const promise = new Promise<never>(res => { resolve = res })
  return { promise, resolve }
}
let app: App | undefined
let container: HTMLDivElement | undefined

beforeEach(() => {
  vi.mocked(api.get).mockReset().mockResolvedValue(response(0))
  useUser(false).login(profile)
})
afterEach(() => {
  app?.unmount(); app = undefined
  container?.remove(); container = undefined
  useUser(false).logout()
})

describe('shared unread counts', () => {
  it('refreshes unread counts without a profile request or authentication loader', async () => {
    vi.mocked(api.get).mockResolvedValue(response(3))
    await useUser(false).fetchUnreadCount()
    expect(api.get).toHaveBeenCalledWith({ url: '/api/message/unread/' })
    expect(api.get).toHaveBeenCalledOnce()
    expect(useUser(false).userInfo.value?.unread.total).toBe(3)
    expect(useUser(false).isLoading.value).toBe(false)
  })

  it('ignores an older poll after a newer read refresh', async () => {
    const old = deferred(), latest = deferred()
    vi.mocked(api.get).mockReturnValueOnce(old.promise).mockReturnValueOnce(latest.promise)
    const oldRequest = useUser(false).fetchUnreadCount()
    const latestRequest = useUser(false).fetchUnreadCount()
    latest.resolve(response(0)); await latestRequest
    old.resolve(response(7)); await oldRequest
    expect(useUser(false).userInfo.value?.unread.total).toBe(0)
  })

  it('ignores a request from a previous login even for the same account', async () => {
    const old = deferred()
    vi.mocked(api.get).mockReturnValueOnce(old.promise)
    const request = useUser(false).fetchUnreadCount()
    useUser(false).logout()
    useUser(false).login(profile)
    old.resolve(response(7)); await request
    expect(useUser(false).userInfo.value?.unread.total).toBe(0)
  })

  it('keeps a newer read refresh when a slower profile refresh finishes', async () => {
    const profileResponse = deferred(), oldUnread = deferred(), latestUnread = deferred()
    vi.mocked(api.get)
      .mockReturnValueOnce(profileResponse.promise)
      .mockReturnValueOnce(oldUnread.promise)
      .mockReturnValueOnce(latestUnread.promise)
    const profileRequest = useUser(false).fetchUserInfo()
    const latestRequest = useUser(false).fetchUnreadCount()
    profileResponse.resolve({ status: 200, content: profile } as never)
    oldUnread.resolve(response(7)); await profileRequest
    latestUnread.resolve(response(0)); await latestRequest
    expect(useUser(false).userInfo.value?.unread.total).toBe(0)
  })

  it('retains the shared counts and login on an unsuccessful refresh', async () => {
    useUser(false).login({ ...profile, unread: unread(3) })
    vi.mocked(api.get).mockResolvedValue({ status: 503 } as never)
    await useUser(false).fetchUnreadCount()
    expect(useUser(false).userInfo.value?.unread.total).toBe(3)
    expect(useUser(false).isLoggedIn.value).toBe(true)
  })

  it('updates the top notification badge from the same shared data', async () => {
    vi.mocked(api.get).mockImplementation(({ url }) => Promise.resolve({
      status: 200, content: url === '/api/user/profile/' ? profile : unread(0),
    } as never))
    container = document.createElement('div'); document.body.append(container)
    app = createApp(ActionButtons)
    app.component('RouterLink', defineComponent({ setup: (_, { slots }) => () => h('a', slots.default?.()) }))
    app.mount(container)
    for (let i = 0; i < 8; i += 1) { await Promise.resolve(); await nextTick() }
    expect(container.querySelector('a span')).toBeNull()

    vi.mocked(api.get).mockResolvedValue(response(5))
    await useUser(false).fetchUnreadCount(); await nextTick()
    expect(container.querySelector('a span')?.textContent?.trim()).toBe('5')
    vi.mocked(api.get).mockResolvedValue(response(0))
    await useUser(false).fetchUnreadCount(); await nextTick()
    expect(container.querySelector('a span')).toBeNull()
  })
})
