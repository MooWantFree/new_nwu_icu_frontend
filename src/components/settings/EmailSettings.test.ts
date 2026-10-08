import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref, Teleport, type App, type Ref } from 'vue'
import type { APIUserProfile } from '@/types/api/user/profilePage'
import type { APIUnreadMessageCount } from '@/types/api/messages/messages'
import EmailSettings from './EmailSettings.vue'

const mocks = vi.hoisted(() => ({
  post: vi.fn(), success: vi.fn(), warning: vi.fn(), error: vi.fn(), login: vi.fn(), fetchUserInfo: vi.fn(),
  sharedUser: null as Ref<(APIUserProfile['response'] & { unread: APIUnreadMessageCount['response'] }) | null> | null,
}))
vi.mock('@/lib/requests', () => ({ api: { post: mocks.post } }))
vi.mock('@/lib/useShadcnToast', () => ({ useShadcnToast: () => ({ success: mocks.success, warning: mocks.warning, error: mocks.error }) }))
vi.mock('@/lib/useUser', () => ({ useUser: () => ({ userInfo: mocks.sharedUser, login: mocks.login, fetchUserInfo: mocks.fetchUserInfo }) }))
vi.mock('naive-ui', async importOriginal => {
  const actual = await importOriginal<typeof import('naive-ui')>()
  return {
    ...actual,
    NModal: defineComponent({
      inheritAttrs: false,
      props: ['show', 'maskClosable', 'closeOnEsc'],
      emits: ['update:show'],
      setup: (props, { slots }) => () => props.show ? h(Teleport, { to: 'body' }, slots.default?.() ?? []) : null,
    }),
  }
})

