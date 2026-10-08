import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, type App, type Component } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import UserMenu from './UserMenu.vue'
import MobileMenu from './MobileMenu.vue'
import { api } from '@/lib/requests'

vi.mock('@/lib/requests', () => ({ api: { post: vi.fn() } }))
vi.mock('@/components/common/UserAvatar.vue', () => ({ default: { render: () => h('img', { alt: '用户头像' }) } }))

const menuItems = [{
  key: 'review', text: '课程评价', path: '/review/timeline',
  children: [
    { key: 'timeline', text: '时间线', path: '/review/timeline' },
    { key: 'courses', text: '课程', path: '/review/course' },
  ],
}]
const logout = vi.fn()
const showMessage = vi.fn()
const showLoginModal = vi.fn()
let app: App | undefined
let container: HTMLDivElement
const flush = async () => {
  for (let index = 0; index < 20; index += 1) {
    await Promise.resolve()
    await nextTick()
  }
}
const mount = async (component: Component) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: ['/', '/review/timeline', '/review/course', '/user/me', '/user/settings/profile', '/message/inbox']
      .map(path => ({ path, component: { render: () => null } })),
  })
  await router.push('/')
  await router.isReady()
  app = createApp({ render: () => h(component, {
    menuItems, isLoggedIn: true, isLoading: false, userInfo: null,
    onLogout: logout, onShowMessage: showMessage, onShowLoginModal: showLoginModal,
  }) }).use(router)
  app.mount(container)
  await flush()
  return router
}
const press = (target: HTMLElement, key: string) => {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
}
const trigger = () => container.querySelector<HTMLButtonElement>('[aria-haspopup="menu"]')!

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(api.post).mockResolvedValue({ status: 200 } as any)
  container = document.createElement('div')
  document.body.append(container)
})
afterEach(() => {
  app?.unmount()
  app = undefined
  container.remove()
})

describe.each([
  ['personal menu', UserMenu],
  ['mobile menu', MobileMenu],
] as const)('%s', (_name, component) => {
  it('opens from the keyboard and returns focus on Escape', async () => {
    await mount(component)
    const button = trigger()
    button.focus()
    press(button, 'ArrowUp')
    await flush()
    const items = [...container.querySelectorAll<HTMLElement>('[role="menuitem"]')]
    expect(button.getAttribute('aria-expanded')).toBe('true')
    expect(document.activeElement).toBe(items.at(-1))
    press(items.at(-1)!, 'Home')
    await flush()
    expect(document.activeElement).toBe(items[0])
    press(items[0]!, 'ArrowDown')
    await flush()
    expect(document.activeElement).toBe(items[1])
    press(items[1]!, 'Escape')
    await flush()
    expect(container.querySelector('[role="menu"]')).toBeNull()
    expect(document.activeElement).toBe(button)
  })

  it('closes on outside clicks even if the outside element has a navigation-like class', async () => {
    await mount(component)
    trigger().click()
    await flush()
    const outside = document.createElement('button')
    outside.className = 'relative group md:hidden'
    container.append(outside)
    outside.click()
    await flush()
    expect(container.querySelector('[role="menu"]')).toBeNull()
  })

  it('keeps the menu and session when a draft cancels logout', async () => {
    await mount(component)
    trigger().click()
    await flush()
    const cancelLogout = (event: Event) => event.preventDefault()
    window.addEventListener('guestbook:before-logout', cancelLogout)
    try {
      const button = [...container.querySelectorAll<HTMLButtonElement>('button')]
        .find(item => item.textContent?.trim() === '退出登录')!
      button.click()
      await flush()
      expect(api.post).not.toHaveBeenCalled()
      expect(logout).not.toHaveBeenCalled()
      expect(showMessage).not.toHaveBeenCalled()
      expect(container.querySelector('[role="menu"]')).not.toBeNull()
    } finally {
      window.removeEventListener('guestbook:before-logout', cancelLogout)
    }
  })

  it('retains successful logout events and closes the menu', async () => {
    await mount(component)
    trigger().click()
    await flush()
    const button = [...container.querySelectorAll<HTMLButtonElement>('button')]
      .find(item => item.textContent?.trim() === '退出登录')!
    button.click()
    await flush()
    expect(api.post).toHaveBeenCalledOnce()
    expect(api.post).toHaveBeenCalledWith({ url: '/api/user/logout/' })
    expect(logout).toHaveBeenCalledOnce()
    expect(showMessage).toHaveBeenCalledWith('成功退出登录，欢迎你下次再来', 'success')
    expect(container.querySelector('[role="menu"]')).toBeNull()
  })
})

describe('mobile course navigation', () => {
  it('keeps submenu expansion separate from the parent link and navigates child links', async () => {
    const router = await mount(MobileMenu)
    trigger().click()
    await flush()
    const submenuToggle = container.querySelector<HTMLButtonElement>('[aria-label="展开课程评价菜单"]')!
    submenuToggle.click()
    await flush()
    expect(submenuToggle.getAttribute('aria-expanded')).toBe('true')
    expect(router.currentRoute.value.path).toBe('/')
    container.querySelector<HTMLAnchorElement>('a[href="/review/course"]')!.click()
    await flush()
    expect(router.currentRoute.value.path).toBe('/review/course')
    expect(container.querySelector('[role="menu"]')).toBeNull()
    trigger().click()
    await flush()
    container.querySelector<HTMLAnchorElement>('a[href="/review/timeline"]')!.click()
    await flush()
    expect(router.currentRoute.value.path).toBe('/review/timeline')
    expect(container.querySelector('[role="menu"]')).toBeNull()
  })

  it('opens and closes a nested group using Right and Left arrows', async () => {
    await mount(MobileMenu)
    trigger().click()
    await flush()
    const submenuToggle = container.querySelector<HTMLButtonElement>('[aria-label="展开课程评价菜单"]')!
    submenuToggle.focus()
    press(submenuToggle, 'ArrowRight')
    await flush()
    const child = container.querySelector<HTMLElement>('[role="group"] [role="menuitem"]')!
    expect(document.activeElement).toBe(child)
    press(child, 'ArrowLeft')
    await flush()
    expect(submenuToggle.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(submenuToggle)
  })
})
