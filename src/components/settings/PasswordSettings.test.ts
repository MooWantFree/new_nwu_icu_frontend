import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick, type App } from 'vue'
import PasswordSettings from './PasswordSettings.vue'

const mocks = vi.hoisted(() => ({
  post: vi.fn(), success: vi.fn(), error: vi.fn(), logout: vi.fn(), push: vi.fn(),
}))
vi.mock('@/lib/requests', () => ({ api: { post: mocks.post } }))
vi.mock('@/lib/useShadcnToast', () => ({ useShadcnToast: () => ({ success: mocks.success, error: mocks.error }) }))
vi.mock('@/lib/useUser', () => ({ useUser: () => ({ logout: mocks.logout }) }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: mocks.push }) }))

type PasswordField = 'old_password' | 'new_password' | 'confirm_password'
const validPasswords = { old_password: 'OldPass123', new_password: 'NewPass123', confirm_password: 'NewPass123' }
let app: App | undefined
let container: HTMLDivElement

const flush = async () => {
  for (let index = 0; index < 8; index++) { await Promise.resolve(); await nextTick() }
}
const mount = () => {
  app = createApp(PasswordSettings)
  app.mount(container)
}
const input = (name: PasswordField) => container.querySelector<HTMLInputElement>(`input[name="${name}"]`)!
const button = (label: string) => {
  const target = [...container.querySelectorAll<HTMLButtonElement>('button')]
    .find(candidate => candidate.textContent?.trim() === label || candidate.getAttribute('aria-label') === label)
  if (!target) throw new Error(`Missing password button: ${label}`)
  return target
}
const setPasswords = async (values = validPasswords) => {
  for (const name of Object.keys(values) as PasswordField[]) {
    input(name).value = values[name]
    input(name).dispatchEvent(new Event('input', { bubbles: true }))
  }
  await nextTick()
}
const submit = async () => {
  container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  await flush()
}
const expectFieldError = (field: PasswordField, message: string) => {
  expect(input(field).getAttribute('aria-invalid')).toBe('true')
  const descriptionIds = input(field).getAttribute('aria-describedby')?.split(' ') ?? []
  expect(descriptionIds.some(id => document.getElementById(id)?.textContent?.trim() === message)).toBe(true)
  expect(document.activeElement).toBe(input(field))
}

beforeEach(() => {
  vi.resetAllMocks()
  mocks.post.mockResolvedValue({ status: 200, errors: [], content: {} })
  mocks.push.mockResolvedValue(undefined)
  container = document.createElement('div')
  document.body.append(container)
})

afterEach(() => {
  app?.unmount()
  app = undefined
  container.remove()
})

