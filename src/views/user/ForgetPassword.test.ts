import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, type App } from 'vue'
import { createMemoryHistory, createRouter, RouterView, type Router } from 'vue-router'
import ForgetPassword from './ForgetPassword.vue'
import { api } from '@/lib/requests'
import { captureActionTokenFromUrl, clearActionToken, getActionToken } from '@/lib/actionTokens'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))

vi.mock('@/lib/requests', () => ({ api: { get: vi.fn(), post: vi.fn() } }))
vi.mock('@/lib/useShadcnToast', () => ({ useShadcnToast: () => toast }))

let app: App | undefined
let container: HTMLDivElement

beforeEach(() => {
  vi.resetAllMocks()
  for (const purpose of ['password-reset', 'account-activation', 'college-email-bind'] as const) {
    clearActionToken(purpose)
  }
  window.history.replaceState({}, '', '/')
  container = document.createElement('div')
  document.body.append(container)
})

afterEach(() => {
  app?.unmount()
  app = undefined
  container.remove()
  for (const purpose of ['password-reset', 'account-activation', 'college-email-bind'] as const) {
    clearActionToken(purpose)
  }
  window.history.replaceState({}, '', '/')
})

const flush = async () => {
  for (let index = 0; index < 12; index += 1) {
    await Promise.resolve()
    await nextTick()
  }
}

const captchaResponse = (key: string) => ({
  status: 200,
  content: { key, image_url: `/captcha-${key}.png` },
})

function deferredResponse() {
  let resolve!: (value: never) => void
  const promise = new Promise<never>(resolvePromise => { resolve = resolvePromise })
  return { promise, resolve }
}

async function mountPage(path = '/user/forget-password') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/user/forget-password', name: 'forgetPassword', component: ForgetPassword },
      { path: '/', component: { render: () => null } },
      { path: '/login', name: 'login', component: { render: () => null } },
    ],
  })
  await router.push(path)
  await router.isReady()
  app = createApp({ render: () => h(RouterView) }).use(router)
  app.mount(container)
  await flush()
  return router
}

async function navigateFromAction(router: Router, action: () => void) {
  const navigated = new Promise<void>(resolve => {
    const removeGuard = router.afterEach(() => { removeGuard(); resolve() })
  })
  action()
  await navigated
  await flush()
}

function rememberToken(path = '/user/forget-password', token = 'reset-secret') {
  window.history.replaceState({}, '', `${path}#token=${encodeURIComponent(token)}`)
  captureActionTokenFromUrl()
}

function button(label: string) {
  const target = [...container.querySelectorAll<HTMLButtonElement>('button')]
    .find(candidate => candidate.textContent?.trim() === label)
  if (!target) throw new Error(`Missing button: ${label}`)
  return target
}

function input(id: string) {
  const target = container.querySelector<HTMLInputElement>(`#${id}`)
  if (!target) throw new Error(`Missing input: ${id}`)
  return target
}

async function setInput(id: string, value: string) {
  const field = input(id)
  field.value = value
  field.dispatchEvent(new Event('input', { bubbles: true }))
  await nextTick()
}

async function completeCaptcha() {
  captchaImage().dispatchEvent(new Event('load'))
  await nextTick()
}

async function submitForm() {
  const form = container.querySelector('form')
  expect(form).not.toBeNull()
  form!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  await flush()
}

async function fillReset(password = 'NewPass123', confirmation = password, captcha = 'AB12') {
  await setInput('new-password', password)
  await setInput('confirm-password', confirmation)
  await setInput('reset-captcha', captcha)
}

function expectInlineError(id: string, text: string) {
  const field = input(id)
  expect(field.getAttribute('aria-invalid')).toBe('true')
  const descriptionIds = field.getAttribute('aria-describedby')?.split(' ') ?? []
  expect(descriptionIds.some(descriptionId => document.getElementById(descriptionId)?.textContent?.includes(text)))
    .toBe(true)
  expect(document.activeElement).toBe(field)
}

function refreshButton() {
  const element = container.querySelector<HTMLButtonElement>('button[aria-label="刷新验证码"]')
  expect(element).not.toBeNull()
  return element!
}

function captchaImage() {
  const element = container.querySelector<HTMLImageElement>('img')
  expect(element).not.toBeNull()
  return element!
}

function expectRefreshing(refreshing: boolean) {
  expect(refreshButton().disabled).toBe(refreshing)
  expect(refreshButton().getAttribute('aria-busy')).toBe(String(refreshing))
  expect(Boolean(container.querySelector('[role="status"][aria-label="正在刷新"]')))
    .toBe(refreshing)
}

