import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, ref, type App } from 'vue'
import ShadcnSelect from './ShadcnSelect.vue'

let app: App | undefined
let host: HTMLDivElement
const originalScroll = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollIntoView')
const flush = async () => { for (let index = 0; index < 15; index++) { await Promise.resolve(); await nextTick() } }
const settle = async () => { await flush(); await vi.advanceTimersByTimeAsync(50); await flush() }
const menu = () => document.body.querySelector<HTMLElement>('[data-shadcn-select-menu]')!
const combobox = () => host.querySelector<HTMLElement>('[role="combobox"]')!
const key = async (target: HTMLElement, value: string) => {
  target.dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true }))
  await settle()
}
const mount = async (filterable: boolean) => {
  const value = ref<string | number>('')
  const update = vi.fn((next: string | number | null) => { if (next !== null) value.value = next })
  app = createApp({ render: () => h('form', { onSubmit: (event: Event) => event.preventDefault() }, [h(ShadcnSelect, {
    value: value.value, 'onUpdate:value': update, filterable,
    options: [{ label: '全部学院', value: '' }, { label: '数学学院', value: 1 }, { label: '物理学院', value: 2 }, { label: '字符串 ID', value: '2' }],
    id: 'college', 'aria-label': '所属学院', 'aria-describedby': 'college-help',
  })]) })
  app.mount(host)
  await settle()
  return { value, update }
}
beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
  Element.prototype.scrollIntoView = vi.fn()
  host = document.createElement('div')
  document.body.append(host)
})
afterEach(() => {
  app?.unmount(); app = undefined; host.remove()
  if (originalScroll) Object.defineProperty(Element.prototype, 'scrollIntoView', originalScroll)
  else Reflect.deleteProperty(Element.prototype, 'scrollIntoView')
  vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals()
})
describe('ShadcnSelect real primitives', () => {
  it('supports empty-string options, filtering and keyboard selection while preserving numeric IDs', async () => {
    const { value, update } = await mount(true)
    const field = combobox() as HTMLInputElement
    expect(field.value).toBe('全部学院')
    expect(field.id).toBe('college')
    expect(field.getAttribute('aria-describedby')).toBe('college-help')
    field.click(); await settle()
    expect(menu()).toBeDefined()
    expect(host.contains(menu())).toBe(false)
    field.value = '物理'
    field.dispatchEvent(new Event('input', { bubbles: true }))
    await settle()
    expect([...menu().querySelectorAll('[role="option"]')].map(option => option.textContent?.trim())).toEqual(['物理学院'])
    await key(field, 'ArrowDown'); await key(field, 'Enter')
    expect(value.value).toBe(2)
    expect(update).toHaveBeenCalledWith(2)
    expect(field.value).toBe('物理学院')
    field.click(); await settle()
    field.value = '全部'
    field.dispatchEvent(new Event('input', { bubbles: true }))
    await settle()
    await key(field, 'ArrowDown'); await key(field, 'Enter')
    expect(value.value).toBe('')
    expect(field.value).toBe('全部学院')
  })
  it('supports empty-string options in a plain Select and distinguishes string values from numeric IDs', async () => {
    const { value } = await mount(false)
    const trigger = combobox()
    expect(trigger.textContent).toContain('全部学院')
    trigger.focus(); await key(trigger, 'ArrowDown')
    const stringOption = [...menu().querySelectorAll<HTMLElement>('[role="option"]')].find(option => option.textContent?.trim() === '字符串 ID')!
    stringOption.focus(); await key(stringOption, 'Enter')
    expect(value.value).toBe('2')
    expect(trigger.textContent).toContain('字符串 ID')
    await key(trigger, 'ArrowDown')
    const emptyOption = [...menu().querySelectorAll<HTMLElement>('[role="option"]')].find(option => option.textContent?.trim() === '全部学院')!
    emptyOption.focus(); await key(emptyOption, 'Enter')
    expect(value.value).toBe('')
    expect(trigger.textContent).toContain('全部学院')
  })
})
