import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, type App } from 'vue'
import CaptchaChallenge from './CaptchaChallenge.vue'
import { requestCaptchaProof } from '@/lib/captchaChallenge'

vi.mock('@/lib/requests', () => ({ api: {
  get: vi.fn().mockResolvedValue({ status: 200, content: { key: 'test', image_url: '/captcha-test.png' } }),
  post: vi.fn(),
} }))

let app: App
let host: HTMLDivElement
afterEach(() => { app?.unmount(); host?.remove() })

describe('captcha modal focus', () => {
  it('allows typing while the real modal focus trap is enabled', async () => {
    host = document.createElement('div')
    document.body.appendChild(host)
    app = createApp({ render: () => h(CaptchaChallenge) })
    app.mount(host)
    const proof = requestCaptchaProof('resource_archive')
    for (let n = 0; n < 10; n++) { await Promise.resolve(); await nextTick() }
    const input = document.querySelector<HTMLInputElement>('#step-up-captcha')!
    expect(input).not.toBeNull()
    input.focus()
    expect(document.activeElement).toBe(input)
    input.value = 'test'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
    expect(input.value).toBe('test')
    const buttons = [...document.querySelectorAll<HTMLButtonElement>('[aria-labelledby="captcha-challenge-title"] button')]
    expect(buttons.find(b => b.textContent?.includes('验证并继续'))?.disabled).toBe(false)
    buttons.find(b => b.textContent === '取消')!.click()
    expect(await proof).toBeNull()
  })
})