describe('ForgetPassword captcha refresh', () => {
  it('recovers from an API failure after a valid image and waits for the retry image to load', async () => {
    vi.mocked(api.get).mockResolvedValueOnce(captchaResponse('initial') as never)
    await mountPage()
    expectRefreshing(true)
    captchaImage().dispatchEvent(new Event('load'))
    await nextTick()
    expectRefreshing(false)

    const failedRefresh = deferredResponse()
    vi.mocked(api.get).mockReturnValueOnce(failedRefresh.promise)
    refreshButton().click()
    await nextTick()
    expectRefreshing(true)
    expect(container.querySelector('img')).toBeNull()
    expect(api.get).toHaveBeenCalledTimes(2)

    failedRefresh.resolve({ status: 503, content: {} } as never)
    await flush()
    expectRefreshing(false)
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('[role="alert"]')?.textContent)
      .toContain('获取验证码失败，请重试')

    const retry = deferredResponse()
    vi.mocked(api.get).mockReturnValueOnce(retry.promise)
    refreshButton().click()
    await nextTick()
    expectRefreshing(true)
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('[role="alert"]')?.textContent)
      .toContain('获取验证码失败，请重试')

    retry.resolve(captchaResponse('retry') as never)
    await flush()
    expectRefreshing(true)
    expect(captchaImage().getAttribute('src')).toBe('/captcha-retry.png')
    expect(captchaImage().getAttribute('alt')).toBe('')
    expect(captchaImage().classList.contains('invisible')).toBe(true)
    captchaImage().dispatchEvent(new Event('load'))
    await nextTick()
    expectRefreshing(false)
    expect(captchaImage().classList.contains('invisible')).toBe(false)
    expect(api.post).not.toHaveBeenCalled()
  })

  it('shows an image failure and clears that error when retrying the image', async () => {
    vi.mocked(api.get).mockResolvedValueOnce(captchaResponse('initial') as never)
    await mountPage()
    captchaImage().dispatchEvent(new Event('load'))
    await nextTick()
    expectRefreshing(false)

    vi.mocked(api.get).mockResolvedValueOnce(captchaResponse('failed-image') as never)
    refreshButton().click()
    await flush()
    expectRefreshing(true)
    captchaImage().dispatchEvent(new Event('error'))
    await nextTick()
    expectRefreshing(false)
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('[role="alert"]')?.textContent)
      .toContain('验证码加载失败，请重试')

    const retry = deferredResponse()
    vi.mocked(api.get).mockReturnValueOnce(retry.promise)
    refreshButton().click()
    await nextTick()
    expectRefreshing(true)
    expect(container.querySelector('[role="alert"]')).toBeNull()

    retry.resolve(captchaResponse('failed-image') as never)
    await flush()
    expectRefreshing(true)
    expect(captchaImage().classList.contains('invisible')).toBe(true)
    captchaImage().dispatchEvent(new Event('load'))
    await nextTick()
    expectRefreshing(false)
    expect(captchaImage().classList.contains('invisible')).toBe(false)
    expect(container.querySelector('[role="alert"]')).toBeNull()
    expect(api.post).not.toHaveBeenCalled()
  })
})

describe('ForgetPassword email request', () => {
  it('posts the registered email and captcha, then opens a fresh form when requesting another email', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce(captchaResponse('initial') as never)
      .mockResolvedValueOnce(captchaResponse('resend') as never)
    vi.mocked(api.post).mockResolvedValue({ status: 200, content: {}, errors: [] } as never)
    await mountPage()
    await completeCaptcha()
    await setInput('email', 'student@example.com')
    await setInput('reset-captcha', 'AB12')
    await submitForm()

    expect(api.post).toHaveBeenCalledExactlyOnceWith({
      url: '/api/user/reset/',
      query: { email: 'student@example.com', captcha_key: 'initial', captcha_value: 'AB12' },
    })
    expect(container.querySelector('h1')?.textContent).toContain('检查你的邮箱')
    expect(container.querySelector('form')).toBeNull()
    button('重新发送').click()
    await flush()
    expect(input('email').value).toBe('student@example.com')
    expect(input('reset-captcha').value).toBe('')
    expect(api.get).toHaveBeenCalledTimes(2)
    expect(api.post).toHaveBeenCalledOnce()
    await completeCaptcha()
    await setInput('reset-captcha', 'CD34')
    await submitForm()
    expect(api.post).toHaveBeenLastCalledWith({
      url: '/api/user/reset/',
      query: { email: 'student@example.com', captcha_key: 'resend', captcha_value: 'CD34' },
    })
    expect(api.post).toHaveBeenCalledTimes(2)
  })

  it('allows only one request and disables editing while the email is being sent', async () => {
    const pending = deferredResponse()
    vi.mocked(api.get).mockResolvedValueOnce(captchaResponse('initial') as never)
    vi.mocked(api.post).mockReturnValueOnce(pending.promise)
    await mountPage()
    await completeCaptcha()
    await setInput('email', 'student@example.com')
    await setInput('reset-captcha', 'AB12')
    await submitForm()
    await submitForm()

    expect(api.post).toHaveBeenCalledOnce()
    expect(input('email').disabled).toBe(true)
    expect(input('reset-captcha').disabled).toBe(true)
    expect(refreshButton().disabled).toBe(true)
    expect(container.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true)
    pending.resolve({ status: 200, content: {}, errors: [] } as never)
    await flush()
    expect(container.querySelector('h1')?.textContent).toContain('检查你的邮箱')
  })
})

