import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick, type App } from 'vue'
import PrivateSettings from './PrivateSettings.vue'

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), success: vi.fn() }))
vi.mock('@/lib/requests', () => ({ api: { get: mocks.get, post: mocks.post } }))
vi.mock('@/lib/useShadcnToast', () => ({ useShadcnToast: () => ({ success: mocks.success }) }))

const response = (review = 2, reply = 1) => ({
  status: 200,
  content: { review: { setting: review, explain: '' }, reply: { setting: reply, explain: '' } },
})
const deferred = <T>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(accept => { resolve = accept })
  return { promise, resolve }
}
const flush = async () => {
  for (let index = 0; index < 8; index++) { await Promise.resolve(); await nextTick() }
}

let app: App | undefined
let host: HTMLDivElement
const mount = async () => {
  app = createApp(PrivateSettings)
  app.mount(host)
  await flush()
}
const submit = async () => {
  host.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  await flush()
}
const saveButton = () => host.querySelector<HTMLButtonElement>('button[type="submit"]')!
const radio = (group: 'review' | 'reply', value: number) => host.querySelector<HTMLInputElement>(`input[name="privacy-${group}"][value="${value}"]`)!
const choose = async (group: 'review' | 'reply', value: number) => {
  radio(group, value).click()
  await nextTick()
}
const retryButton = () => [...host.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent?.trim() === '重新加载')!

beforeEach(() => {
  mocks.get.mockReset().mockResolvedValue(response())
  mocks.post.mockReset()
  mocks.success.mockClear()
  host = document.createElement('div')
  document.body.append(host)
})
afterEach(() => {
  app?.unmount()
  app = undefined
  host.remove()
})

describe('privacy settings', () => {
  it('reads the saved levels into accessible independent radio groups and avoids unchanged writes', async () => {
    await mount()
    expect(mocks.get).toHaveBeenCalledExactlyOnceWith({ url: '/api/user/private/' })
    expect([...host.querySelectorAll('legend')].map(element => element.textContent)).toEqual(['课程评价', '课程评价回复'])
    expect(radio('review', 2).checked).toBe(true)
    expect(radio('reply', 1).checked).toBe(true)
    expect(host.querySelectorAll('input[type="radio"]:checked')).toHaveLength(2)
    expect(saveButton().disabled).toBe(true)
    await submit()
    expect(mocks.post).not.toHaveBeenCalled()
  })

  it('does not allow a default-value submission while the initial request is still loading', async () => {
    const loading = deferred<ReturnType<typeof response>>()
    mocks.get.mockReturnValueOnce(loading.promise)
    await mount()
    expect(host.querySelector('[role="status"]')?.textContent).toContain('正在加载隐私设置')
    expect(saveButton().disabled).toBe(true)
    expect(host.querySelectorAll('input[type="radio"]')).toHaveLength(0)
    await submit()
    expect(mocks.post).not.toHaveBeenCalled()
    loading.resolve(response(1, 2))
    await flush()
    expect(host.querySelector('[role="status"]')).toBeNull()
    expect(radio('review', 1).checked).toBe(true)
    expect(radio('reply', 2).checked).toBe(true)
  })

  it.each([
    { result: { status: 403, errors: [{ err_msg: '请先登录后读取隐私设置' }] }, message: '请先登录后读取隐私设置' },
    { result: { status: 500 }, message: '获取隐私设置失败，请重试' },
    { result: response(7, 0), message: '服务器返回的隐私设置无效，请重新加载' },
  ])('keeps saving disabled after a read failure and safely retries: $message', async ({ result, message }) => {
    mocks.get.mockResolvedValueOnce(result)
    await mount()
    expect(host.querySelector('[role="alert"]')?.textContent).toContain(message)
    expect(saveButton().disabled).toBe(true)
    await submit()
    expect(mocks.post).not.toHaveBeenCalled()

    const retry = deferred<ReturnType<typeof response>>()
    mocks.get.mockReturnValueOnce(retry.promise)
    const button = retryButton()
    button.click()
    button.click()
    await flush()
    expect(mocks.get).toHaveBeenCalledTimes(2)
    expect(saveButton().disabled).toBe(true)
    retry.resolve(response(1, 2))
    await flush()
    expect(host.querySelector('[role="alert"]')).toBeNull()
    expect(radio('review', 1).checked).toBe(true)
    expect(radio('reply', 2).checked).toBe(true)
  })

  it('shows a network read failure instead of an indefinite loading state', async () => {
    mocks.get.mockRejectedValueOnce(new Error('网络连接中断'))
    await mount()
    expect(host.querySelector('[role="status"]')).toBeNull()
    expect(host.querySelector('[role="alert"]')?.textContent).toContain('网络连接中断')
    expect(retryButton()).toBeDefined()
    expect(saveButton().disabled).toBe(true)
  })

  it('submits numeric levels once, disables changes while saving, and adopts the returned saved state', async () => {
    await mount()
    await choose('review', 0)
    await choose('reply', 2)
    expect(saveButton().disabled).toBe(false)
    const saving = deferred<ReturnType<typeof response>>()
    mocks.post.mockReturnValueOnce(saving.promise)
    await submit()
    await submit()
    expect(mocks.post).toHaveBeenCalledExactlyOnceWith({
      url: '/api/user/private/', query: { private_review: 0, private_reply: 2 },
    })
    expect(saveButton().disabled).toBe(true)
    expect([...host.querySelectorAll('fieldset')].every(fieldset => fieldset.disabled)).toBe(true)
    expect(radio('review', 1).matches(':disabled')).toBe(true)
    saving.resolve(response(0, 2))
    await flush()
    expect(mocks.success).toHaveBeenCalledExactlyOnceWith('隐私设置已保存')
    expect(host.textContent).toContain('所有更改已保存')
    expect(saveButton().disabled).toBe(true)
    expect(radio('review', 0).checked).toBe(true)
    expect(radio('reply', 2).checked).toBe(true)
    await submit()
    expect(mocks.post).toHaveBeenCalledTimes(1)
  })

  it('preserves unsaved choices after a server error and allows the same changes to be retried', async () => {
    await mount()
    await choose('review', 0)
    mocks.post.mockResolvedValueOnce({ status: 400, errors: [{ err_msg: '隐私设定暂时无法更新' }] })
    await submit()
    expect(host.querySelector('[role="alert"]')?.textContent).toContain('隐私设定暂时无法更新')
    expect(radio('review', 0).checked).toBe(true)
    expect(saveButton().disabled).toBe(false)
    expect(mocks.success).not.toHaveBeenCalled()
    mocks.post.mockResolvedValueOnce(response(0, 1))
    saveButton().click()
    await flush()
    expect(mocks.post).toHaveBeenCalledTimes(2)
    expect(mocks.post).toHaveBeenLastCalledWith({ url: '/api/user/private/', query: { private_review: 0, private_reply: 1 } })
    expect(host.querySelector('[role="alert"]')).toBeNull()
    expect(mocks.success).toHaveBeenCalledOnce()
    expect(saveButton().disabled).toBe(true)
  })

  it('does not announce a late save result after the settings page has unmounted', async () => {
    await mount()
    await choose('reply', 0)
    const saving = deferred<ReturnType<typeof response>>()
    mocks.post.mockReturnValueOnce(saving.promise)
    await submit()
    app!.unmount()
    app = undefined
    saving.resolve(response(2, 0))
    await flush()
    expect(mocks.success).not.toHaveBeenCalled()
  })
})
