import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, type App } from 'vue'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import Profile from './Profile.vue'
const mocks = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('@/lib/requests', () => ({ api: { get: mocks.get } }))
vi.mock('@/components/user/profilePage/UserInfo.vue', () => ({ default: defineComponent({
  props: ['userInfo'], setup: props => () => props.userInfo ? h('p', props.userInfo.nickname) : h('p', { role: 'status' }, 'profile skeleton'),
}) }))
vi.mock('@/components/user/profilePage/History.vue', () => ({ default: { render: () => h('p', 'history') } }))
let app: App
let container: HTMLDivElement
const flush = async () => { for (let i = 0; i < 12; i++) { await Promise.resolve(); await nextTick() } }
beforeEach(() => { mocks.get.mockReset(); container = document.createElement('div'); document.body.append(container) })
afterEach(() => { app?.unmount(); container.remove() })
async function mount() {
  const router = createRouter({ history: createMemoryHistory(), routes: [
    { path: '/user/:id', component: Profile, props: true }, { path: '/', component: { render: () => null } },
    { path: '/login', component: { render: () => null } },
  ] })
  await router.push('/user/2')
  app = createApp(RouterView).use(router); app.mount(container); await flush()
  return router
}
describe('profile recovery', () => {
  it('offers login instead of retry when authentication has expired', async () => {
    mocks.get.mockResolvedValue({ status: 401 })
    await mount()
    expect(container.textContent).toContain('请登录后查看个人资料')
    expect(container.querySelector('[role="alert"] button')).toBeNull()
    expect(container.querySelector('a[href^="/login?"]')).not.toBeNull()
  })
  it.each([
    { status: 404 },
    { status: 400, errors: [{ err_code: 'user_not_exist' }] },
  ])('replaces both loading areas when the user does not exist (%j)', async response => {
    mocks.get.mockResolvedValue(response)
    await mount()
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('用户不存在')
    expect(container.querySelector('[role="status"]')).toBeNull()
    expect(container.textContent).not.toContain('history')
    expect(container.querySelector('[role="alert"] a')?.getAttribute('href')).toBe('/')
  })
  it('retries a transient failure without leaving the profile', async () => {
    mocks.get.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ status: 200, content: { id: 2, nickname: 'Recovered' } })
    const router = await mount()
    container.querySelector<HTMLButtonElement>('[role="alert"] button')!.click()
    await flush()
    expect(container.textContent).toContain('Recovered')
    expect(container.textContent).toContain('history')
    expect(container.querySelector('[role="status"]')).toBeNull()
    expect(router.currentRoute.value.path).toBe('/user/2')
  })
  it('ignores an old failure after navigating to another user', async () => {
    let finish!: (result: unknown) => void
    mocks.get.mockReturnValueOnce(new Promise(resolve => { finish = resolve }))
      .mockResolvedValueOnce({ status: 200, content: { id: 3, nickname: 'Current' } })
    const router = await mount()
    await router.push('/user/3'); await flush()
    finish({ status: 404 }); await flush()
    expect(container.textContent).toContain('Current')
    expect(container.querySelector('[role="alert"]')).toBeNull()
  })
})
