import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, ref, type App } from 'vue'
import ShadcnModal from './ShadcnModal.vue'

let app: App | undefined
let host: HTMLDivElement
const flush = async () => { for (let index = 0; index < 15; index++) { await Promise.resolve(); await nextTick() } }
const settle = async () => { await flush(); await vi.advanceTimersByTimeAsync(25); await flush() }
const overlays = () => [...document.body.querySelectorAll<HTMLElement>('[data-shadcn-modal-overlay]')]
const panels = () => [...document.body.querySelectorAll<HTMLElement>('[role="dialog"]')]
const escape = async () => {
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
  await settle()
}
beforeEach(() => {
  vi.useFakeTimers()
  host = document.createElement('div')
  document.body.append(host)
})
afterEach(() => {
  app?.unmount(); app = undefined; host.remove()
  vi.clearAllTimers(); vi.useRealTimers()
})
describe('ShadcnModal', () => {
  it('provides accessible names and descriptions without a visible extra title', async () => {
    const warning = vi.spyOn(console, 'warn')
    app = createApp({ render: () => h(ShadcnModal, { show: true, title: '验证码', description: '完成验证再继续' }, { default: () => h('section', [h('input')]) }) })
    app.mount(host); await settle()
    const panel = panels()[0]
    expect(document.getElementById(panel.getAttribute('aria-labelledby')!)?.textContent).toBe('验证码')
    expect(document.getElementById(panel.getAttribute('aria-describedby')!)?.textContent).toBe('完成验证再继续')
    expect(warning).not.toHaveBeenCalled()
    warning.mockRestore()
  })
  it('blocks Escape and mask dismissal while busy, then restores focus after closing', async () => {
    const open = ref(false)
    const busy = ref(true)
    app = createApp({ render: () => h('div', [
      h('button', { onClick: () => { open.value = true } }, '打开'),
      h(ShadcnModal, { show: open.value, busy: busy.value, title: '保存资料', 'onUpdate:show': (value: boolean) => { open.value = value } }, { default: () => h('section', [h('input')]) }),
    ]) })
    app.mount(host); await settle()
    const trigger = host.querySelector<HTMLButtonElement>('button')!
    trigger.focus(); trigger.click(); await settle()
    await escape(); overlays()[0].click(); await settle()
    expect(open.value).toBe(true)
    busy.value = false; await settle(); await escape()
    expect(open.value).toBe(false)
    expect(document.activeElement).toBe(trigger)
  })
  it('places each nested backdrop above its parent content and reclaims the layer on close', async () => {
    const first = ref(true)
    const second = ref(false)
    app = createApp({ render: () => h('div', [
      h(ShadcnModal, { show: first.value, title: '父弹窗' }, { default: () => h('section', [h('button', { onClick: () => { second.value = true } }, '子弹窗')]) }),
      h(ShadcnModal, { show: second.value, title: '子弹窗', 'onUpdate:show': (value: boolean) => { second.value = value } }, { default: () => h('section', [h('input')]) }),
    ]) })
    app.mount(host); await settle()
    panels()[0].querySelector<HTMLButtonElement>('button')!.click(); await settle()
    expect(Number(overlays()[1].style.zIndex)).toBeGreaterThan(Number(panels()[0].style.zIndex))
    await escape()
    expect(second.value).toBe(false)
    expect(Number(overlays()[0].style.zIndex)).toBe(50)
    expect(Number(panels()[0].style.zIndex)).toBe(51)
  })
})
