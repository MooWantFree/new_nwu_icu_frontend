import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, type App } from 'vue'
import ProfileSettings from './ProfileSettings.vue'
import type { APIUserProfile } from '@/types/api/user/profilePage'

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  fetchUserInfo: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  messages: [] as { name: string; content: string; destroy: ReturnType<typeof vi.fn> }[],
  avatarUuid: '20000000-0000-4000-8000-000000000002',
}))

vi.mock('@/lib/requests', () => ({ api: { post: mocks.post } }))
vi.mock('@/lib/useUser', () => ({ useUser: () => ({ fetchUserInfo: mocks.fetchUserInfo }) }))
vi.mock('@/lib/useShadcnToast', () => ({ useShadcnToast: () => ({ success: mocks.success, error: mocks.error }) }))
vi.mock('@/components/common/UserAvatar.vue', () => ({ default: defineComponent({
  props: ['avatar', 'uuid', 'hasAvatar', 'alt'],
  setup: props => () => h('span', {
    'data-profile-avatar': props.avatar,
    'data-has-avatar': String(props.hasAvatar),
  }),
}) }))
vi.mock('./AvatarUpload.vue', () => ({ default: defineComponent({
  props: { binding: Boolean },
  emits: ['upload', 'close'],
  setup: (props, { emit }) => () => h('div', {
    role: 'dialog',
    'aria-label': '上传头像',
    'data-binding': String(props.binding),
  }, [
    h('button', {
      type: 'button', disabled: props.binding,
      onClick: () => emit('upload', `/api/download/${mocks.avatarUuid}/`),
    }, '上传测试头像'),
    h('button', {
      type: 'button', disabled: props.binding,
      onClick: () => emit('upload', '/api/download/invalid-avatar/'),
    }, '上传无效头像'),
    h('button', {
      type: 'button', disabled: props.binding,
      onClick: () => emit('close'),
    }, '取消上传'),
  ]),
}) }))

const profile: APIUserProfile['response'] = {
  id: 1,
  username: 'ms',
  nickname: '原昵称',
  bio: '原来的简介',
  email: 'tester@example.com',
  date_joined: '2026-01-01T00:00:00Z',
  avatar: '10000000-0000-4000-8000-000000000001',
  uuid: '00000000-0000-4000-8000-000000000001',
  has_avatar: true,
  verified: false,
  is_me: true,
  is_staff: false,
}

const nicknameCharactersError = '昵称只能使用中文、英文字母、数字和这些半角符号：! @ # $ % ^ & * ( ) _ + ~ - = { }'
const nicknameLengthError = '昵称长度需要在 2–30 个字符之间'

const successResponse = (avatar = profile.avatar) => ({
  status: 200,
  content: { id: profile.id, nickname: profile.nickname, avatar, has_avatar: true },
})

const deferred = <T>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(accept => { resolve = accept })
  return { promise, resolve }
}

const flush = async () => {
  for (let index = 0; index < 8; index += 1) {
    await Promise.resolve()
    await nextTick()
  }
}

let app: App | undefined
let container: HTMLDivElement

const mount = (userInfo = profile) => {
  app = createApp(ProfileSettings, { userInfo })
  app.mount(container)
}

const button = (label: string) => {
  const target = Array.from(container.querySelectorAll<HTMLButtonElement>('button'))
    .find(candidate => (candidate.getAttribute('aria-label') || candidate.textContent?.trim()) === label)
  if (!target) throw new Error(`Missing profile button: ${label}`)
  return target
}

const setField = async (id: string, value: string) => {
  const field = container.querySelector<HTMLInputElement | HTMLTextAreaElement>(`#${id}`)!
  field.value = value
  field.dispatchEvent(new Event('input', { bubbles: true }))
  await nextTick()
}

const submit = async () => {
  container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  await flush()
}

const avatarValue = () => container.querySelector('[data-profile-avatar]')?.getAttribute('data-profile-avatar')
const avatarDialog = () => container.querySelector('[role="dialog"][aria-label="上传头像"]')

const startAvatarUpload = async () => {
  button('更换头像').click()
  await nextTick()
  button('上传测试头像').click()
  await flush()
}

beforeEach(() => {
  vi.resetAllMocks()
  mocks.messages.length = 0
  mocks.error.mockImplementation((content: string) => {
    const message = { name: `test-toast-${mocks.messages.length + 1}`, content, destroy: vi.fn() }
    mocks.messages.push(message)
    return message
  })
  mocks.fetchUserInfo.mockResolvedValue(undefined)
  mocks.post.mockResolvedValue(successResponse())
  container = document.createElement('div')
  document.body.append(container)
})

