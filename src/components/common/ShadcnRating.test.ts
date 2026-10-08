import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, reactive, ref, type App } from 'vue'
import ShadcnRating from './ShadcnRating.vue'

let app: App | undefined
let host: HTMLDivElement
const radios = () => [...host.querySelectorAll<HTMLInputElement>('input[type="radio"]')]
const fillWidths = () => [...host.querySelectorAll('svg')].filter((_, index) => index % 2 === 1).map(star => star.parentElement?.style.width)
const key = async (input: HTMLInputElement, value: string) => {
  const event = new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true })
  input.dispatchEvent(event)
  await nextTick()
  return event
}
const mountInteractive = async (initial = 0, disabled = false) => {
  const value = ref(initial)
  const update = vi.fn((next: number) => { value.value = next })
  const parentSubmit = vi.fn((event: Event) => event.preventDefault())
  app = createApp({ render: () => h('form', { onSubmit: parentSubmit }, [h(ShadcnRating, {
    value: value.value, 'onUpdate:value': update, readonly: false, disabled, label: '总体评分', color: 'yellow', size: 24,
  })]) })
  app.mount(host)
  await nextTick()
  return { value, update, parentSubmit }
}

beforeEach(() => { host = document.createElement('div'); document.body.append(host) })
afterEach(() => { app?.unmount(); app = undefined; host.remove() })

