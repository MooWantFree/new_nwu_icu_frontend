import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, type App } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import LoginTabContent from './LoginTabContent.vue'
import { api } from '@/lib/requests'

vi.mock('@/lib/requests', () => ({ api: { post: vi.fn() } }))

const flush = async () => {
  for (let index = 0; index < 10; index += 1) {
    await Promise.resolve()
    await nextTick()
  }
}

let app: App | undefined
let container: HTMLDivElement

beforeEach(() => {
  vi.clearAllMocks()
  container = document.createElement('div')
  document.body.append(container)
})

afterEach(() => {
  app?.unmount()
  app = undefined
  container.remove()
})

describe('LoginTabContent', () => {
  it('shows the backend credentials error after a rejected login', async () => {
    vi.mocked(api.post).mockResolvedValue({
      status: 401,
      content: {},
      errors: [{
        field: 'credentials',
        err_code: 'password_incorrect',
        err_msg: '用户名或密码错误',
      }],
    } as never)

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: { render: () => null } }],
    })
    await router.push('/')

    app = createApp({
      render: () => h(LoginTabContent, { loading: false }),
    }).use(router)
    app.mount(container)

    const username = container.querySelector('#login-username') as HTMLInputElement
    const password = container.querySelector('#login-password') as HTMLInputElement
    username.value = 'test-user'
    username.dispatchEvent(new Event('input'))
    password.value = 'wrong-password'
    password.dispatchEvent(new Event('input'))
    ;(container.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'))
    await flush()

    expect(api.post).toHaveBeenCalledWith({
      url: '/api/user/login/',
      query: { username: 'test-user', password: 'wrong-password' },
    })
    const alert = container.querySelector('[role="alert"]')
    expect(alert?.textContent).toContain('用户名或密码错误')
  })

  it('shows a fallback message when a non-success response has no field errors', async () => {
    vi.mocked(api.post).mockResolvedValue({
      status: 403,
      data: { message: '', contents: {} },
      content: {},
      errors: undefined,
    } as never)

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: { render: () => null } }],
    })
    await router.push('/')

    app = createApp({
      render: () => h(LoginTabContent, { loading: false }),
    }).use(router)
    app.mount(container)

    const username = container.querySelector('#login-username') as HTMLInputElement
    const password = container.querySelector('#login-password') as HTMLInputElement
    username.value = 'test-user'
    username.dispatchEvent(new Event('input'))
    password.value = 'wrong-password'
    password.dispatchEvent(new Event('input'))
    ;(container.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'))
    await flush()

    const alert = container.querySelector('[role="alert"]')
    expect(alert?.textContent).toContain('登录请求未通过安全校验，请刷新页面后重试')
  })
})
