import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref, type App } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import NavBar from '@/components/NavBar.vue'
import ShadcnFeedbackProvider from '@/components/common/ShadcnFeedbackProvider.vue'

const mocks = vi.hoisted(() => ({ fetchUserInfo: vi.fn(), logout: vi.fn() }))

vi.mock('@/lib/useUser', () => ({
  useUser: () => ({
    isLoggedIn: ref(false),
    isLoading: ref(false),
    userInfo: ref(null),
    fetchUserInfo: mocks.fetchUserInfo,
    logout: mocks.logout,
  }),
}))
vi.mock('@/components/navbar/Logo.vue', () => ({
  default: defineComponent({
    emits: ['showMessage'],
    setup: (_props, { emit }) => () => h('button', {
      type: 'button', onClick: () => emit('showMessage', '你已经在主页了'),
    }, '主页 Logo'),
  }),
}))
vi.mock('@/components/navbar/NavMenu.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/navbar/ActionButtons.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/navbar/MobileMenu.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/search/SearchModal.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/navbar/UserMenu.vue', () => ({
  default: defineComponent({
    emits: ['showLoginModal'],
    setup: (_props, { emit }) => () => h('button', {
      type: 'button', onClick: () => emit('showLoginModal'),
    }, '打开登录窗口'),
  }),
}))
vi.mock('@/components/navbar/LoginModal.vue', () => ({
  default: defineComponent({
    props: ['isOpen'],
    emits: ['loginSuccess'],
    setup: (props, { emit }) => () => props.isOpen ? h('div', { role: 'dialog', 'aria-label': '登录测试窗口' }, [
      h('button', {
        type: 'button', onClick: () => emit('loginSuccess', { nickname: '测试用户' }),
      }, '模拟登录成功'),
    ]) : null,
  }),
}))

let app: App | undefined
let host: HTMLDivElement

const flush = async () => {
  for (let index = 0; index < 10; index++) { await Promise.resolve(); await nextTick() }
}
const button = (label: string) => {
  const element = [...host.querySelectorAll<HTMLButtonElement>('button')]
    .find(candidate => candidate.textContent?.trim() === label)
  expect(element).toBeDefined()
  return element!
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.resetAllMocks()
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

describe('navbar login success', () => {
  it('refreshes the shared user state before closing the popup and showing success', async () => {
    let finishRefresh!: () => void
    mocks.fetchUserInfo.mockImplementationOnce(() => new Promise<void>(resolve => { finishRefresh = resolve }))
    const router = createRouter({ history: createMemoryHistory(), routes: [
      { path: '/', component: { render: () => null } },
    ] })
    await router.push('/')
    app = createApp({ render: () => h(ShadcnFeedbackProvider, null, { default: () => h(NavBar) }) }).use(router)
    app.mount(host)
    button('打开登录窗口').click()
    await flush()
    expect(host.querySelector('[role="dialog"]')).not.toBeNull()
    button('模拟登录成功').click()
    await flush()
    expect(mocks.fetchUserInfo).toHaveBeenCalledOnce()
    expect(host.querySelector('[role="dialog"]')).not.toBeNull()
    expect(document.body.textContent).not.toContain('欢迎测试用户，已成功登录')

    finishRefresh()
    await flush()
    expect(host.querySelector('[role="dialog"]')).toBeNull()
    expect(document.body.textContent).toContain('欢迎测试用户，已成功登录')
    expect(document.querySelector('[role="status"]')?.classList.contains('bg-white')).toBe(true)
  })

  it('shows logo messages through the shared dismissible toast and cleans up on unmount', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [
      { path: '/', component: { render: () => null } },
    ] })
    await router.push('/')
    app = createApp({ render: () => h(ShadcnFeedbackProvider, null, { default: () => h(NavBar) }) }).use(router)
    app.mount(host)
    button('主页 Logo').click()
    await flush()
    expect(document.querySelector('[role="status"]')?.textContent).toContain('你已经在主页了')
    document.querySelector<HTMLButtonElement>('button[aria-label="关闭通知"]')?.click()
    await flush()
    expect(document.querySelector('[role="status"]')).toBeNull()
    button('主页 Logo').click()
    await flush()
    app.unmount()
    app = undefined
    expect(document.querySelector('[role="status"]')).toBeNull()
  })
})
