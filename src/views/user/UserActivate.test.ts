import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, ref, type App, type Ref } from 'vue'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import UserActivate from './UserActivate.vue'
import { captureActionTokenFromUrl, clearActionToken, getActionToken } from '@/lib/actionTokens'

const mocks = vi.hoisted(() => ({
  post: vi.fn(), get: vi.fn(), success: vi.fn(), useUser: vi.fn(), login: vi.fn(), fetchUserInfo: vi.fn(),
}))
vi.mock('@/lib/requests', () => ({ api: { post: mocks.post, get: mocks.get } }))
vi.mock('@/lib/useShadcnToast', () => ({ useShadcnToast: () => ({ success: mocks.success }) }))
vi.mock('@/lib/useUser', () => ({ useUser: mocks.useUser }))

const profile = {
  id: 7,
  username: 'campus_user',
  nickname: '西大学生',
  email: 'student@example.test',
  college_email: 'student@stumail.nwu.edu.cn',
  verified: false,
  bio: '个人简介',
  avatar: '',
  uuid: '00000000-0000-0000-0000-000000000007',
  has_avatar: false,
  is_staff: false,
  date_joined: '2026-01-01T00:00:00Z',
  unread: { unread: { user: 1, system: 2, like: 3, reply: 4 }, total: 10 },
}
type CurrentUser = typeof profile
const flows = [
  {
    path: '/user/activate', name: 'userActivate', purpose: 'account-activation', token: 'activation-token',
    button: '确认激活', busy: '正在激活…', endpoint: '/api/user/register/activate/',
    title: '账号已激活', link: '前往登录', destination: '/login',
  },
  {
    path: '/user/bind-college-email', name: 'bindCollegeMail', purpose: 'college-email-bind', token: 'bind-token',
    button: '确认绑定', busy: '正在验证…', endpoint: '/api/user/bind-college-email/verify/',
    title: '西大邮箱已验证', link: '查看邮箱设置', destination: '/user/settings/email',
  },
] as const
const purposes = ['account-activation', 'college-email-bind', 'password-reset'] as const
let app: App | undefined
let container: HTMLDivElement
let userInfo: Ref<CurrentUser | null>
let isLoggedIn: Ref<boolean>

const flush = async () => {
  for (let index = 0; index < 12; index++) { await Promise.resolve(); await nextTick() }
}
const button = (label: string) => {
  const element = [...container.querySelectorAll<HTMLButtonElement>('button')]
    .find(candidate => candidate.textContent?.trim() === label)
  if (!element) throw new Error(`Missing activation button: ${label}`)
  return element
}
const hasButton = (label: string) => [...container.querySelectorAll('button')]
  .some(candidate => candidate.textContent?.trim() === label)
const seedTokens = () => {
  for (const flow of flows) {
    window.history.replaceState({}, '', `${flow.path}#token=${flow.token}`)
    captureActionTokenFromUrl()
  }
  window.history.replaceState({}, '', '/user/forget-password#token=reset-token')
  captureActionTokenFromUrl()
}
const successResponse = () => ({
  status: 200, errors: [], content: { user_id: profile.id, email: profile.college_email },
})
const deferredResponse = () => {
  let resolve!: (value: ReturnType<typeof successResponse>) => void
  const promise = new Promise<ReturnType<typeof successResponse>>(accept => { resolve = accept })
  return { promise, resolve }
}
const mount = async (path: string, redirectedTo?: string) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/user/activate', name: 'userActivate', component: UserActivate },
      { path: '/user/bind-college-email', name: 'bindCollegeMail', component: UserActivate },
      { path: '/', component: { render: () => h('p', '主页') } },
      { path: '/login', component: { render: () => h('p', '登录页面') } },
      { path: '/user/settings/email', component: { render: () => h('p', '邮箱设置') } },
    ],
  })
  await router.push(path)
  await router.isReady()
  const redirected = redirectedTo ? new Promise<void>(resolve => {
    const removeGuard = router.afterEach(to => {
      if (to.path !== redirectedTo) return
      removeGuard()
      resolve()
    })
  }) : Promise.resolve()
  app = createApp({ render: () => h(RouterView) }).use(router)
  app.mount(container)
  await redirected
  await flush()
  return router
}

