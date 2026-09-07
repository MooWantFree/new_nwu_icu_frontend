import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, type App } from 'vue'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'

import Manage from './Manage.vue'
import { api } from '@/lib/requests'
import {
  browserSupportsWebAuthn,
  startAuthentication,
  startRegistration,
} from '@simplewebauthn/browser'

vi.mock('@/lib/requests', () => ({ api: { get: vi.fn(), post: vi.fn() } }))
vi.mock('@simplewebauthn/browser', () => ({
  browserSupportsWebAuthn: vi.fn(),
  startAuthentication: vi.fn(),
  startRegistration: vi.fn(),
}))
vi.mock('@/components/guestbook/GuestbookEditor.vue', () => ({
  default: { render: () => h('textarea') },
}))

const baseSession = {
  passkey_enrolled: true,
  passkey_count: 1,
  elevated: false,
  elevated_until: null,
  permissions: {
    moderate_reports: true,
    publish_announcements: true,
    review_resource_uploads: true,
  },
}

const flush = async () => {
  for (let index = 0; index < 12; index += 1) {
    await Promise.resolve()
    await nextTick()
  }
}

let app: App | undefined
let container: HTMLDivElement

const mountManage = async (query = '') => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/manage', component: Manage }],
  })
  await router.push(`/manage${query}`)
  app = createApp({ render: () => h(RouterView) }).use(router)
  app.mount(container)
  await flush()
  return router
}

const findButton = (text: string) => [...container.querySelectorAll('button')]
  .find(button => button.textContent?.includes(text)) as HTMLButtonElement

beforeEach(() => {
  vi.clearAllMocks()
  container = document.createElement('div')
  document.body.append(container)
  vi.mocked(api.get).mockResolvedValue({ status: 200, content: baseSession } as never)
  vi.mocked(browserSupportsWebAuthn).mockReturnValue(true)
})

afterEach(() => {
  app?.unmount()
  container.remove()
})

