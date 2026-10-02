import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick, type App } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import ForgetPassword from './ForgetPassword.vue'
import { api } from '@/lib/requests'
import { clearActionToken } from '@/lib/actionTokens'

vi.mock('@/lib/requests', () => ({ api: { get: vi.fn(), post: vi.fn() } }))
vi.mock('naive-ui', () => ({ useMessage: () => ({ success: vi.fn() }) }))

let app: App | undefined
let container: HTMLDivElement

beforeEach(() => {
  vi.resetAllMocks()
  clearActionToken('password-reset')
  container = document.createElement('div')
  document.body.append(container)
})

afterEach(() => {
  app?.unmount()
  app = undefined
  container.remove()
})

const flush = async () => {
  for (let index = 0; index < 5; index += 1) {
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

async function mountPage() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/user/forget-password', name: 'forgetPassword', component: ForgetPassword },
      { path: '/', component: { render: () => null } },
      { path: '/user/login', name: 'login', component: { render: () => null } },
    ],
  })
  await router.push('/user/forget-password')
  app = createApp(ForgetPassword).use(router)
  app.mount(container)
  await flush()
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