beforeEach(() => {
  vi.resetAllMocks()
  for (const purpose of purposes) clearActionToken(purpose)
  window.history.replaceState({}, '', '/')
  userInfo = ref<CurrentUser | null>(null)
  isLoggedIn = ref(false)
  mocks.useUser.mockReturnValue({ userInfo, isLoggedIn, login: mocks.login, fetchUserInfo: mocks.fetchUserInfo })
  mocks.login.mockImplementation((current: CurrentUser) => { userInfo.value = current; isLoggedIn.value = true })
  mocks.post.mockResolvedValue(successResponse())
  container = document.createElement('div')
  document.body.append(container)
})

afterEach(() => {
  app?.unmount()
  app = undefined
  container.remove()
  for (const purpose of purposes) clearActionToken(purpose)
  window.history.replaceState({}, '', '/')
})

describe.each(flows)('$name confirmation flow', flow => {
  it('waits for an explicit confirmation without consuming the captured token', async () => {
    seedTokens()
    await mount(flow.path)
    expect(button(flow.button).disabled).toBe(false)
    expect(mocks.post).not.toHaveBeenCalled()
    expect(mocks.get).not.toHaveBeenCalled()
    expect(mocks.fetchUserInfo).not.toHaveBeenCalled()
    expect(mocks.success).not.toHaveBeenCalled()
    expect(mocks.useUser).toHaveBeenCalledExactlyOnceWith(false)
    expect(getActionToken(flow.purpose)).toBe(flow.token)
  })

  it('disables its confirmation and prevents duplicate requests while processing', async () => {
    seedTokens()
    const response = deferredResponse()
    mocks.post.mockReturnValue(response.promise)
    await mount(flow.path)
    const confirm = button(flow.button)
    confirm.click()
    confirm.click()
    await flush()
    expect(mocks.post).toHaveBeenCalledExactlyOnceWith({ url: flow.endpoint, query: { token: flow.token } })
    expect(button(flow.busy).disabled).toBe(true)
    button(flow.busy).click()
    expect(mocks.post).toHaveBeenCalledOnce()
    expect(getActionToken(flow.purpose)).toBe(flow.token)
    response.resolve(successResponse())
    await flush()
    expect(container.querySelector('h1')?.textContent).toBe(flow.title)
    expect(mocks.success).toHaveBeenCalledOnce()
  })

  it('clears only the successful token purpose and links to the correct destination', async () => {
    seedTokens()
    const router = await mount(flow.path)
    button(flow.button).click()
    await flush()
    expect(mocks.post).toHaveBeenCalledExactlyOnceWith({ url: flow.endpoint, query: { token: flow.token } })
    expect(container.querySelector('h1')?.textContent).toBe(flow.title)
    expect(getActionToken(flow.purpose)).toBe('')
    const otherFlow = flows.find(candidate => candidate.purpose !== flow.purpose)!
    expect(getActionToken(otherFlow.purpose)).toBe(otherFlow.token)
    expect(getActionToken('password-reset')).toBe('reset-token')
    expect(router.currentRoute.value.path).toBe(flow.path)
    const link = [...container.querySelectorAll<HTMLAnchorElement>('a')]
      .find(candidate => candidate.textContent?.trim() === flow.link)!
    expect(link).toBeDefined()
    expect(link.getAttribute('href')).toBe(flow.destination)
    const navigated = new Promise<void>(resolve => {
      const removeGuard = router.afterEach(to => {
        if (to.path !== flow.destination) return
        removeGuard()
        resolve()
      })
    })
    link.click()
    await navigated
    await flush()
    expect(router.currentRoute.value.path).toBe(flow.destination)
  })

  it('shows a missing-token alert without offering a retry or making a request', async () => {
    await mount(flow.path)
    expect(container.querySelector('[role="alert"]')?.textContent).toMatch(/令牌|链接/)
    expect(hasButton('重试')).toBe(false)
    expect(hasButton(flow.button)).toBe(false)
    expect(mocks.post).not.toHaveBeenCalled()
    expect(mocks.success).not.toHaveBeenCalled()
  })

  it('preserves the token after a server failure and retries the same purpose', async () => {
    seedTokens()
    mocks.post.mockResolvedValueOnce({ status: 400, errors: [{ field: 'token', err_msg: '验证链接已过期，请重新申请' }], content: {} })
    await mount(flow.path)
    button(flow.button).click()
    await flush()
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('验证链接已过期，请重新申请')
    expect(getActionToken(flow.purpose)).toBe(flow.token)
    expect(mocks.success).not.toHaveBeenCalled()
    button('重试').click()
    await flush()
    expect(mocks.post.mock.calls).toEqual([
      [{ url: flow.endpoint, query: { token: flow.token } }],
      [{ url: flow.endpoint, query: { token: flow.token } }],
    ])
    expect(container.querySelector('h1')?.textContent).toBe(flow.title)
    expect(getActionToken(flow.purpose)).toBe('')
    expect(mocks.success).toHaveBeenCalledOnce()
  })

  it('keeps a legacy query token for retry after a network failure', async () => {
    mocks.post.mockRejectedValueOnce(new Error('Network Error'))
    await mount(`${flow.path}?token=legacy-token`)
    expect(mocks.post).not.toHaveBeenCalled()
    button(flow.button).click()
    await flush()
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('网络')
    expect(container.textContent).not.toContain('Network Error')
    button('重试').click()
    await flush()
    expect(mocks.post).toHaveBeenNthCalledWith(2, { url: flow.endpoint, query: { token: 'legacy-token' } })
    expect(container.querySelector('h1')?.textContent).toBe(flow.title)
  })
})

