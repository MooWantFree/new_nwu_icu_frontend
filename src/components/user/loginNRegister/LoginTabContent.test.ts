import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, ref, type App } from 'vue'
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

const mountLoadingForm = async () => {
  const loading = ref(false)
  const loginSuccess = vi.fn()
  const loadingChanged = vi.fn((value: boolean) => { loading.value = value })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { render: () => null } },
      { path: '/user/forget-password', name: 'forgetPassword', component: { render: () => null } },
    ],
  })
  const closeModal = vi.fn()
  await router.push('/')
  app = createApp({
    render: () => h(LoginTabContent, {
      loading: loading.value,
      onLoginSuccess: loginSuccess,
      onCloseModal: closeModal,
      'onUpdate:loading': loadingChanged,
    }),
  }).use(router)
  app.mount(container)
  const username = container.querySelector<HTMLInputElement>('#login-username')!
  const password = container.querySelector<HTMLInputElement>('#login-password')!
  username.value = 'test-user'
  username.dispatchEvent(new Event('input'))
  password.value = 'test-password'
  password.dispatchEvent(new Event('input'))
  return { loading, loginSuccess, loadingChanged, closeModal, router, username, password, form: container.querySelector<HTMLFormElement>('form')! }
}

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

  it('submits once while pending, disables the controls, and forwards the successful profile', async () => {
    let finishLogin!: (response: never) => void
    vi.mocked(api.post).mockImplementationOnce(() => new Promise<never>(resolve => { finishLogin = resolve }))
    const { loginSuccess, loadingChanged, username, password, form } = await mountLoadingForm()
    form.dispatchEvent(new Event('submit', { cancelable: true }))
    form.dispatchEvent(new Event('submit', { cancelable: true }))
    await flush()
    expect(api.post).toHaveBeenCalledOnce()
    expect(username.disabled).toBe(true)
    expect(password.disabled).toBe(true)
    expect(container.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true)
    expect(loginSuccess).not.toHaveBeenCalled()
    expect(loadingChanged).toHaveBeenCalledWith(true)

    const profile = { id: 7, nickname: '测试用户' }
    finishLogin({ status: 200, content: profile, data: { contents: profile } } as never)
    await flush()
    expect(loginSuccess).toHaveBeenCalledOnce()
    expect(loginSuccess).toHaveBeenCalledWith(profile)
    expect(loadingChanged.mock.calls.map(([value]) => value)).toEqual([true, false])
    expect(username.disabled).toBe(false)
    expect(password.disabled).toBe(false)
    expect(username.value).toBe('test-user')
    expect(password.value).toBe('test-password')
  })

  it('ignores a submitted form while the parent already reports a pending operation', async () => {
    const { loading, loginSuccess, form } = await mountLoadingForm()
    loading.value = true
    await nextTick()
    form.dispatchEvent(new Event('submit', { cancelable: true }))
    await flush()
    expect(api.post).not.toHaveBeenCalled()
    expect(loginSuccess).not.toHaveBeenCalled()
  })

  it('closes the modal before opening the named password recovery route without submitting credentials', async () => {
    const { router, closeModal } = await mountLoadingForm()
    const push = vi.spyOn(router, 'push')
    const forgotPassword = [...container.querySelectorAll<HTMLButtonElement>('button')]
      .find(button => button.textContent?.trim() === '忘记密码？')!
    expect(forgotPassword.type).toBe('button')
    expect(forgotPassword.closest('label')).toBeNull()
    forgotPassword.click()
    expect(closeModal).toHaveBeenCalledOnce()
    expect(push).toHaveBeenCalledWith({ name: 'forgetPassword' })
    expect(closeModal.mock.invocationCallOrder[0]).toBeLessThan(push.mock.invocationCallOrder[0])
    await new Promise(resolve => setTimeout(resolve, 0))
    await flush()
    expect(router.currentRoute.value.path).toBe('/user/forget-password')
    expect(api.post).not.toHaveBeenCalled()
  })

  it('disables password recovery while a request is pending', async () => {
    const { loading, router, closeModal } = await mountLoadingForm()
    loading.value = true
    await nextTick()
    const forgotPassword = [...container.querySelectorAll<HTMLButtonElement>('button')]
      .find(button => button.textContent?.trim() === '忘记密码？')!
    expect(forgotPassword.disabled).toBe(true)
    forgotPassword.click()
    await flush()
    expect(closeModal).not.toHaveBeenCalled()
    expect(router.currentRoute.value.path).toBe('/')
    expect(api.post).not.toHaveBeenCalled()
  })
})
