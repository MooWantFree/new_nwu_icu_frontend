import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, type App } from 'vue'
import { createMemoryHistory, createRouter, RouterView, type Router } from 'vue-router'
import Login from './Login.vue'

const mocks = vi.hoisted(() => ({
  checkLoginStatus: vi.fn(),
  fetchUserInfo: vi.fn(),
  success: vi.fn(),
}))

vi.mock('@/lib/logins', () => ({ checkLoginStatus: mocks.checkLoginStatus }))
vi.mock('@/lib/useUser', () => ({ useUser: () => ({ fetchUserInfo: mocks.fetchUserInfo }) }))
vi.mock('@/lib/useShadcnToast', () => ({ useShadcnToast: () => ({ success: mocks.success }) }))
vi.mock('@/components/user/loginNRegister/LoginForm.vue', () => ({
  default: defineComponent({
    emits: ['login-success'],
    setup: (_props, { emit }) => () => h('button', {
      type: 'button',
      onClick: () => emit('login-success', { id: 7, nickname: '测试用户' }),
    }, '模拟登录成功'),
  }),
}))

let app: App | undefined
let host: HTMLDivElement

const flush = async () => {
  await new Promise(resolve => setTimeout(resolve, 0))
  for (let index = 0; index < 12; index++) { await Promise.resolve(); await nextTick() }
}

const mount = async (redirect = '/upload') => {
  const router = createRouter({ history: createMemoryHistory(), routes: [
    { path: '/', component: { render: () => h('p', '首页') } },
    { path: '/before', component: { render: () => h('p', '登录前的页面') } },
    { path: '/login', name: 'login', component: Login },
    {
      path: '/upload',
      component: { render: () => h('p', '资料投稿页面') },
      meta: {
        loginReason: '请先登录或注册，再继续投稿资料',
        loginSuccessMessage: '登录成功，正在继续投稿',
      },
    },
  ] })
  await router.push('/before')
  await router.push({ path: '/login', query: { redirect } })
  await router.isReady()
  app = createApp(RouterView).use(router)
  app.component('NCard', defineComponent({ setup: (_props, { slots }) => () => h('section', slots.default?.()) }))
  app.mount(host)
  await flush()
  return router
}

const loginButton = (): HTMLButtonElement => {
  const element = [...host.querySelectorAll<HTMLButtonElement>('button')]
    .find(button => button.textContent?.trim() === '模拟登录成功')
  expect(element).toBeDefined()
  return element!
}

const back = async (router: Router) => {
  await new Promise<void>(resolve => {
    const remove = router.afterEach(() => { remove(); resolve() })
    router.back()
  })
  await flush()
}

beforeEach(() => {
  vi.resetAllMocks()
  mocks.checkLoginStatus.mockResolvedValue(false)
  mocks.fetchUserInfo.mockResolvedValue(undefined)
  host = document.createElement('div')
  document.body.append(host)
})

afterEach(() => {
  app?.unmount()
  app = undefined
  host.remove()
})

describe('standalone login navigation', () => {
  it('waits for the shared user state before replacing login with the requested upload page', async () => {
    let finishRefresh!: () => void
    mocks.fetchUserInfo.mockImplementationOnce(() => new Promise<void>(resolve => { finishRefresh = resolve }))
    const router = await mount()
    expect(host.textContent).toContain('请先登录或注册，再继续投稿资料')
    loginButton().click()
    await flush()
    expect(mocks.fetchUserInfo).toHaveBeenCalledOnce()
    expect(router.currentRoute.value.path).toBe('/login')
    expect(mocks.success).not.toHaveBeenCalled()

    finishRefresh()
    await flush()
    expect(router.currentRoute.value.fullPath).toBe('/upload')
    expect(host.textContent).toContain('资料投稿页面')
    expect(mocks.success).toHaveBeenCalledWith('登录成功，正在继续投稿')
    await back(router)
    expect(router.currentRoute.value.path).toBe('/before')
  })

  it('retains a safe destination query and hash after successful login', async () => {
    const router = await mount('/upload?source=course#draft')
    loginButton().click()
    await flush()
    expect(router.currentRoute.value.fullPath).toBe('/upload?source=course#draft')
    expect(mocks.fetchUserInfo).toHaveBeenCalledOnce()
  })

  it('sends an already authenticated visitor to the destination without showing the login form', async () => {
    mocks.checkLoginStatus.mockResolvedValue(true)
    const router = await mount('/upload?source=course#draft')
    expect(router.currentRoute.value.fullPath).toBe('/upload?source=course#draft')
    expect(host.textContent).toContain('资料投稿页面')
    expect(mocks.fetchUserInfo).not.toHaveBeenCalled()
    expect(mocks.success).not.toHaveBeenCalled()
    await back(router)
    expect(router.currentRoute.value.path).toBe('/before')
  })

  it.each(['https://example.com/upload', '//example.com/upload'])('returns to the home page when redirect=%s is external', async (redirect) => {
    const router = await mount(redirect)
    loginButton().click()
    await flush()
    expect(router.currentRoute.value.fullPath).toBe('/')
    expect(host.textContent).toContain('首页')
    expect(mocks.success).toHaveBeenCalledWith('登录成功')
  })
})