describe('activation account state', () => {
  it('redirects an already logged-in account home without activating or consuming its token', async () => {
    seedTokens()
    userInfo.value = { ...profile }
    isLoggedIn.value = true
    const router = await mount('/user/activate', '/')
    expect(router.currentRoute.value.path).toBe('/')
    expect(mocks.post).not.toHaveBeenCalled()
    expect(mocks.get).not.toHaveBeenCalled()
    expect(mocks.useUser).toHaveBeenCalledExactlyOnceWith(false)
    expect(getActionToken('account-activation')).toBe('activation-token')
    expect(mocks.success).toHaveBeenCalledOnce()
  })

  it('updates only verified for the logged-in account matching the verified email', async () => {
    seedTokens()
    userInfo.value = { ...profile }
    isLoggedIn.value = true
    const router = await mount('/user/bind-college-email')
    expect(router.currentRoute.value.path).toBe('/user/bind-college-email')
    expect(mocks.post).not.toHaveBeenCalled()
    button('确认绑定').click()
    await flush()
    expect(mocks.login).toHaveBeenCalledExactlyOnceWith({ ...profile, verified: true })
    expect(userInfo.value).toEqual({ ...profile, verified: true })
    expect(mocks.fetchUserInfo).not.toHaveBeenCalled()
    expect(mocks.get).not.toHaveBeenCalled()
    expect(container.querySelector('h1')?.textContent).toBe('西大邮箱已验证')
  })

  it.each(['wrong response account', 'wrong response email', 'account changed', 'email changed', 'profile refreshed', 'signed out'] as const)(
    'does not mark a different or changed account verified: %s', async change => {
      seedTokens()
      userInfo.value = { ...profile }
      isLoggedIn.value = true
      const response = deferredResponse()
      mocks.post.mockReturnValue(response.promise)
      await mount('/user/bind-college-email')
      button('确认绑定').click()
      await flush()
      const result = successResponse()
      if (change === 'wrong response account') result.content.user_id = profile.id + 1
      else if (change === 'wrong response email') result.content.email = 'other@stumail.nwu.edu.cn'
      else if (change === 'account changed') userInfo.value = { ...profile, id: profile.id + 1 }
      else if (change === 'email changed') userInfo.value = { ...profile, college_email: 'new@stumail.nwu.edu.cn' }
      else if (change === 'profile refreshed') userInfo.value = { ...profile, nickname: '刷新后的昵称' }
      else { userInfo.value = null; isLoggedIn.value = false }
      response.resolve(result)
      await flush()
      expect(mocks.login).not.toHaveBeenCalled()
      expect(userInfo.value?.verified ?? false).toBe(false)
      expect(mocks.fetchUserInfo).not.toHaveBeenCalled()
      expect(mocks.get).not.toHaveBeenCalled()
      expect(container.querySelector('h1')?.textContent).toBe('西大邮箱已验证')
    },
  )

  it('does not mark an unbound account verified from a response containing an empty email', async () => {
    seedTokens()
    userInfo.value = { ...profile, college_email: '' }
    isLoggedIn.value = true
    mocks.post.mockResolvedValue({ ...successResponse(), content: { user_id: profile.id, email: '' } })
    await mount('/user/bind-college-email')
    button('确认绑定').click()
    await flush()
    expect(mocks.login).not.toHaveBeenCalled()
    expect(userInfo.value?.verified).toBe(false)
    expect(mocks.fetchUserInfo).not.toHaveBeenCalled()
    expect(container.querySelector('h1')?.textContent).toBe('西大邮箱已验证')
  })

  it('loads the binding token on route reuse and ignores an older activation response while binding is pending', async () => {
    seedTokens()
    const activation = deferredResponse()
    const binding = deferredResponse()
    mocks.post.mockReturnValueOnce(activation.promise).mockReturnValueOnce(binding.promise)
    const router = await mount('/user/activate')
    button('确认激活').click()
    await flush()
    await router.push('/user/bind-college-email')
    await flush()
    expect(button('确认绑定').disabled).toBe(false)
    expect(mocks.post).toHaveBeenCalledOnce()
    button('确认绑定').click()
    await flush()
    expect(mocks.post).toHaveBeenNthCalledWith(2, {
      url: '/api/user/bind-college-email/verify/', query: { token: 'bind-token' },
    })
    activation.resolve(successResponse())
    await flush()
    expect(button('正在验证…').disabled).toBe(true)
    expect(mocks.success).not.toHaveBeenCalled()
    expect(mocks.login).not.toHaveBeenCalled()
    expect(getActionToken('college-email-bind')).toBe('bind-token')
    binding.resolve(successResponse())
    await flush()
    expect(container.querySelector('h1')?.textContent).toBe('西大邮箱已验证')
    expect(getActionToken('college-email-bind')).toBe('')
    expect(getActionToken('account-activation')).toBe('activation-token')
    expect(mocks.success).toHaveBeenCalledOnce()
  })

  it('does not toast or mutate account state when an activation response arrives after leaving the page', async () => {
    seedTokens()
    const response = deferredResponse()
    mocks.post.mockReturnValueOnce(response.promise)
    const router = await mount('/user/activate')
    button('确认激活').click()
    await flush()
    await router.push('/')
    await flush()
    response.resolve(successResponse())
    await flush()
    expect(router.currentRoute.value.path).toBe('/')
    expect(container.textContent).toContain('主页')
    expect(mocks.success).not.toHaveBeenCalled()
    expect(mocks.login).not.toHaveBeenCalled()
    expect(getActionToken('account-activation')).toBe('activation-token')
  })
})
