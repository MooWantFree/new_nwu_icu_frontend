import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, ref, type App } from 'vue'
import InsertLink from './InsertLink.vue'
import ShadcnFormDialog from '@/components/common/ShadcnFormDialog.vue'

let app: App | undefined
let host: HTMLDivElement
const flush = async () => { for (let index = 0; index < 15; index++) { await Promise.resolve(); await nextTick() } }
const settle = async () => { await flush(); await vi.advanceTimersByTimeAsync(25); await flush() }
const panel = () => [...document.body.querySelectorAll<HTMLElement>('[role="dialog"]')].find(candidate => candidate.querySelector('h2')?.textContent === '添加链接')!
const field = () => panel().querySelector<HTMLInputElement>('input[autocomplete="url"]')!
const input = async (value: string) => { field().value = value; field().dispatchEvent(new Event('input', { bubbles: true })); await flush() }
const submit = async () => { panel().querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); await settle() }
const mount = async (appearance: 'shadcn' | 'default' = 'shadcn') => {
  const open = ref(true)
  const submitted = vi.fn()
  app = createApp({ render: () => h(InsertLink, { modelValue: open.value, initialText: '测试链接', appearance, onSubmit: submitted, 'onUpdate:modelValue': (value: boolean) => { open.value = value } }) })
  app.mount(host); await settle()
  return { open, submitted }
}
beforeEach(() => { vi.useFakeTimers(); host = document.createElement('div'); document.body.append(host) })
afterEach(() => { app?.unmount(); app = undefined; host.remove(); vi.clearAllTimers(); vi.useRealTimers() })
describe('InsertLink', () => {
  it.each([
    { value: '/announcements/2?q=资料#正文', expected: '/announcements/2?q=%E8%B5%84%E6%96%99#%E6%AD%A3%E6%96%87' },
    { value: 'example.com', expected: 'https://example.com/' },
    { value: 'https://example.com/files?q=1#readme', expected: 'https://example.com/files?q=1#readme' },
  ])('normalizes $value while preserving the submit contract', async ({ value, expected }) => {
    const { open, submitted } = await mount()
    expect(document.activeElement).toBe(field())
    await input(value); await submit()
    expect(submitted).toHaveBeenCalledExactlyOnceWith({ url: expected, text: '测试链接' })
    expect(open.value).toBe(false)
  })
  it.each(['javascript:alert(1)', 'data:text/html,unsafe', 'ftp://example.com', '/\\example.com', 'https://example.com/a b', 'https://example.com/\u0000', 'x'.repeat(2049)])('rejects unsafe or oversized URLs without closing', async value => {
    const { open, submitted } = await mount()
    await input(value); await submit()
    expect(submitted).not.toHaveBeenCalled()
    expect(open.value).toBe(true)
    expect(panel().querySelector('[role="alert"]')?.textContent).toContain('请输入有效')
    expect(field().getAttribute('aria-invalid')).toBe('true')
    expect(document.activeElement).toBe(field())
  })
  it('retains the management appearance when explicitly requested', async () => {
    await mount('default')
    expect(panel().querySelector('button[type="submit"]')?.classList.contains('bg-blue-600')).toBe(true)
    expect(field().classList.contains('focus:ring-blue-500')).toBe(true)
  })
  it('closes only the nested link dialog with Escape and restores its trigger', async () => {
    const parent = ref(true)
    const child = ref(false)
    const closeParent = vi.fn(() => { parent.value = false })
    app = createApp({ render: () => h(ShadcnFormDialog, { show: parent.value, title: '写评价', suspended: child.value, onClose: closeParent }, {
      default: () => [h('button', { id: 'open-link', type: 'button', onClick: () => { child.value = true } }, '添加链接'), h(InsertLink, { modelValue: child.value, 'onUpdate:modelValue': (value: boolean) => { child.value = value } })],
    }) })
    app.mount(host); await settle()
    const trigger = document.getElementById('open-link') as HTMLButtonElement
    trigger.focus(); trigger.click(); await settle()
    const parentPanel = [...document.body.querySelectorAll<HTMLElement>('[role="dialog"]')].find(candidate => candidate.querySelector('h2')?.textContent === '写评价')!
    expect(Number(panel().style.zIndex)).toBeGreaterThan(Number(parentPanel.style.zIndex))
    expect(document.activeElement).toBe(field())
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })); await settle()
    expect(child.value).toBe(false)
    expect(parent.value).toBe(true)
    expect(closeParent).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(trigger)
  })
})