describe('management Passkey flow', () => {
  it('shows a disabled fallback when WebAuthn is unsupported', async () => {
    vi.mocked(browserSupportsWebAuthn).mockReturnValue(false)
    await mountManage()

    const button = findButton('当前浏览器不支持 Passkey')
    expect(button.disabled).toBe(true)
    expect(startAuthentication).not.toHaveBeenCalled()
  })

  it.each([
    ['取消', new Error('用户取消了 Passkey 验证')],
    ['超时', new Error('Passkey 验证超时')],
  ])('surfaces browser %s without sending a verify request', async (_label, browserError) => {
    vi.mocked(api.post).mockResolvedValueOnce({ status: 200, content: {} } as never)
    vi.mocked(startAuthentication).mockRejectedValueOnce(browserError)
    await mountManage()

    findButton('验证 Passkey').click()
    await flush()

    expect(container.textContent).toContain(browserError.message)
    expect(api.post).toHaveBeenCalledTimes(1)
  })

  it('shows server verification failures and does not enter the panel', async () => {
    vi.mocked(api.post)
      .mockResolvedValueOnce({ status: 200, content: {} } as never)
      .mockResolvedValueOnce({
        status: 400,
        errors: [{ field: 'passkey', err_code: 'passkey_verification_failed', err_msg: 'Passkey 验证失败，请重试' }],
      } as never)
    vi.mocked(startAuthentication).mockResolvedValueOnce({ id: 'credential' } as never)
    await mountManage('?next=https://evil.example/')

    findButton('验证 Passkey').click()
    await flush()

    expect(container.textContent).toContain('Passkey 验证失败，请重试')
    expect([...container.querySelectorAll('h1')].some(heading => heading.textContent === '管理员面板')).toBe(false)
  })

  it('supports first enrollment and reports browser registration cancellation', async () => {
    vi.mocked(api.get).mockResolvedValue({
      status: 200,
      content: { ...baseSession, passkey_enrolled: false, passkey_count: 0 },
    } as never)
    vi.mocked(api.post).mockResolvedValueOnce({ status: 200, content: {} } as never)
    vi.mocked(startRegistration).mockRejectedValueOnce(new Error('已取消创建 Passkey'))
    await mountManage()

    const inputs = container.querySelectorAll('input')
    ;(inputs[0] as HTMLInputElement).value = 'Security key'
    inputs[0].dispatchEvent(new Event('input'))
    ;(inputs[1] as HTMLInputElement).value = 'one-time-code'
    inputs[1].dispatchEvent(new Event('input'))
    await nextTick()
    findButton('绑定 Passkey').click()
    await flush()

    expect(container.textContent).toContain('已取消创建 Passkey')
    expect(api.post).toHaveBeenCalledTimes(1)
  })

  it('surfaces an actionable KeePassXC localhost error even when followed by an empty response', async () => {
    vi.mocked(api.get).mockResolvedValue({
      status: 200,
      content: { ...baseSession, passkey_enrolled: false, passkey_count: 0 },
    } as never)
    vi.mocked(api.post).mockResolvedValueOnce({ status: 200, content: {} } as never)
    vi.mocked(startRegistration).mockImplementationOnce(async () => {
      document.dispatchEvent(new CustomEvent('kpxc-passkeys-response', {
        detail: { errorCode: '25', errorMessage: '提供的 URL 无效' },
      }))
      document.dispatchEvent(new CustomEvent('kpxc-passkeys-response', {
        detail: { fallback: false },
      }))
      throw new Error('Registration was not completed')
    })
    await mountManage()

    const inputs = container.querySelectorAll('input')
    ;(inputs[0] as HTMLInputElement).value = 'KeePassXC'
    inputs[0].dispatchEvent(new Event('input'))
    ;(inputs[1] as HTMLInputElement).value = 'one-time-code'
    inputs[1].dispatchEvent(new Event('input'))
    await nextTick()
    findButton('绑定 Passkey').click()
    await flush()

    expect(container.textContent).toContain('KeePassXC-Browser 错误码 25')
    expect(container.textContent).toContain('提供的 URL 无效')
    expect(container.textContent).toContain('允许将 localhost 用于 Passkey')
    expect(api.post).toHaveBeenCalledTimes(1)
  })

  it('explains a KeePassXC empty response without claiming an error code exists', async () => {
    vi.mocked(api.get).mockResolvedValue({
      status: 200,
      content: { ...baseSession, passkey_enrolled: false, passkey_count: 0 },
    } as never)
    vi.mocked(api.post).mockResolvedValueOnce({ status: 200, content: {} } as never)
    vi.mocked(startRegistration).mockImplementationOnce(async () => {
      document.dispatchEvent(new CustomEvent('kpxc-passkeys-response', {
        detail: { fallback: false },
      }))
      throw new Error('Registration was not completed')
    })
    await mountManage()

    const inputs = container.querySelectorAll('input')
    ;(inputs[0] as HTMLInputElement).value = 'KeePassXC'
    inputs[0].dispatchEvent(new Event('input'))
    ;(inputs[1] as HTMLInputElement).value = 'one-time-code'
    inputs[1].dispatchEvent(new Event('input'))
    await nextTick()
    findButton('绑定 Passkey').click()
    await flush()

    expect(container.textContent).toContain('扩展返回了空响应')
    expect(container.textContent).not.toContain('KeePassXC-Browser 错误码')
    expect(api.post).toHaveBeenCalledTimes(1)
  })

  it('offers another enrollment after an administrator is elevated', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ status: 200, content: { ...baseSession, elevated: true } } as never)
      .mockResolvedValueOnce({
        status: 200,
        content: { results: [], page: 1, max_page: 1, count: 0 },
      } as never)
    await mountManage()

    findButton('添加备用 Passkey').click()
    await nextTick()

    expect(container.textContent).toContain('添加管理员 Passkey')
    expect(container.querySelectorAll('input')).toHaveLength(2)
  })
})
