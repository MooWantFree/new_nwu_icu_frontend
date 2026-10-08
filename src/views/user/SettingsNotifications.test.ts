import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, type App } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import naive from 'naive-ui'
import RootApp from '@/App.vue'
import Settings from './Settings.vue'
import PasswordSettings from '@/components/settings/PasswordSettings.vue'
import { api } from '@/lib/requests'
import { useUser } from '@/lib/useUser'

vi.mock('@/components/NavBar.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/common/CaptchaChallenge.vue', () => ({ default: { render: () => null } }))
vi.mock('@/lib/requests', () => ({ api: { get: vi.fn(), post: vi.fn() } }))

const profile = {
  id: 1,
  uuid: '00000000-0000-0000-0000-000000000001',
  username: 'campus_user',
  nickname: '西大学生',
  email: 'student@example.test',
  bio: '',
  avatar: '',
  has_avatar: false,
  college_email: '',
  verified: false,
  is_me: true,
  is_staff: false,
  date_joined: '2026-01-01T00:00:00Z',
  unread: { unread: { user: 0, system: 0, like: 0, reply: 0 }, total: 0 },
}

let app: App | undefined
let host: HTMLDivElement
const flush = async () => {
  for (let index = 0; index < 15; index++) { await Promise.resolve(); await nextTick() }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('VITE_FRONTEND_COMMIT', 'unknown')
  vi.stubEnv('VITE_BACKEND_COMMIT', 'unknown')
  vi.stubEnv('VITE_FRONTEND_GITHUB_URL', '')
  vi.stubEnv('VITE_BACKEND_GITHUB_URL', '')
  host = document.createElement('div')
  document.body.append(host)
  useUser(false).login(profile)
  vi.mocked(api.get).mockImplementation(async ({ url }) => ({
    status: 200,
    content: url === '/api/user/profile/' ? profile : profile.unread,
  }) as never)
})

afterEach(() => {
  app?.unmount()
  app = undefined
  host.remove()
  useUser(false).logout()
  vi.unstubAllEnvs()
})

describe('settings notifications', () => {
  it('keeps the password success toast visible after signing out and leaving settings', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { render: () => h('p', '已返回主页') } },
        { path: '/user/me', component: { render: () => null } },
        { path: '/user/settings', component: Settings, children: [
          { path: 'password', name: 'passwordSettings', component: PasswordSettings },
          { path: 'profile', name: 'profileSettings', component: { render: () => null } },
          { path: 'email', name: 'emailSettings', component: { render: () => null } },
          { path: 'private', name: 'privateSettings', component: { render: () => null } },
        ] },
      ],
    })
    await router.push('/user/settings/password')
    await router.isReady()
    app = createApp(RootApp).use(router).use(naive)
    app.mount(host)
    await flush()
    vi.mocked(api.post).mockResolvedValue({ status: 200, content: {}, errors: [] } as never)

    for (const [name, value] of Object.entries({
      old_password: 'OldPassword1',
      new_password: 'NewPassword2',
      confirm_password: 'NewPassword2',
    })) {
      const input = host.querySelector<HTMLInputElement>(`input[name="${name}"]`)!
      input.value = value
      input.dispatchEvent(new Event('input', { bubbles: true }))
    }
    const navigatedHome = new Promise<void>(resolve => {
      const removeGuard = router.afterEach(to => {
        if (to.path !== '/') return
        removeGuard()
        resolve()
      })
    })
    host.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await navigatedHome
    await flush()

    expect(api.post).toHaveBeenCalledOnce()
    expect(useUser(false).isLoggedIn.value).toBe(false)
    expect(router.currentRoute.value.path).toBe('/')
    expect(host.textContent).toContain('已返回主页')
    const toast = [...document.body.querySelectorAll('[role="status"]')]
      .find(element => element.textContent?.includes('密码修改成功，请重新登录'))
    expect(toast).toBeDefined()
    expect(toast?.querySelector('button[aria-label="关闭通知"]')).not.toBeNull()
  })
})
