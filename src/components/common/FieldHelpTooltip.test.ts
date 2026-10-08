import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, ref, type App } from 'vue'
import FieldHelpTooltip from './FieldHelpTooltip.vue'

let app: App | undefined
let host: HTMLDivElement
const submit = vi.fn()
const description = '用户名用于登录，暂不支持修改。'

const flush = async () => {
  for (let index = 0; index < 8; index++) { await Promise.resolve(); await nextTick() }
}
const tooltip = () => document.body.querySelector<HTMLElement>('[role="tooltip"]')
const trigger = (label = '用户名说明') => host.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!
const input = () => host.querySelector<HTMLInputElement>('input')!
const mount = async (multiple = false) => {
  const disabled = ref(false)
  app = createApp({
    render: () => h('form', { onSubmit: (event: Event) => { event.preventDefault(); submit() } }, [
      h(FieldHelpTooltip, {
        id: 'profile-username-hint', label: '用户名说明', content: description, disabled: disabled.value,
      }),
      multiple ? h(FieldHelpTooltip, {
        id: 'profile-nickname-hint', label: '昵称说明', content: '昵称需要 2–30 个字符。',
      }) : null,
      h('input', { 'aria-describedby': 'profile-username-hint' }),
    ]),
  })
  app.mount(host)
  await flush()
  return disabled
}
const mouse = (element: HTMLElement, type: string) => element.dispatchEvent(new MouseEvent(type, { bubbles: true }))
const leave = async () => {
  await vi.advanceTimersByTimeAsync(100)
  await flush()
}

beforeEach(() => {
  vi.useFakeTimers()
  submit.mockClear()
  host = document.createElement('div')
  document.body.append(host)
})

afterEach(() => {
  app?.unmount()
  app = undefined
  host.remove()
  vi.clearAllTimers()
  vi.useRealTimers()
})

describe('FieldHelpTooltip', () => {
  it('keeps form descriptions available and gives each portalled tooltip a separate ID', async () => {
    await mount(true)
    expect(tooltip()).toBeNull()
    expect(document.getElementById(input().getAttribute('aria-describedby')!)?.textContent).toBe(description)
    expect(trigger().getAttribute('aria-describedby')).toBe('profile-username-hint')

    trigger().focus()
    await flush()
    const firstId = tooltip()!.id
    expect(tooltip()!.textContent?.trim()).toBe(description)
    expect(host.contains(tooltip())).toBe(false)
    expect(firstId).not.toBe('profile-username-hint')
    expect(document.querySelectorAll('#profile-username-hint')).toHaveLength(1)

    trigger('昵称说明').focus()
    await flush()
    expect(tooltip()!.id).not.toBe(firstId)
    expect(tooltip()!.id).not.toBe('profile-nickname-hint')
    expect(tooltip()!.textContent?.trim()).toBe('昵称需要 2–30 个字符。')
    expect(document.getElementById('profile-username-hint')?.textContent).toBe(description)
  })

  it('opens on focus without closing on the following click and dismisses with Escape or blur', async () => {
    await mount()
    trigger().focus()
    await flush()
    expect(tooltip()).not.toBeNull()
    trigger().click()
    await flush()
    expect(tooltip()).not.toBeNull()
    expect(submit).not.toHaveBeenCalled()

    const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    trigger().dispatchEvent(escape)
    await flush()
    expect(escape.defaultPrevented).toBe(true)
    expect(tooltip()).toBeNull()
    expect(document.activeElement).toBe(trigger())
    expect(document.getElementById('profile-username-hint')?.textContent).toBe(description)

    input().focus()
    trigger().focus()
    await flush()
    expect(tooltip()).not.toBeNull()
    input().focus()
    await flush()
    expect(tooltip()).toBeNull()
  })

  it('lets the pointer enter the tooltip, closes after leaving and supports a tap without focus', async () => {
    await mount()
    mouse(trigger(), 'mouseenter')
    await flush()
    expect(tooltip()).not.toBeNull()
    mouse(trigger(), 'mouseleave')
    mouse(tooltip()!, 'mouseenter')
    await leave()
    expect(tooltip()).not.toBeNull()
    mouse(tooltip()!, 'mouseleave')
    await leave()
    expect(tooltip()).toBeNull()

    trigger().click()
    await flush()
    expect(tooltip()).not.toBeNull()
    await vi.advanceTimersByTimeAsync(0)
    mouse(input(), 'pointerdown')
    mouse(input(), 'mousedown')
    mouse(input(), 'mouseup')
    input().click()
    await flush()
    expect(tooltip()).toBeNull()
    expect(submit).not.toHaveBeenCalled()
  })

  it('closes an open tooltip when disabled and blocks further activation', async () => {
    const disabled = await mount()
    trigger().click()
    await flush()
    expect(tooltip()).not.toBeNull()
    disabled.value = true
    await flush()
    expect(trigger().disabled).toBe(true)
    expect(tooltip()).toBeNull()
    mouse(trigger(), 'mouseenter')
    trigger().click()
    await flush()
    expect(tooltip()).toBeNull()
  })
})
