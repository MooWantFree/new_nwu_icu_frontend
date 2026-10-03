import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref, type App } from 'vue'
import LoginModal from './LoginModal.vue'

const mocks = vi.hoisted(() => ({
  close: vi.fn(),
  loginSuccess: vi.fn(),
  profile: { id: 7, nickname: '测试用户' },
}))

vi.mock('@/components/user/loginNRegister/LoginForm.vue', () => ({
  default: defineComponent({
    emits: ['login-success', 'close-modal'],
    setup: (_props, { emit }) => () => h('form', [
      h('label', { for: 'modal-login-username' }, '用户名'),
      h('input', { id: 'modal-login-username', name: 'username' }),
      h('button', { type: 'button', onClick: () => emit('login-success', mocks.profile) }, '模拟登录成功'),
      h('button', { type: 'button', onClick: () => emit('close-modal') }, '从表单关闭'),
    ]),
  }),
}))

let app: App | undefined
let host: HTMLDivElement
let previousOverflow: string

const flush = async () => {
  for (let index = 0; index < 10; index++) { await Promise.resolve(); await nextTick() }
}

const dialog = (): HTMLElement | null => document.body.querySelector('[role="dialog"][aria-label="登录或注册"]')
const button = (label: string): HTMLButtonElement => {
  const element = [...document.body.querySelectorAll<HTMLButtonElement>('button')]
    .find(candidate => candidate.textContent?.trim() === label)
  expect(element).toBeDefined()
  return element!
}

const mount = async () => {
  const isOpen = ref(false)
  app = createApp({
    render: () => h('div', [
      h('button', { id: 'modal-login-trigger', type: 'button', onClick: () => { isOpen.value = true } }, '打开登录窗口'),
      h(LoginModal, {
        isOpen: isOpen.value,
        onClose: () => { mocks.close(); isOpen.value = false },
        onLoginSuccess: mocks.loginSuccess,
      }),
    ]),
  })
  app.mount(host)
  await flush()
  return button('打开登录窗口')
}

const open = async () => {
  const trigger = await mount()
  trigger.focus()
  trigger.click()
  await flush()
  expect(dialog()).not.toBeNull()
  return trigger
}

beforeEach(() => {
  vi.clearAllMocks()
  previousOverflow = document.body.style.overflow
  document.body.style.overflow = 'scroll'
  host = document.createElement('div')
  document.body.append(host)
})

afterEach(() => {
  app?.unmount()
  app = undefined
  host.remove()
  document.body.style.overflow = previousOverflow
})

describe('login modal behavior', () => {
  it('focuses the login input and keeps keyboard focus inside the dialog', async () => {
    await open()
    const panel = dialog()!
    expect(panel.getAttribute('aria-modal')).toBe('true')
    expect(document.activeElement).toBe(panel.querySelector('input'))
    expect(document.body.style.overflow).toBe('hidden')
    expect(host.querySelector('[role="dialog"]')).toBeNull()

    const controls = panel.querySelectorAll<HTMLElement>('button, input')
    const first = controls[0]
    const last = controls[controls.length - 1]
    last.focus()
    last.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }))
    expect(document.activeElement).toBe(first)
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }))
    expect(document.activeElement).toBe(last)
    expect(mocks.close).not.toHaveBeenCalled()
  })

  it.each(['close button', 'Escape', 'backdrop', 'form close'] as const)('closes with %s and restores the opener and scroll state', async (method) => {
    const trigger = await open()
    if (method === 'close button') {
      dialog()!.querySelector<HTMLButtonElement>('button[aria-label="关闭登录窗口"]')!.click()
    } else if (method === 'Escape') {
      dialog()!.querySelector('input')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
    } else if (method === 'backdrop') {
      document.body.querySelector<HTMLDivElement>('div[aria-hidden="true"]')!.click()
    } else {
      button('从表单关闭').click()
    }
    await flush()
    expect(mocks.close).toHaveBeenCalledOnce()
    expect(dialog()).toBeNull()
    expect(document.activeElement).toBe(trigger)
    expect(document.body.style.overflow).toBe('scroll')
  })

  it('forwards the authenticated profile without treating clicks inside the form as dismissal', async () => {
    await open()
    dialog()!.querySelector<HTMLInputElement>('input')!.click()
    button('模拟登录成功').click()
    await flush()
    expect(mocks.loginSuccess).toHaveBeenCalledOnce()
    expect(mocks.loginSuccess).toHaveBeenCalledWith(mocks.profile)
    expect(mocks.close).not.toHaveBeenCalled()
    expect(dialog()).not.toBeNull()
  })

  it('restores scroll state and removes the dialog when its owner unmounts', async () => {
    await open()
    app!.unmount()
    app = undefined
    await flush()
    expect(dialog()).toBeNull()
    expect(document.body.style.overflow).toBe('scroll')
    expect(mocks.close).not.toHaveBeenCalled()
  })
})
