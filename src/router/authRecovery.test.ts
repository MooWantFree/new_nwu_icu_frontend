import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, type App } from 'vue'
import { RouterView, type Router } from 'vue-router'
const mocks = vi.hoisted(() => ({ check: vi.fn() }))
vi.mock('@/lib/logins', () => ({ checkLoginStatus: mocks.check }))
vi.mock('@/lib/pageMetadata', () => ({ setPageMetadata: vi.fn() }))
vi.mock('@/views/upload/ResourceUpload.vue', () => ({ default: { render: () => h('p', 'upload page') } }))
vi.mock('@/views/user/Login.vue', () => ({ default: { render: () => h('p', 'login page') } }))
vi.mock('@/views/Home.vue', () => ({ default: { render: () => h('p', 'home page') } }))
let app: App | undefined
let router: Router
let container: HTMLDivElement
beforeEach(async () => {
  vi.resetModules(); mocks.check.mockReset()
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  window.history.replaceState({}, '', '/')
  router = (await import('./Router')).default
  container = document.createElement('div'); document.body.append(container)
})
afterEach(() => { app?.unmount(); app = undefined; router.options.history.destroy(); container.remove(); vi.restoreAllMocks() })
describe('authentication navigation recovery', () => {
  it('keeps the requested destination on connection failure and retries without a login detour', async () => {
    mocks.check.mockRejectedValueOnce(new Error('offline')).mockResolvedValue(true)
    await router.push('/upload?source=course#draft')
    app = createApp(RouterView).use(router); app.mount(container); await nextTick()
    expect(router.currentRoute.value.name).toBe('connectionError')
    expect(router.currentRoute.value.query.redirect).toBe('/upload?source=course#draft')
    container.querySelector<HTMLButtonElement>('[role="alert"] button')!.click()
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/upload?source=course#draft'))
    expect(mocks.check).toHaveBeenCalledTimes(2)
  })
  it('still redirects an explicitly unauthenticated visitor to login', async () => {
    mocks.check.mockResolvedValue(false)
    await router.push('/upload')
    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.redirect).toBe('/upload')
  })
})