describe('ShadcnRating', () => {
  it('selects an integer through its native star label and emits the value for v-model', async () => {
    const { value, update } = await mountInteractive()
    const group = host.querySelector('[role="radiogroup"]')!
    expect(group.getAttribute('aria-label')).toBe('总体评分')
    expect(radios().map(input => input.getAttribute('aria-label'))).toEqual(['1 星', '2 星', '3 星', '4 星', '5 星'])
    const fourthTarget = radios()[3].closest('label')!
    expect(fourthTarget.style.width).toBe('40px')
    expect(fourthTarget.style.height).toBe('40px')
    fourthTarget.click(); await nextTick()
    expect(value.value).toBe(4)
    expect(update).toHaveBeenLastCalledWith(4)
    expect(radios().map(input => input.checked)).toEqual([false, false, false, true, false])
    expect(fillWidths()).toEqual(['100%', '100%', '100%', '100%', '0%'])
    value.value = 2; await nextTick()
    expect(radios()[1].checked).toBe(true)
    expect(radios().filter(input => input.tabIndex === 0)).toEqual([radios()[1]])
  })

  it('changes the selected star and moves focus with arrows, Home and End', async () => {
    const { value, update } = await mountInteractive(3)
    radios()[2].focus()
    await key(radios()[2], 'ArrowRight')
    expect(value.value).toBe(4)
    expect(document.activeElement).toBe(radios()[3])
    await key(radios()[3], 'ArrowDown')
    expect(value.value).toBe(5)
    await key(radios()[4], 'ArrowRight')
    expect(value.value).toBe(1)
    await key(radios()[0], 'ArrowUp')
    expect(value.value).toBe(5)
    await key(radios()[4], 'ArrowLeft')
    expect(value.value).toBe(4)
    await key(radios()[3], 'Home')
    expect(value.value).toBe(1)
    expect(document.activeElement).toBe(radios()[0])
    await key(radios()[0], 'End')
    expect(value.value).toBe(5)
    expect(document.activeElement).toBe(radios()[4])
    expect(update.mock.calls.map(([next]) => next)).toEqual([4, 5, 1, 5, 4, 1, 5])
  })

  it('selects with Space and Enter without submitting the enclosing form', async () => {
    const { value, parentSubmit } = await mountInteractive(2)
    radios()[4].focus(); await nextTick()
    expect(value.value).toBe(2)
    expect((await key(radios()[4], ' ')).defaultPrevented).toBe(true)
    expect(value.value).toBe(5)
    radios()[0].focus()
    expect((await key(radios()[0], 'Enter')).defaultPrevented).toBe(true)
    expect(value.value).toBe(1)
    expect(parentSubmit).not.toHaveBeenCalled()
  })

  it('previews hover and focus without changing the value, then restores the selection on leave or blur', async () => {
    const { value, update } = await mountInteractive(2)
    radios()[4].closest('label')!.dispatchEvent(new MouseEvent('mouseenter'))
    await nextTick()
    expect(fillWidths()).toEqual(['100%', '100%', '100%', '100%', '100%'])
    expect(value.value).toBe(2)
    expect(radios()[1].checked).toBe(true)
    expect(update).not.toHaveBeenCalled()
    host.querySelector('[role="radiogroup"]')!.dispatchEvent(new MouseEvent('mouseleave'))
    await nextTick()
    expect(fillWidths()).toEqual(['100%', '100%', '0%', '0%', '0%'])
    radios()[3].focus(); await nextTick()
    expect(fillWidths()).toEqual(['100%', '100%', '100%', '100%', '0%'])
    expect(value.value).toBe(2)
    radios()[3].blur(); await nextTick()
    expect(fillWidths()).toEqual(['100%', '100%', '0%', '0%', '0%'])
    expect(update).not.toHaveBeenCalled()
  })

  it('disables pointer and keyboard selection as well as preview', async () => {
    const { value, update } = await mountInteractive(2, true)
    expect(host.querySelector('[role="radiogroup"]')!.getAttribute('aria-disabled')).toBe('true')
    expect(radios().every(input => input.disabled)).toBe(true)
    radios()[4].closest('label')!.click()
    radios()[4].closest('label')!.dispatchEvent(new MouseEvent('mouseenter'))
    await key(radios()[1], 'End')
    expect(value.value).toBe(2)
    expect(update).not.toHaveBeenCalled()
    expect(fillWidths()).toEqual(['100%', '100%', '0%', '0%', '0%'])
  })

  it('keeps the default read-only display noninteractive and renders half a star', async () => {
    const props = reactive({ defaultValue: 2.5, allowHalf: true, color: 'yellow' as 'yellow' | 'default' })
    const update = vi.fn()
    app = createApp({ render: () => h(ShadcnRating, { ...props, 'onUpdate:value': update }) })
    app.mount(host); await nextTick()
    const display = host.querySelector('[role="img"]')!
    expect(display.getAttribute('aria-label')).toBe('评分 2.5 / 5')
    expect(host.querySelector('[role="radiogroup"], input, button, [tabindex]')).toBeNull()
    expect(fillWidths()).toEqual(['100%', '100%', '50%', '0%', '0%'])
    expect(host.querySelectorAll('svg')[1].classList.contains('fill-amber-400')).toBe(true)
    display.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(update).not.toHaveBeenCalled()
    props.defaultValue = 3.5; props.color = 'default'; await nextTick()
    expect(display.getAttribute('aria-label')).toBe('评分 3.5 / 5')
    expect(fillWidths()).toEqual(['100%', '100%', '100%', '50%', '0%'])
    expect(host.querySelectorAll('svg')[1].classList.contains('fill-zinc-950')).toBe(true)
  })

  it('supports defaultValue without a controlled value and preserves count and size', async () => {
    const update = vi.fn()
    app = createApp({ render: () => h(ShadcnRating, { readonly: false, defaultValue: 1, count: 3, size: 16, allowHalf: true, 'onUpdate:value': update }) })
    app.mount(host); await nextTick()
    expect(radios()).toHaveLength(3)
    expect(radios()[0].checked).toBe(true)
    radios()[2].click(); await nextTick()
    expect(update).toHaveBeenCalledWith(3)
    expect(radios()[2].checked).toBe(true)
    expect(fillWidths()).toEqual(['100%', '100%', '100%'])
    const star = host.querySelector('svg')!
    expect(star.parentElement!.style.width).toBe('16px')
  })
})