describe('password settings', () => {
  it('uses password-manager autocomplete and toggles each password without submitting', async () => {
    mount()
    await setPasswords()
    expect(input('old_password').autocomplete).toBe('current-password')
    expect(input('new_password').autocomplete).toBe('new-password')
    expect(input('confirm_password').autocomplete).toBe('new-password')
    button('显示当前密码').click()
    await nextTick()
    expect(input('old_password').type).toBe('text')
    expect(input('new_password').type).toBe('password')
    expect(button('隐藏当前密码').getAttribute('aria-pressed')).toBe('true')
    button('隐藏当前密码').click()
    await nextTick()
    expect(input('old_password').type).toBe('password')
    expect(input('old_password').value).toBe(validPasswords.old_password)
    expect(mocks.post).not.toHaveBeenCalled()
  })

  it.each([
    ['old_password', '请输入当前密码'],
    ['new_password', '请输入新密码'],
    ['confirm_password', '请再次输入新密码'],
  ] as const)('requires %s and focuses its inline Chinese error', async (field, message) => {
    mount()
    await setPasswords({ ...validPasswords, [field]: '' })
    await submit()
    expectFieldError(field, message)
    expect(mocks.post).not.toHaveBeenCalled()
    expect(mocks.logout).not.toHaveBeenCalled()
    expect(mocks.push).not.toHaveBeenCalled()
  })

  it.each([
    ['new_password', 'Aa12345', 'Aa12345', '密码长度至少为8个字符'],
    ['new_password', `Aa${'1'.repeat(29)}`, `Aa${'1'.repeat(29)}`, '密码长度不能超过30个字符'],
    ['new_password', 'newpass123', 'newpass123', '密码必须包含至少一个大写字母、一个小写字母和一个数字'],
    ['confirm_password', 'NewPass123', 'OtherPass123', '两次输入的密码不匹配'],
    ['new_password', 'OldPass123', 'OldPass123', '新密码不能与旧密码相同'],
  ] as const)('rejects invalid %s before requesting a password reset', async (field, newPassword, confirmation, message) => {
    mount()
    await setPasswords({ ...validPasswords, new_password: newPassword, confirm_password: confirmation })
    await submit()
    expectFieldError(field, message)
    expect(mocks.post).not.toHaveBeenCalled()
    expect(mocks.success).not.toHaveBeenCalled()
  })

  it.each([
    ['password_old_not_true', 'old_password', '旧密码不正确'],
    ['password_re_not_consistent', 'confirm_password', '两次输入的密码不一致'],
    ['password_re_equal_old', 'new_password', '新老密码不可以一致'],
    ['password_invalid_char', 'new_password', '密码必须同时包含大写字母, 小写字母, 数字'],
    ['password_not_match_length', 'new_password', '密码长度必须在8-30之间'],
  ] as const)('maps backend %s to the correct field and preserves passwords for retry', async (code, field, message) => {
    mocks.post.mockResolvedValue({ status: 400, errors: [{ field: 'password', err_code: code, err_msg: message }] })
    mount()
    await setPasswords()
    await submit()
    expectFieldError(field, message)
    expect(mocks.error).toHaveBeenCalledWith(message)
    for (const name of Object.keys(validPasswords) as PasswordField[]) expect(input(name).value).toBe(validPasswords[name])
    expect(mocks.logout).not.toHaveBeenCalled()
    expect(mocks.push).not.toHaveBeenCalled()
    expect(mocks.success).not.toHaveBeenCalled()
    expect(container.textContent).not.toContain(code)
  })

  it('shows an expired-login message as a focused alert without discarding the entered passwords', async () => {
    mocks.post.mockResolvedValue({ status: 401, errors: [{ field: 'login', err_code: 'not_login', err_msg: '请先登录' }] })
    mount()
    await setPasswords()
    await submit()
    const alert = container.querySelector<HTMLElement>('[role="alert"]')!
    expect(alert.textContent).toContain('请先登录')
    expect(document.activeElement).toBe(alert)
    expect(mocks.error).toHaveBeenCalledWith('请先登录')
    expect(input('new_password').value).toBe(validPasswords.new_password)
    expect(mocks.logout).not.toHaveBeenCalled()
    expect(mocks.push).not.toHaveBeenCalled()
  })

  it('prevents duplicate requests and disables editing and reveal controls while submitting', async () => {
    let resolve!: (value: { status: number }) => void
    mocks.post.mockReturnValue(new Promise<{ status: number }>(accept => { resolve = accept }))
    mount()
    await setPasswords()
    await submit()
    await submit()
    expect(mocks.post).toHaveBeenCalledExactlyOnceWith({ url: '/api/user/reset-login/', query: validPasswords })
    expect(container.querySelector('form')?.getAttribute('aria-busy')).toBe('true')
    expect(button('保存中…').disabled).toBe(true)
    for (const name of Object.keys(validPasswords) as PasswordField[]) expect(input(name).disabled).toBe(true)
    expect(button('显示当前密码').disabled).toBe(true)
    button('显示当前密码').click()
    await nextTick()
    expect(input('old_password').type).toBe('password')
    expect(mocks.logout).not.toHaveBeenCalled()
    resolve({ status: 200 })
    await flush()
    expect(mocks.logout).toHaveBeenCalledOnce()
    expect(mocks.push).toHaveBeenCalledExactlyOnceWith('/')
  })

  it('posts the three unmodified password fields, then clears passwords, logs out and navigates home', async () => {
    const passwords = { ...validPasswords, old_password: ' old password ' }
    mount()
    await setPasswords(passwords)
    button('显示新密码').click()
    await nextTick()
    await submit()
    expect(mocks.post).toHaveBeenCalledExactlyOnceWith({ url: '/api/user/reset-login/', query: passwords })
    expect(mocks.success).toHaveBeenCalledExactlyOnceWith('密码修改成功，请重新登录')
    expect(mocks.logout).toHaveBeenCalledOnce()
    expect(mocks.push).toHaveBeenCalledExactlyOnceWith('/')
    expect(mocks.success.mock.invocationCallOrder[0]).toBeLessThan(mocks.logout.mock.invocationCallOrder[0])
    expect(mocks.logout.mock.invocationCallOrder[0]).toBeLessThan(mocks.push.mock.invocationCallOrder[0])
    for (const name of Object.keys(validPasswords) as PasswordField[]) {
      expect(input(name).value).toBe('')
      expect(input(name).type).toBe('password')
    }
    expect(mocks.error).not.toHaveBeenCalled()
  })

  it('shows a Chinese network error, preserves inputs and clears stale errors after a successful retry', async () => {
    mocks.post.mockRejectedValueOnce(new Error('Network Error'))
    mount()
    await setPasswords()
    await submit()
    expect(mocks.error).toHaveBeenCalledWith('密码修改失败，请稍后重试')
    expect(container.querySelector('[role="alert"]')?.textContent).not.toContain('Network Error')
    expect(input('old_password').value).toBe(validPasswords.old_password)
    expect(button('保存更改').disabled).toBe(false)
    expect(mocks.logout).not.toHaveBeenCalled()
    await submit()
    expect(mocks.post).toHaveBeenCalledTimes(2)
    expect(container.querySelector('[role="alert"]')).toBeNull()
    expect(mocks.success).toHaveBeenCalledOnce()
    expect(mocks.logout).toHaveBeenCalledOnce()
  })
})
