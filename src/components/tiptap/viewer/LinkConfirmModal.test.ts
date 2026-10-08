import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, ref, type App } from 'vue'
import LinkConfirmModal from './LinkConfirmModal.vue'

let app: App | undefined
let host: HTMLDivElement
const flush = async () => { for (let index = 0; index < 15; index++) { await Promise.resolve(); await nextTick() } }
const settle = async () => { await flush(); await vi.advanceTimersByTimeAsync(25); await flush() }
const button = (label: string) => [...document.body.querySelectorAll<HTMLButtonElement>('[role="dialog"] button')].find(candidate => candidate.textContent?.trim() === label)!
const mount = async (url: string) => {
  const open = ref(true)
  const confirm = vi.fn(() => { open.value = false })
  const cancel = vi.fn(() => { open.value = false })
  app = createApp({ render: () => h(LinkConfirmModal, { show: open.value, url, onConfirm: confirm, onCancel: cancel }) })
  app.mount(host); await settle()
  return { confirm, cancel, open }
}
beforeEach(() => { vi.useFakeTimers(); host = document.createElement('div'); document.body.append(host) })
afterEach(() => { app?.unmount(); app = undefined; host.remove(); vi.clearAllTimers(); vi.useRealTimers() })
describe('LinkConfirmModal', () => {
  it('emits confirmation for a safe URL and preserves its displayed address', async () => {
    const { confirm, cancel } = await mount('https://example.com/files?q=资料#readme')
    expect(document.body.querySelector('[role="dialog"]')?.textContent).toContain('https://example.com/files?q=资料#readme')
    button('继续').click(); await settle()
    expect(confirm).toHaveBeenCalledOnce()
    expect(cancel).not.toHaveBeenCalled()
  })
  it.each(['javascript:alert(1)', 'data:text/html,unsafe'])('blocks confirmation for %s', async url => {
    const { confirm } = await mount(url)
    expect(button('继续').disabled).toBe(true)
    button('继续').click(); await settle()
    expect(confirm).not.toHaveBeenCalled()
    expect(document.body.querySelector('[role="alert"]')?.textContent).toContain('无法打开')
  })
  it('treats Escape as cancellation', async () => {
    const { cancel, confirm, open } = await mount('https://example.com')
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })); await settle()
    expect(cancel).toHaveBeenCalledOnce()
    expect(confirm).not.toHaveBeenCalled()
    expect(open.value).toBe(false)
  })
})
