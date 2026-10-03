import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, type App } from 'vue'
import LoginForm from './LoginForm.vue'

const mocks = vi.hoisted(() => ({
  loginSuccess: vi.fn(),
  close: vi.fn(),
  profile: { id: 7, nickname: '测试用户' },
}))

vi.mock('./LoginTabContent.vue', () => ({
  default: defineComponent({
    props: ['loading', 'idPrefix'],
    emits: ['login-success', 'close-modal', 'update:loading'],
    setup: (props, { emit }) => () => h('div', [
      h('input', { id: `${props.idPrefix}login-username`, disabled: props.loading }),
      h('button', { type: 'button', onClick: () => emit('login-success', mocks.profile) }, '完成测试登录'),
      h('button', { type: 'button', onClick: () => emit('close-modal') }, '测试关闭'),
      h('button', { type: 'button', onClick: () => emit('update:loading', true) }, '开始测试请求'),
      h('button', { type: 'button', onClick: () => emit('update:loading', false) }, '结束测试请求'),
    ]),
  }),
}))
vi.mock('./RegisterTabContent.vue', () => ({
  default: defineComponent({
    props: ['loading', 'idPrefix'],
    emits: ['register-success', 'update:loading'],
    setup: (props, { emit }) => () => h('div', [
      h('input', { id: `${props.idPrefix}register-username`, disabled: props.loading }),
      h('button', { type: 'button', onClick: () => emit('register-success') }, '完成测试注册'),
      h('button', { type: 'button', onClick: () => emit('update:loading', true) }, '开始测试请求'),
      h('button', { type: 'button', onClick: () => emit('update:loading', false) }, '结束测试请求'),
    ]),
  }),
}))

type LegacySwitches = {
  switchToLoginTab: () => Promise<void>
  switchToSignInTabTrigger: () => Promise<void>
}
let app: App | undefined
let host: HTMLDivElement

const flush = async () => {
  for (let index = 0; index < 8; index++) { await Promise.resolve(); await nextTick() }
}

const mount = async (idPrefix = '') => {
  app = createApp(LoginForm, { idPrefix, onLoginSuccess: mocks.loginSuccess, onCloseModal: mocks.close })
  const exposed = app.mount(host) as unknown as LegacySwitches
  await flush()
  return exposed
}

const button = (label: string): HTMLButtonElement => {
  const element = [...host.querySelectorAll<HTMLButtonElement>('button')]
    .find(candidate => candidate.textContent?.trim() === label)
  expect(element).toBeDefined()
  return element!
}
const footerButton = () => host.querySelector<HTMLButtonElement>('footer button')!

beforeEach(() => {
  vi.clearAllMocks()
  host = document.createElement('div')
  document.body.append(host)
})

afterEach(() => {
  app?.unmount()
  app = undefined
  host.remove()
})

describe('compact authentication form', () => {
  it('switches through the footer in both directions and focuses the first field with its supplied prefix', async () => {
    await mount('modal-')
    expect(host.querySelector('h2')?.textContent?.trim()).toBe('登录账号')
    expect(host.querySelector<HTMLInputElement>('input')?.id).toBe('modal-login-username')
    button('注册').click()
    await flush()
    expect(host.querySelector('h2')?.textContent?.trim()).toBe('注册账号')
    const registrationInput = host.querySelector<HTMLInputElement>('input')!
    expect(registrationInput.id).toBe('modal-register-username')
    expect(document.activeElement).toBe(registrationInput)
    button('登录').click()
    await flush()
    expect(host.querySelector('h2')?.textContent?.trim()).toBe('登录账号')
    const loginInput = host.querySelector<HTMLInputElement>('input')!
    expect(loginInput.id).toBe('modal-login-username')
    expect(document.activeElement).toBe(loginInput)
  })

  it('keeps the registration activation message visible until switching back to login', async () => {
    await mount()
    button('注册').click()
    await flush()
    button('完成测试注册').click()
    await flush()
    expect(host.querySelector('[role="status"]')?.textContent).toContain('点击激活链接完成账号激活')
    expect(host.querySelector('h2')?.textContent?.trim()).toBe('注册账号')
    button('登录').click()
    await flush()
    expect(host.querySelector('[role="status"]')).toBeNull()
  })

  it.each(['login', 'register'] as const)('keeps the %s form and its input mounted while a child request is pending', async (mode) => {
    await mount()
    if (mode === 'register') { button('注册').click(); await flush() }
    const input = host.querySelector<HTMLInputElement>('input')!
    input.value = 'draft-username'
    button('开始测试请求').click()
    await flush()
    expect(footerButton().disabled).toBe(true)
    footerButton().click()
    await flush()
    expect(host.querySelector('input')).toBe(input)
    expect(input.value).toBe('draft-username')
    expect(input.disabled).toBe(true)
    expect(host.querySelector('h2')?.textContent?.trim()).toBe(mode === 'login' ? '登录账号' : '注册账号')
    button('结束测试请求').click()
    await flush()
    expect(footerButton().disabled).toBe(false)
    footerButton().click()
    await flush()
    expect(host.querySelector('input')).not.toBe(input)
  })

  it('preserves login-success payloads and the child close event', async () => {
    await mount()
    button('完成测试登录').click()
    button('测试关闭').click()
    expect(mocks.loginSuccess).toHaveBeenCalledOnce()
    expect(mocks.loginSuccess).toHaveBeenCalledWith(mocks.profile)
    expect(mocks.close).toHaveBeenCalledOnce()
  })

  it.each(['switchToLoginTab', 'switchToSignInTabTrigger'] as const)('keeps the legacy %s method available', async (method) => {
    const exposed = await mount()
    button('注册').click()
    await flush()
    await exposed[method]()
    await flush()
    expect(host.querySelector('h2')?.textContent?.trim()).toBe('登录账号')
    expect(document.activeElement).toBe(host.querySelector('input'))
  })
})