describe('ForgetPassword email link', () => {
  it('only verifies on entry and waits for verification before loading the password form', async () => {
    rememberToken()
    const verification = deferredResponse()
    vi.mocked(api.post).mockReturnValueOnce(verification.promise)
    vi.mocked(api.get).mockResolvedValueOnce(captchaResponse('reset') as never)
    await mountPage()

    expect(api.post).toHaveBeenCalledExactlyOnceWith({
      url: '/api/user/mail-reset/verify/', query: { token: 'reset-secret' },
    })
    expect(api.get).not.toHaveBeenCalled()
    expect(container.querySelector('form')).toBeNull()
    expect(container.querySelector('[role="status"]')?.textContent).toContain('正在验证')
    expect(getActionToken('password-reset')).toBe('reset-secret')
    verification.resolve({ status: 200, content: {}, errors: [] } as never)
    await flush()
    await completeCaptcha()
    expect(input('new-password').autocomplete).toBe('new-password')
    expect(input('confirm-password').autocomplete).toBe('new-password')
    expect(container.querySelector('#email')).toBeNull()
    expect(api.get).toHaveBeenCalledExactlyOnceWith({ url: '/api/captcha/' })
    expect(api.post).toHaveBeenCalledOnce()
    expect(getActionToken('password-reset')).toBe('reset-secret')
  })

  it('submits once while busy, clears the token only after success, and links to login', async () => {
    rememberToken()
    const reset = deferredResponse()
    vi.mocked(api.post)
      .mockResolvedValueOnce({ status: 200, content: {}, errors: [] } as never)
      .mockReturnValueOnce(reset.promise)
    vi.mocked(api.get).mockResolvedValueOnce(captchaResponse('reset') as never)
    const router = await mountPage()
    await completeCaptcha()
    await fillReset()
    await submitForm()
    await submitForm()

    expect(api.post).toHaveBeenCalledTimes(2)
    expect(api.post).toHaveBeenLastCalledWith({
      url: '/api/user/mail-reset/',
      query: {
        token: 'reset-secret', new_password: 'NewPass123', confirm_password: 'NewPass123',
        captcha_key: 'reset', captcha_value: 'AB12',
      },
    })
    expect(getActionToken('password-reset')).toBe('reset-secret')
    for (const id of ['new-password', 'confirm-password', 'reset-captcha']) {
      expect(input(id).disabled).toBe(true)
    }
    expect(refreshButton().disabled).toBe(true)
    expect(container.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true)
    expect(toast.success).not.toHaveBeenCalled()
    reset.resolve({ status: 200, content: {}, errors: [] } as never)
    await flush()

    expect(getActionToken('password-reset')).toBe('')
    expect(container.querySelector('h1')?.textContent).toContain('密码重置成功')
    expect(container.querySelector('form')).toBeNull()
    expect(toast.success).toHaveBeenCalledExactlyOnceWith('密码重置成功')
    const loginLink = [...container.querySelectorAll<HTMLAnchorElement>('a')]
      .find(link => link.textContent?.trim() === '前往登录')
    expect(loginLink?.getAttribute('href')).toBe('/login')
    await navigateFromAction(router, () => loginLink!.click())
    expect(router.currentRoute.value.name).toBe('login')
    expect(api.post).toHaveBeenCalledTimes(2)
  })

  it.each([400, 401])('keeps the reset token when submission returns %s', async status => {
    rememberToken()
    vi.mocked(api.post)
      .mockResolvedValueOnce({ status: 200, content: {}, errors: [] } as never)
      .mockResolvedValueOnce({
        status, content: {}, errors: [{ field: 'captcha', err_code: 'invalid', err_msg: '验证码不正确' }],
      } as never)
    vi.mocked(api.get).mockResolvedValue(captchaResponse('reset') as never)
    await mountPage()
    await completeCaptcha()
    await fillReset()
    await submitForm()

    expect(getActionToken('password-reset')).toBe('reset-secret')
    expect(toast.success).not.toHaveBeenCalled()
    if (status === 401) {
      expect(container.textContent).toContain('重置链接不可用')
      expect(button('重新申请重置链接')).toBeDefined()
    } else {
      expect(input('new-password').value).toBe('NewPass123')
      expect(container.textContent).toContain('验证码不正确')
      expect(api.get).toHaveBeenCalledTimes(2)
    }
  })

  it.each(['network', 'server'] as const)('retries a %s verification failure without discarding the token', async failure => {
    rememberToken()
    if (failure === 'network') vi.mocked(api.post).mockRejectedValueOnce(new Error('offline'))
    else vi.mocked(api.post).mockResolvedValueOnce({ status: 503, content: {}, errors: [] } as never)
    vi.mocked(api.post).mockResolvedValueOnce({ status: 200, content: {}, errors: [] } as never)
    vi.mocked(api.get).mockResolvedValueOnce(captchaResponse('retry') as never)
    await mountPage()

    expect(container.querySelector('h1')?.textContent).toContain('暂时无法验证链接')
    expect(getActionToken('password-reset')).toBe('reset-secret')
    expect(api.get).not.toHaveBeenCalled()
    button('重新验证链接').click()
    await flush()
    await completeCaptcha()
    expect(api.post).toHaveBeenCalledTimes(2)
    expect(api.post).toHaveBeenLastCalledWith({
      url: '/api/user/mail-reset/verify/', query: { token: 'reset-secret' },
    })
    expect(input('new-password')).toBeDefined()
    expect(getActionToken('password-reset')).toBe('reset-secret')
  })

  it('explicitly clears only the reset token and token URL fields when requesting a new link', async () => {
    rememberToken('/user/activate', 'activation-secret')
    rememberToken('/user/bind-college-email', 'binding-secret')
    rememberToken()
    vi.mocked(api.post).mockResolvedValueOnce({ status: 400, content: {}, errors: [] } as never)
    vi.mocked(api.get).mockResolvedValueOnce(captchaResponse('new-request') as never)
    const router = await mountPage('/user/forget-password?token=legacy-reset&source=email#token=hash-reset&section=help')

    expect(getActionToken('password-reset')).toBe('reset-secret')
    expect(api.get).not.toHaveBeenCalled()
    await navigateFromAction(router, () => button('重新申请重置链接').click())
    expect(getActionToken('password-reset')).toBe('')
    expect(getActionToken('account-activation')).toBe('activation-secret')
    expect(getActionToken('college-email-bind')).toBe('binding-secret')
    expect(router.currentRoute.value.query).toEqual({ source: 'email' })
    expect(new URLSearchParams(router.currentRoute.value.hash.slice(1)).get('token')).toBeNull()
    expect(new URLSearchParams(router.currentRoute.value.hash.slice(1)).get('section')).toBe('help')
    expect(router.currentRoute.value.name).toBe('forgetPassword')
    expect(input('email')).toBeDefined()
    expect(container.querySelector('#new-password')).toBeNull()
    expect(api.post).toHaveBeenCalledOnce()
    expect(api.get).toHaveBeenCalledExactlyOnceWith({ url: '/api/captcha/' })
    await completeCaptcha()
    await setInput('email', 'student@example.com')
    await setInput('reset-captcha', 'AB12')
    vi.mocked(api.post).mockResolvedValueOnce({ status: 200, content: {}, errors: [] } as never)
    await submitForm()
    expect(api.post).toHaveBeenLastCalledWith({
      url: '/api/user/reset/',
      query: { email: 'student@example.com', captcha_key: 'new-request', captcha_value: 'AB12' },
    })
  })

  it.each([
    ['Aa12345', 'Aa12345', 'AB12', 'new-password', '密码长度至少为8个字符'],
    [`Aa${'1'.repeat(29)}`, `Aa${'1'.repeat(29)}`, 'AB12', 'new-password', '密码长度不能超过30个字符'],
    ['newpass123', 'newpass123', 'AB12', 'new-password', '密码必须包含至少一个大写字母、一个小写字母和一个数字'],
    ['NewPass123', 'OtherPass123', 'AB12', 'confirm-password', '两次输入的密码不一致'],
    ['NewPass123', 'NewPass123', '', 'reset-captcha', '请输入验证码'],
  ] as const)('focuses the invalid %s field and does not submit a password reset', async (password, confirmation, captcha, field, message) => {
    rememberToken()
    vi.mocked(api.post).mockResolvedValueOnce({ status: 200, content: {}, errors: [] } as never)
    vi.mocked(api.get).mockResolvedValueOnce(captchaResponse('reset') as never)
    await mountPage()
    await completeCaptcha()
    await fillReset(password, confirmation, captcha)
    await submitForm()

    expectInlineError(field, message)
    expect(api.post).toHaveBeenCalledOnce()
    expect(getActionToken('password-reset')).toBe('reset-secret')
    expect(toast.success).not.toHaveBeenCalled()
    expect(toast.error).not.toHaveBeenCalled()
  })
})