const profile: APIUserProfile['response'] = {
  id: 1, username: 'tester', email: 'tester@example.com', date_joined: '2026-01-01T00:00:00Z',
  nickname: 'Tester', avatar: '', uuid: '00000000-0000-0000-0000-000000000001', has_avatar: false,
  college_email: 'student@stumail.nwu.edu.cn', verified: false, is_me: true, is_staff: false,
}
const newEmail = 'replacement@stumail.nwu.edu.cn'
const unread: APIUnreadMessageCount['response'] = { unread: { user: 1, system: 1, like: 1, reply: 1 }, total: 4 }
let app: App | undefined
let host: HTMLDivElement
const flush = async () => {
  for (let index = 0; index < 8; index++) { await Promise.resolve(); await nextTick() }
}
const button = (label: string) => {
  const element = [...document.body.querySelectorAll<HTMLButtonElement>('button')]
    .find(candidate => candidate.getAttribute('aria-label') === label || candidate.textContent?.trim() === label)
  if (!element) throw new Error(`Missing email button: ${label}`)
  return element
}
const emailInput = () => host.querySelector<HTMLInputElement>('input[id^="nwu-email-"]')!
const dialog = () => document.body.querySelector<HTMLElement>('section[role="dialog"]')
const deferred = <T,>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(fulfil => { resolve = fulfil })
  return { promise, resolve }
}
const success = () => ({ status: 200, content: {}, errors: [] })
const mount = async (userInfo: APIUserProfile['response'] = profile) => {
  mocks.sharedUser = ref({ ...userInfo, unread })
  app = createApp(EmailSettings, { userInfo })
  app.mount(host)
  await flush()
}
const setDraft = async (value: string) => {
  emailInput().value = value
  emailInput().dispatchEvent(new Event('input', { bubbles: true }))
  await nextTick()
}
const edit = async (value = newEmail, label = '重新绑定') => {
  button(label).click()
  await flush()
  expect(document.activeElement).toBe(emailInput())
  await setDraft(value)
}
const save = async () => {
  host.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  await flush()
}
const advance = async (milliseconds: number) => {
  await vi.advanceTimersByTimeAsync(milliseconds)
  await flush()
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  mocks.post.mockReset().mockResolvedValue(success())
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

describe('email settings', () => {
  it('initially binds a normalized address, marks it pending and synchronizes the current user without a refresh request', async () => {
    await mount({ ...profile, college_email: '', verified: false })
    expect(host.textContent).toContain('未绑定')
    await edit('  Replacement@STUMAIL.NWU.EDU.CN  ', '绑定 NWU 邮箱')
    await save()
    expect(mocks.post).toHaveBeenCalledExactlyOnceWith({ url: '/api/user/bind-college-email/bind/', query: { college_email: newEmail } })
    expect(emailInput().value).toBe(newEmail)
    expect(emailInput().disabled).toBe(true)
    expect(host.textContent).toContain('待验证')
    expect(dialog()?.textContent).toContain(newEmail)
    expect(button('60s 后可重新发送').disabled).toBe(true)
    expect(mocks.login).toHaveBeenCalledExactlyOnceWith({ ...profile, college_email: newEmail, verified: false, unread })
    expect(mocks.fetchUserInfo).not.toHaveBeenCalled()
    expect(mocks.success).toHaveBeenCalledWith('验证邮件已发送')
  })

  it.each([true, false])('lets a verified=%s user cancel or complete a rebind', async verified => {
    await mount({ ...profile, verified })
    await edit()
    button('取消').click()
    await flush()
    expect(emailInput().value).toBe(profile.college_email)
    expect(host.textContent).toContain(verified ? '已验证' : '待验证')
    expect(mocks.post).not.toHaveBeenCalled()

    await edit()
    await save()
    expect(emailInput().value).toBe(newEmail)
    expect(host.textContent).toContain('待验证')
    expect(host.textContent).not.toContain('已验证')
    expect(dialog()?.textContent).toContain(newEmail)
    expect(mocks.login).toHaveBeenCalledWith(expect.objectContaining({ college_email: newEmail, verified: false }))
  })

  it.each([true, false])('keeps the old binding and verified=%s state after a server rejection', async verified => {
    mocks.post.mockResolvedValue({ status: 400, errors: [{ field: 'college_email', err_msg: '这个邮箱已被其他用户绑定' }] })
    await mount({ ...profile, verified })
    await edit()
    await save()
    expect(emailInput().value).toBe(newEmail)
    expect(emailInput().getAttribute('aria-invalid')).toBe('true')
    expect(host.textContent).toContain('这个邮箱已被其他用户绑定')
    expect(host.textContent).not.toContain('err_msg')
    expect(host.textContent).toContain(verified ? '已验证' : '待验证')
    expect(dialog()).toBeNull()
    expect(mocks.login).not.toHaveBeenCalled()
    expect(mocks.error).toHaveBeenCalledWith('这个邮箱已被其他用户绑定')
    button('取消').click()
    await flush()
    expect(emailInput().value).toBe(profile.college_email)
  })

  it('focuses an invalid address without making a binding request', async () => {
    await mount()
    await edit('not-an-email')
    await save()
    expect(document.activeElement).toBe(emailInput())
    expect(emailInput().getAttribute('aria-invalid')).toBe('true')
    expect(host.textContent).toContain('请输入有效的 NWU 邮箱地址')
    expect(mocks.post).not.toHaveBeenCalled()
  })

  it('prevents duplicate saves and cancelling while a binding request is pending', async () => {
    const pending = deferred<ReturnType<typeof success>>()
    mocks.post.mockReturnValue(pending.promise)
    await mount({ ...profile, verified: true })
    await edit()
    await save()
    await save()
    expect(mocks.post).toHaveBeenCalledOnce()
    expect(button('保存中…').disabled).toBe(true)
    expect(button('取消').disabled).toBe(true)
    expect(emailInput().disabled).toBe(true)
    expect(host.textContent).toContain('已验证')
    pending.resolve(success())
    await flush()
    expect(emailInput().value).toBe(newEmail)
    expect(dialog()?.textContent).toContain(newEmail)
  })

  it('resends to the committed address and keeps the cooldown across closing the verification dialog', async () => {
    await mount()
    await edit()
    button('取消').click()
    await flush()
    button('验证邮箱').click()
    await flush()
    button('重新发送验证邮件').click()
    await flush()
    expect(mocks.post).toHaveBeenCalledExactlyOnceWith({ url: '/api/user/bind-college-email/bind/', query: { college_email: profile.college_email } })
    await advance(30000)
    expect(button('30s 后可重新发送').disabled).toBe(true)
    button('稍后验证').click()
    await flush()
    expect(dialog()).toBeNull()
    button('验证邮箱').click()
    await flush()
    expect(button('30s 后可重新发送').disabled).toBe(true)
    await advance(29999)
    expect(button('1s 后可重新发送').disabled).toBe(true)
    await advance(1)
    expect(button('重新发送验证邮件').disabled).toBe(false)
    expect(mocks.success).toHaveBeenCalledWith('验证邮件已重新发送')
  })

  it('blocks duplicate resends and dialog close while sending, then honors Retry-After', async () => {
    const pending = deferred<{ status: number; retryAfter: number; errors: { err_msg: string }[] }>()
    mocks.post.mockReturnValue(pending.promise)
    await mount()
    button('验证邮箱').click()
    await flush()
    button('重新发送验证邮件').click()
    await flush()
    expect(button('正在发送…').disabled).toBe(true)
    button('正在发送…').dispatchEvent(new MouseEvent('click', { bubbles: true }))
    button('关闭邮箱设置窗口').click()
    await flush()
    expect(mocks.post).toHaveBeenCalledOnce()
    expect(dialog()).not.toBeNull()
    pending.resolve({ status: 429, retryAfter: 12, errors: [{ err_msg: '请等待后再次发送' }] })
    await flush()
    expect(button('12s 后可重新发送').disabled).toBe(true)
    expect(mocks.warning).toHaveBeenCalledWith('请等待后再次发送')
    await advance(12000)
    expect(button('重新发送验证邮件').disabled).toBe(false)
    expect(emailInput().value).toBe(profile.college_email)
  })

  it('preserves a verified binding on a throttled save and waits before accepting another save', async () => {
    mocks.post.mockResolvedValue({ status: 429, retryAfter: 9, errors: [{ err_msg: '操作过于频繁，请稍后再试' }] })
    await mount({ ...profile, verified: true })
    await edit()
    await save()
    expect(host.textContent).toContain('已验证')
    expect(button('9s 后可保存').disabled).toBe(true)
    expect(mocks.login).not.toHaveBeenCalled()
    await save()
    expect(mocks.post).toHaveBeenCalledOnce()
    button('取消').click()
    await flush()
    expect(emailInput().value).toBe(profile.college_email)
    await edit()
    await advance(9000)
    expect(button('保存').disabled).toBe(false)
  })

  it('shows a disabled-looking main email action that explains the reason on hover, focus and click', async () => {
    await mount()
    const mainEdit = button('编辑主邮箱')
    expect(mainEdit.getAttribute('aria-disabled')).toBe('true')
    expect(mainEdit.disabled).toBe(false)
    mainEdit.dispatchEvent(new MouseEvent('mouseenter'))
    await flush()
    expect(document.body.querySelector('[role="tooltip"]')?.textContent).toContain('主邮箱暂不支持修改。')
    mainEdit.dispatchEvent(new MouseEvent('mouseleave'))
    await advance(100)
    expect(document.body.querySelector('[role="tooltip"]')).toBeNull()
    mainEdit.focus()
    mainEdit.click()
    await flush()
    expect(document.body.querySelector('[role="tooltip"]')).not.toBeNull()
    expect(host.querySelector<HTMLInputElement>('input[id^="main-email-"]')?.disabled).toBe(true)
    expect(dialog()).toBeNull()
    expect(mocks.post).not.toHaveBeenCalled()
  })

  it('does not replace another signed-in user when synchronizing a saved binding', async () => {
    await mount()
    mocks.sharedUser!.value = { ...profile, id: 99, unread: { unread: { user: 7, system: 0, like: 0, reply: 0 }, total: 7 } }
    await edit()
    await save()
    expect(emailInput().value).toBe(newEmail)
    expect(mocks.login).not.toHaveBeenCalled()
  })
})
