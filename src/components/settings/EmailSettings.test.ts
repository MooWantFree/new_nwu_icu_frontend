import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick, type App } from 'vue'
import EmailSettings from './EmailSettings.vue'
import { api } from '@/lib/requests'

const messages = vi.hoisted(() => ({
  success: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
}))

vi.mock('@/lib/requests', () => ({
  api: { post: vi.fn() },
}))

vi.mock('naive-ui', () => ({
  NModal: {
    props: ['show', 'maskClosable'],
    setup: (props: { show: boolean }, { slots }: { slots: { default?: () => unknown } }) => (
      () => props.show ? slots.default?.() : null
    ),
  },
  useMessage: () => messages,
}))

const profile = {
  id: 1,
  username: 'tester',
  email: 'tester@example.com',
  date_joined: '2026-01-01T00:00:00Z',
  nickname: 'Tester',
  avatar: '',
  uuid: '00000000-0000-0000-0000-000000000001',
  has_avatar: false,
  college_email: 'student@stumail.nwu.edu.cn',
  verified: false,
  is_me: true,
  is_staff: false,
} as const

const flush = async () => {
  for (let index = 0; index < 5; index += 1) {
    await Promise.resolve()
    await nextTick()
  }
}

const button = (container: HTMLElement, label: string, index = 0) => {
  const matches = Array.from(container.querySelectorAll('button')).filter(
    candidate => candidate.textContent?.trim() === label,
  )
  const match = matches[index]
  if (!match) throw new Error(`Button not found: ${label}`)
  return match as HTMLButtonElement
}

let app: App | undefined
let container: HTMLDivElement

beforeEach(() => {
  vi.clearAllMocks()
  container = document.createElement('div')
  document.body.append(container)
})

afterEach(() => {
  app?.unmount()
  container.remove()
})

describe('email settings', () => {
  it('resends a pending NWU verification email and starts a cooldown', async () => {
    vi.mocked(api.post).mockResolvedValue({ status: 200, errors: [], content: {}, data: {} } as never)
    app = createApp(EmailSettings, { userInfo: profile })
    app.mount(container)

    button(container, '等待验证').click()
    await nextTick()

    expect(container.textContent).toContain('验证你的 NWU 邮箱')
    expect(container.textContent).toContain(profile.college_email)

    button(container, '重新发送验证邮件').click()
    await flush()

    expect(api.post).toHaveBeenCalledWith({
      url: '/api/user/bind-college-email/bind/',
      query: { college_email: profile.college_email },
    })
    expect(container.textContent).toContain('60s 后可重新发送')
    expect(messages.success).toHaveBeenCalledWith('验证邮件已重新发送')
  })

  it('uses the styled modal for both main and verified NWU email edits', async () => {
    app = createApp(EmailSettings, {
      userInfo: { ...profile, verified: true },
    })
    app.mount(container)

    button(container, '编辑', 0).click()
    await nextTick()
    expect(container.textContent).toContain('主邮箱暂不支持修改')
    button(container, '我知道了').click()
    await nextTick()

    button(container, '编辑', 1).click()
    await nextTick()
    expect(container.textContent).toContain('NWU 邮箱暂不支持修改')
  })
})