afterEach(() => {
  app?.unmount()
  app = undefined
  container.remove()
})

describe('ProfileSettings', () => {
  it('saves only editable text fields for an account with a legacy short username', async () => {
    mount()
    const username = container.querySelector<HTMLInputElement>('#profile-username')!
    expect(username.disabled).toBe(true)
    expect(username.value).toBe('ms')
    await setField('profile-nickname', '新的昵称')
    await setField('profile-bio', '更新后的简介')
    await submit()

    expect(mocks.post).toHaveBeenCalledExactlyOnceWith({
      url: '/api/user/profile/',
      query: { nickname: '新的昵称', bio: '更新后的简介' },
    })
    expect(mocks.fetchUserInfo).toHaveBeenCalledOnce()
    expect(mocks.success).toHaveBeenCalledWith('个人资料更新成功')
    expect(mocks.error).not.toHaveBeenCalled()
  })

  it.each([
    ['有 空格', nicknameCharactersError],
    ['A', nicknameLengthError],
  ])('rejects nickname %s and focuses its accessible field error', async (nickname, error) => {
    mount()
    await setField('profile-nickname', nickname)
    await submit()

    const input = container.querySelector<HTMLInputElement>('#profile-nickname')!
    expect(document.activeElement).toBe(input)
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(input.getAttribute('aria-describedby')).toContain('profile-nickname-error')
    expect(container.querySelector('#profile-nickname-error')?.textContent).toBe(error)
    expect(mocks.post).not.toHaveBeenCalled()
    expect(mocks.fetchUserInfo).not.toHaveBeenCalled()
  })

  it('does not toast or send a request on mounting an account with a legacy invalid nickname', async () => {
    mount({ ...profile, nickname: '旧 昵称' })
    await flush()
    expect(mocks.error).not.toHaveBeenCalled()
    expect(mocks.post).not.toHaveBeenCalled()
    expect(mocks.fetchUserInfo).not.toHaveBeenCalled()
    await setField('profile-nickname', '修正后的昵称')
    expect(mocks.error).not.toHaveBeenCalled()
  })

  it('shows inline feedback and one persistent toast while typing without submitting or moving focus', async () => {
    mount()
    const bio = container.querySelector<HTMLTextAreaElement>('#profile-bio')!
    bio.focus()
    await setField('profile-nickname', '有 空格')
    expect(container.querySelector('#profile-nickname-error')?.textContent).toBe(nicknameCharactersError)
    expect(container.querySelector('#profile-nickname')?.getAttribute('aria-invalid')).toBe('true')
    expect(container.querySelector('#profile-nickname')?.getAttribute('aria-describedby')).toContain('profile-nickname-error')
    expect(mocks.error).toHaveBeenCalledExactlyOnceWith(nicknameCharactersError, expect.objectContaining({ duration: 0 }))
    expect(document.activeElement).toBe(bio)
    expect(mocks.post).not.toHaveBeenCalled()
    expect(mocks.fetchUserInfo).not.toHaveBeenCalled()
  })

  it('updates the existing toast for further invalid input, reuses it on submit and destroys it after correction', async () => {
    mount()
    await setField('profile-nickname', '有 空格')
    const message = mocks.messages[0]
    await setField('profile-nickname', 'A')
    expect(container.querySelector('#profile-nickname-error')?.textContent).toBe(nicknameLengthError)
    expect(message.content).toBe(nicknameLengthError)
    expect(mocks.error).toHaveBeenCalledOnce()
    expect(message.destroy).not.toHaveBeenCalled()
    await setField('profile-nickname', '校园🙂')
    expect(message.content).toBe(nicknameCharactersError)
    expect(mocks.error).toHaveBeenCalledOnce()
    await submit()
    await submit()
    expect(mocks.error).toHaveBeenCalledOnce()
    expect(document.activeElement).toBe(container.querySelector('#profile-nickname'))
    expect(mocks.post).not.toHaveBeenCalled()
    await setField('profile-nickname', '合法昵称')
    expect(message.destroy).toHaveBeenCalledOnce()
    expect(container.querySelector('#profile-nickname-error')).toBeNull()
    expect(container.querySelector('#profile-nickname')?.getAttribute('aria-invalid')).toBe('false')
    expect(container.querySelector('#profile-nickname')?.getAttribute('aria-describedby')).not.toContain('profile-nickname-error')
    await setField('profile-nickname', '再次🙂')
    expect(mocks.error).toHaveBeenCalledTimes(2)
    expect(mocks.messages[1]).not.toBe(message)
    expect(message.destroy).toHaveBeenCalledOnce()
  })

  it('waits for IME composition to finish before validating its final nickname', async () => {
    mount()
    const input = container.querySelector<HTMLInputElement>('#profile-nickname')!
    input.focus()
    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }))
    await setField('profile-nickname', 'n')
    expect(mocks.error).not.toHaveBeenCalled()
    expect(container.querySelector('#profile-nickname-error')).toBeNull()
    await setField('profile-nickname', '昵称')
    input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }))
    await flush()
    expect(mocks.error).not.toHaveBeenCalled()
    expect(container.querySelector('#profile-nickname-error')).toBeNull()
    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }))
    await setField('profile-nickname', '最终🙂')
    expect(mocks.error).not.toHaveBeenCalled()
    input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }))
    await flush()
    expect(mocks.error).toHaveBeenCalledExactlyOnceWith(nicknameCharactersError, expect.objectContaining({ duration: 0 }))
    expect(container.querySelector('#profile-nickname-error')?.textContent).toBe(nicknameCharactersError)
    expect(document.activeElement).toBe(input)
    expect(mocks.post).not.toHaveBeenCalled()
  })

  it('accepts every supported half-width symbol and saves the nickname unchanged', async () => {
    mount()
    const symbols = '!@#$%^&*()_+~-={}'
    for (const symbol of symbols) {
      await setField('profile-nickname', `名${symbol}`)
      expect(container.querySelector('#profile-nickname-error')).toBeNull()
      expect(mocks.error).not.toHaveBeenCalled()
    }
    const nickname = `中文Aa0${symbols}`
    await setField('profile-nickname', nickname)
    expect(mocks.post).not.toHaveBeenCalled()
    await submit()
    expect(mocks.post).toHaveBeenCalledExactlyOnceWith({
      url: '/api/user/profile/', query: { nickname, bio: profile.bio },
    })
    expect(mocks.error).not.toHaveBeenCalled()
  })

  it.each(['校园🙂', '校.园', '校,园', '校，园', '校\\园', '校/园', '校[园', '校]园', '校！园', '校 园'])(
    'rejects unsupported characters in %s while typing', async nickname => {
      mount()
      await setField('profile-nickname', nickname)
      expect(container.querySelector('#profile-nickname-error')?.textContent).toBe(nicknameCharactersError)
      expect(mocks.error).toHaveBeenCalledExactlyOnceWith(nicknameCharactersError, expect.objectContaining({ duration: 0 }))
      expect(mocks.post).not.toHaveBeenCalled()
    },
  )

  it('clears a rejected server nickname error after a valid edit without another request', async () => {
    mocks.post.mockResolvedValue({ status: 400, errors: [
      { field: 'nickname', err_code: 'duplicate', err_msg: '昵称已被使用' },
    ] })
    mount()
    await submit()
    expect(container.querySelector('#profile-nickname-error')?.textContent).toBe('昵称已被使用')
    expect(container.textContent).toContain('昵称已被使用')
    await setField('profile-nickname', '未使用的新昵称')
    expect(container.querySelector('#profile-nickname-error')).toBeNull()
    expect(container.querySelector('#profile-nickname')?.getAttribute('aria-invalid')).toBe('false')
    expect(container.textContent).not.toContain('昵称已被使用')
    expect(mocks.post).toHaveBeenCalledOnce()
    expect(mocks.success).not.toHaveBeenCalled()
  })

  it('destroys its persistent nickname toast when the form unmounts', async () => {
    mount()
    await setField('profile-nickname', '非法🙂')
    const message = mocks.messages[0]
    expect(message.destroy).not.toHaveBeenCalled()
    app!.unmount()
    app = undefined
    expect(message.destroy).toHaveBeenCalledOnce()
    expect(mocks.post).not.toHaveBeenCalled()
  })

  it('shows server field errors inline and as a Chinese toast without raw error JSON', async () => {
    mocks.post.mockResolvedValue({ status: 400, errors: [
      { field: 'nickname', err_code: 'duplicate', err_msg: '昵称已被使用' },
      { field: 'bio', err_code: 'invalid', err_msg: '个人简介内容不符合要求' },
    ] })
    mount()
    await submit()

    expect(container.querySelector('#profile-nickname-error')?.textContent).toBe('昵称已被使用')
    expect(container.querySelector('#profile-bio-error')?.textContent).toBe('个人简介内容不符合要求')
    expect(container.querySelector('#profile-nickname')?.getAttribute('aria-invalid')).toBe('true')
    expect(container.querySelector('#profile-bio')?.getAttribute('aria-invalid')).toBe('true')
    expect(mocks.error).toHaveBeenCalledWith('昵称已被使用；个人简介内容不符合要求')
    expect(container.textContent).not.toContain('err_code')
    expect(container.textContent).not.toContain('duplicate')
    expect(mocks.fetchUserInfo).not.toHaveBeenCalled()
    expect(mocks.success).not.toHaveBeenCalled()
    await setField('profile-nickname', '合法的新昵称')
    expect(container.querySelector('#profile-nickname-error')).toBeNull()
    expect(container.querySelector('#profile-bio-error')?.textContent).toBe('个人简介内容不符合要求')
    expect(container.textContent).not.toContain('昵称已被使用')
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('个人简介内容不符合要求')
    expect(mocks.post).toHaveBeenCalledOnce()
  })

  it('prevents duplicate saves until the request and account refresh both finish', async () => {
    const save = deferred<ReturnType<typeof successResponse>>()
    const refresh = deferred<void>()
    mocks.post.mockReturnValueOnce(save.promise)
    mocks.fetchUserInfo.mockReturnValueOnce(refresh.promise)
    mount()
    await submit()
    await submit()

    expect(mocks.post).toHaveBeenCalledOnce()
    expect(button('保存中…').disabled).toBe(true)
    expect(container.querySelector<HTMLInputElement>('#profile-nickname')?.disabled).toBe(true)
    save.resolve(successResponse())
    await flush()
    expect(mocks.fetchUserInfo).toHaveBeenCalledOnce()
    expect(mocks.success).not.toHaveBeenCalled()
    expect(button('保存中…').disabled).toBe(true)

    refresh.resolve(undefined)
    await flush()
    expect(button('保存更改').disabled).toBe(false)
    expect(mocks.success).toHaveBeenCalledWith('个人资料更新成功')
  })

  it('keeps the avatar dialog and previous avatar when binding is rejected', async () => {
    const binding = deferred<{ status: number; errors: { field: string; err_code: string; err_msg: string }[] }>()
    mocks.post.mockReturnValueOnce(binding.promise)
    mount()
    await startAvatarUpload()

    expect(mocks.post).toHaveBeenCalledExactlyOnceWith({
      url: '/api/user/profile/', query: { avatar_uuid: mocks.avatarUuid },
    })
    expect(avatarDialog()?.getAttribute('data-binding')).toBe('true')
    expect(container.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true)
    expect(avatarValue()).toBe(profile.avatar)

    binding.resolve({ status: 400, errors: [
      { field: 'avatar', err_code: 'invalid', err_msg: '图片文件不可用' },
    ] })
    await flush()
    expect(avatarDialog()?.getAttribute('data-binding')).toBe('false')
    expect(avatarValue()).toBe(profile.avatar)
    expect(container.textContent).toContain('图片文件不可用')
    expect(mocks.error).toHaveBeenCalledWith('图片文件不可用')
    expect(mocks.fetchUserInfo).not.toHaveBeenCalled()
    expect(mocks.success).not.toHaveBeenCalled()
  })

  it('closes the avatar dialog only after a valid binding and account refresh succeed', async () => {
    const binding = deferred<ReturnType<typeof successResponse>>()
    const refresh = deferred<void>()
    mocks.post.mockReturnValueOnce(binding.promise)
    mocks.fetchUserInfo.mockReturnValueOnce(refresh.promise)
    mount()
    await startAvatarUpload()

    expect(avatarDialog()?.getAttribute('data-binding')).toBe('true')
    expect(avatarValue()).toBe(profile.avatar)
    binding.resolve(successResponse(mocks.avatarUuid))
    await flush()
    expect(mocks.fetchUserInfo).toHaveBeenCalledOnce()
    expect(avatarDialog()?.getAttribute('data-binding')).toBe('true')
    expect(avatarValue()).toBe(mocks.avatarUuid)
    expect(mocks.success).not.toHaveBeenCalled()

    refresh.resolve(undefined)
    await flush()
    expect(avatarDialog()).toBeNull()
    expect(avatarValue()).toBe(mocks.avatarUuid)
    expect(button('保存更改').disabled).toBe(false)
    expect(mocks.success).toHaveBeenCalledWith('头像更新成功')
  })

  it('rejects malformed avatar URLs without binding and allows cancelling the dialog', async () => {
    mount()
    button('更换头像').click()
    await nextTick()
    button('上传无效头像').click()
    await flush()
    expect(mocks.post).not.toHaveBeenCalled()
    expect(avatarDialog()?.getAttribute('data-binding')).toBe('false')
    expect(avatarValue()).toBe(profile.avatar)
    expect(mocks.error).toHaveBeenCalledWith('头像上传失败，请重新选择图片')
    button('取消上传').click()
    await nextTick()
    expect(avatarDialog()).toBeNull()
  })
})
