import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, reactive, type App } from 'vue'
import CustomInput from './CustomInput.vue'

let app: App | undefined
let host: HTMLDivElement

const mount = async (options: { type?: string; loading?: boolean; error?: string } = {}) => {
  const state = reactive({ modelValue: 'existing-value', type: 'text', loading: false, disabled: false, error: '', ...options })
  const updated = vi.fn((value: string) => { state.modelValue = value })
  app = createApp({
    render: () => h(CustomInput, {
      ...state,
      id: 'test-input',
      label: '测试输入',
      placeholder: '请输入内容',
      required: true,
      'onUpdate:modelValue': updated,
    }),
  })
  app.mount(host)
  await nextTick()
  return { state, updated, input: host.querySelector<HTMLInputElement>('input')! }
}

beforeEach(() => {
  host = document.createElement('div')
  document.body.append(host)
})

afterEach(() => {
  app?.unmount()
  app = undefined
  host.remove()
})

describe('authentication input behavior', () => {
  it('toggles password visibility with an accessible pressed state and retains the typed value', async () => {
    const { input, updated } = await mount({ type: 'password' })
    expect(input.type).toBe('password')
    const show = host.querySelector<HTMLButtonElement>('button[aria-label="显示密码"]')!
    expect(show.type).toBe('button')
    expect(show.getAttribute('aria-pressed')).toBe('false')
    show.click()
    await nextTick()
    expect(input.type).toBe('text')
    expect(input.value).toBe('existing-value')
    const hide = host.querySelector<HTMLButtonElement>('button[aria-label="隐藏密码"]')!
    expect(hide.getAttribute('aria-pressed')).toBe('true')
    hide.click()
    await nextTick()
    expect(input.type).toBe('password')
    expect(input.value).toBe('existing-value')
    expect(updated).not.toHaveBeenCalled()
  })

  it('keeps the field editable during validation loading and disables it only when requested', async () => {
    const { state, input, updated } = await mount({ loading: true })
    expect(input.disabled).toBe(false)
    input.value = 'continued-username'
    input.dispatchEvent(new Event('input'))
    await nextTick()
    expect(updated).toHaveBeenCalledWith('continued-username')
    expect(state.modelValue).toBe('continued-username')
    state.disabled = true
    await nextTick()
    expect(input.disabled).toBe(true)
  })

  it('associates the error with the input and clears that association when the error is resolved', async () => {
    const { state, input } = await mount({ error: '用户名已存在' })
    expect(host.querySelector<HTMLLabelElement>('label')?.htmlFor).toBe(input.id)
    expect(input.getAttribute('aria-required')).toBe('true')
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(input.getAttribute('aria-describedby')).toBe('test-input-error')
    expect(host.querySelector('#test-input-error')?.textContent).toBe('用户名已存在')
    state.error = ''
    await nextTick()
    expect(input.getAttribute('aria-invalid')).toBe('false')
    expect(input.hasAttribute('aria-describedby')).toBe(false)
    expect(host.querySelector('#test-input-error')).toBeNull()
  })
})
