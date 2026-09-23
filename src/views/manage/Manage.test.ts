import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, type App } from 'vue'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'

import Manage from './Manage.vue'
import { api } from '@/lib/requests'
import {
  browserSupportsWebAuthn,
  startAuthentication,
  startRegistration,
} from '@simplewebauthn/browser'

const messageSuccess = vi.fn()

vi.mock('@/lib/requests', () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }))
vi.mock('@simplewebauthn/browser', () => ({
  browserSupportsWebAuthn: vi.fn(),
  startAuthentication: vi.fn(),
  startRegistration: vi.fn(),
}))
vi.mock('naive-ui', () => ({ useMessage: () => ({ success: messageSuccess }) }))
vi.mock('@/components/guestbook/GuestbookEditor.vue', () => ({
  default: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    setup: (props: { modelValue: string }, { emit }: { emit: (event: string, value: string) => void }) => () => h('textarea', {
      'aria-label': '公告正文',
      value: props.modelValue,
      onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLTextAreaElement).value),
    }),
  },
}))

const baseSession = {
  passkey_enrolled: true,
  passkey_count: 1,
  elevated: false,
  elevated_until: null,
  permissions: {
    moderate_reports: true,
    publish_announcements: true,
    review_resource_uploads: true,
    manage_telegram_notifications: true,
  },
}

const announcementEntry = {
  id: 91,
  root_id: null,
  parent_id: null,
  title: '原公告',
  content: '<p>原正文</p>',
  anonymous: false,
  is_deleted: false,
  created_at: '2026-09-20T00:00:00Z',
  updated_at: '2026-09-21T00:00:00Z',
  priority: 20,
  is_visible: true,
  like_count: 0,
  reply_count: 0,
  children_count: 0,
  author: { id: 1, nickname: '管理员', avatar: null },
  is_me: false,
  liked_by_me: false,
}

const flush = async () => {
  for (let index = 0; index < 12; index += 1) {
    await Promise.resolve()
    await nextTick()
  }
}

let app: App | undefined
let container: HTMLDivElement

const mountManage = async (query = '') => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/manage', component: Manage }],
  })
  await router.push(`/manage${query}`)
  app = createApp({ render: () => h(RouterView) }).use(router)
  app.mount(container)
  await flush()
  return router
}

const findButton = (text: string) => [...container.querySelectorAll('button')]
  .find(button => button.textContent?.includes(text)) as HTMLButtonElement
const findExactButton = (text: string) => [...container.querySelectorAll('button')]
  .find(button => button.textContent?.trim() === text) as HTMLButtonElement

const deferred = <T>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((promiseResolve) => { resolve = promiseResolve })
  return { promise, resolve }
}

beforeEach(() => {
  vi.clearAllMocks()
  container = document.createElement('div')
  document.body.append(container)
  vi.mocked(api.get).mockResolvedValue({ status: 200, content: baseSession } as never)
  vi.mocked(browserSupportsWebAuthn).mockReturnValue(true)
})

afterEach(() => {
  app?.unmount()
  container.remove()
})

describe('management Passkey flow', () => {
  it('shows a disabled fallback when WebAuthn is unsupported', async () => {
    vi.mocked(browserSupportsWebAuthn).mockReturnValue(false)
    await mountManage()

    const button = findButton('当前浏览器不支持 Passkey')
    expect(button.disabled).toBe(true)
    expect(startAuthentication).not.toHaveBeenCalled()
  })

  it.each([
    ['取消', new Error('用户取消了 Passkey 验证')],
    ['超时', new Error('Passkey 验证超时')],
  ])('surfaces browser %s without sending a verify request', async (_label, browserError) => {
    vi.mocked(api.post).mockResolvedValueOnce({ status: 200, content: {} } as never)
    vi.mocked(startAuthentication).mockRejectedValueOnce(browserError)
    await mountManage()

    findButton('验证 Passkey').click()
    await flush()

    expect(container.textContent).toContain(browserError.message)
    expect(api.post).toHaveBeenCalledTimes(1)
  })

  it('shows server verification failures and does not enter the panel', async () => {
    vi.mocked(api.post)
      .mockResolvedValueOnce({ status: 200, content: {} } as never)
      .mockResolvedValueOnce({
        status: 400,
        errors: [{ field: 'passkey', err_code: 'passkey_verification_failed', err_msg: 'Passkey 验证失败，请重试' }],
      } as never)
    vi.mocked(startAuthentication).mockResolvedValueOnce({ id: 'credential' } as never)
    await mountManage('?next=https://evil.example/')

    findButton('验证 Passkey').click()
    await flush()

    expect(container.textContent).toContain('Passkey 验证失败，请重试')
    expect([...container.querySelectorAll('h1')].some(heading => heading.textContent === '管理员面板')).toBe(false)
  })

  it('supports first enrollment and reports browser registration cancellation', async () => {
    vi.mocked(api.get).mockResolvedValue({
      status: 200,
      content: { ...baseSession, passkey_enrolled: false, passkey_count: 0 },
    } as never)
    vi.mocked(api.post).mockResolvedValueOnce({ status: 200, content: {} } as never)
    vi.mocked(startRegistration).mockRejectedValueOnce(new Error('已取消创建 Passkey'))
    await mountManage()

    const inputs = container.querySelectorAll('input')
    ;(inputs[0] as HTMLInputElement).value = 'Security key'
    inputs[0].dispatchEvent(new Event('input'))
    ;(inputs[1] as HTMLInputElement).value = 'one-time-code'
    inputs[1].dispatchEvent(new Event('input'))
    await nextTick()
    findButton('绑定 Passkey').click()
    await flush()

    expect(container.textContent).toContain('已取消创建 Passkey')
    expect(api.post).toHaveBeenCalledTimes(1)
  })

  it('surfaces an actionable KeePassXC localhost error even when followed by an empty response', async () => {
    vi.mocked(api.get).mockResolvedValue({
      status: 200,
      content: { ...baseSession, passkey_enrolled: false, passkey_count: 0 },
    } as never)
    vi.mocked(api.post).mockResolvedValueOnce({ status: 200, content: {} } as never)
    vi.mocked(startRegistration).mockImplementationOnce(async () => {
      document.dispatchEvent(new CustomEvent('kpxc-passkeys-response', {
        detail: { errorCode: '25', errorMessage: '提供的 URL 无效' },
      }))
      document.dispatchEvent(new CustomEvent('kpxc-passkeys-response', {
        detail: { fallback: false },
      }))
      throw new Error('Registration was not completed')
    })
    await mountManage()

    const inputs = container.querySelectorAll('input')
    ;(inputs[0] as HTMLInputElement).value = 'KeePassXC'
    inputs[0].dispatchEvent(new Event('input'))
    ;(inputs[1] as HTMLInputElement).value = 'one-time-code'
    inputs[1].dispatchEvent(new Event('input'))
    await nextTick()
    findButton('绑定 Passkey').click()
    await flush()

    expect(container.textContent).toContain('KeePassXC-Browser 错误码 25')
    expect(container.textContent).toContain('提供的 URL 无效')
    expect(container.textContent).toContain('允许将 localhost 用于 Passkey')
    expect(api.post).toHaveBeenCalledTimes(1)
  })

  it('explains a KeePassXC empty response without claiming an error code exists', async () => {
    vi.mocked(api.get).mockResolvedValue({
      status: 200,
      content: { ...baseSession, passkey_enrolled: false, passkey_count: 0 },
    } as never)
    vi.mocked(api.post).mockResolvedValueOnce({ status: 200, content: {} } as never)
    vi.mocked(startRegistration).mockImplementationOnce(async () => {
      document.dispatchEvent(new CustomEvent('kpxc-passkeys-response', {
        detail: { fallback: false },
      }))
      throw new Error('Registration was not completed')
    })
    await mountManage()

    const inputs = container.querySelectorAll('input')
    ;(inputs[0] as HTMLInputElement).value = 'KeePassXC'
    inputs[0].dispatchEvent(new Event('input'))
    ;(inputs[1] as HTMLInputElement).value = 'one-time-code'
    inputs[1].dispatchEvent(new Event('input'))
    await nextTick()
    findButton('绑定 Passkey').click()
    await flush()

    expect(container.textContent).toContain('扩展返回了空响应')
    expect(container.textContent).not.toContain('KeePassXC-Browser 错误码')
    expect(api.post).toHaveBeenCalledTimes(1)
  })

  it('offers another enrollment after an administrator is elevated', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ status: 200, content: { ...baseSession, elevated: true } } as never)
      .mockResolvedValueOnce({
        status: 200,
        content: { results: [], page: 1, max_page: 1, count: 0 },
      } as never)
    await mountManage()

    findButton('添加备用 Passkey').click()
    await nextTick()

    expect(container.textContent).toContain('添加管理员 Passkey')
    expect(container.querySelectorAll('input')).toHaveLength(2)
  })

  it('shows a toast after accepting a resource approval', async () => {
    const upload = {
      id: 42,
      revision: 1,
      status: 'pending',
      target_path: '/courses',
      total_size_display: '1 KB',
      uploaded_by: { nickname: '投稿人', username: 'student' },
      files: [],
      publish_error: '',
    }
    vi.mocked(api.get).mockImplementation(async ({ url }) => {
      if (url === '/api/management/session/') {
        return { status: 200, content: { ...baseSession, elevated: true } } as never
      }
      if (url === '/api/management/reports/') {
        return { status: 200, content: { results: [], page: 1, max_page: 1, count: 0 } } as never
      }
      return { status: 200, content: { results: [upload], page: 1, max_page: 1, count: 1 } } as never
    })
    vi.mocked(api.post).mockResolvedValue({ status: 200, content: { upload_request: upload } } as never)
    await mountManage()

    findButton('文件审核').click()
    await flush()
    findButton('通过并发布').click()
    await flush()

    expect(messageSuccess).toHaveBeenCalledWith('审核已通过，资料正在发布。')
  })

  it('loads and saves four independent Telegram notification switches', async () => {
    const settings = {
      user_registration_enabled: true,
      guestbook_entry_enabled: true,
      course_review_enabled: false,
      reply_enabled: true,
    }
    vi.mocked(api.get).mockImplementation(async ({ url }) => {
      if (url === '/api/management/session/') {
        return { status: 200, content: { ...baseSession, elevated: true } } as never
      }
      if (url === '/api/management/notifications/telegram/') {
        return { status: 200, content: settings } as never
      }
      return { status: 200, content: { results: [], page: 1, max_page: 1, count: 0 } } as never
    })
    vi.mocked(api.post).mockResolvedValue({
      status: 200,
      content: { ...settings, user_registration_enabled: false },
    } as never)
    await mountManage()

    findButton('Telegram 通知').click()
    await flush()
    const switches = container.querySelectorAll('input[type="checkbox"]')
    expect(switches).toHaveLength(4)
    ;(switches[0] as HTMLInputElement).click()
    findButton('保存设置').click()
    await flush()

    expect(api.post).toHaveBeenCalledWith({
      url: '/api/management/notifications/telegram/',
      query: { ...settings, user_registration_enabled: false },
    })
    expect(container.textContent).toContain('设置已保存。')
  })

  it('links approved uploads to a decoded main-site directory while retaining encoded hrefs', async () => {
    const encodedResourceUrl = 'https://nwu.icu/disk/%E3%80%901%E3%80%91%E4%B8%AD%E5%9B%BD%E7%89%B9%E8%89%B2%E8%AF%BE%E7%A8%8B%28%E6%AF%9B%E6%A6%82%E9%A9%AC%E5%8E%9F%29/%E9%A9%AC%E5%8E%9F'
    const uploads = [
      {
        id: 43,
        revision: 1,
        status: 'approved',
        target_path: '/【1】中国特色课程(毛概马原)/马原',
        total_size_display: '1 KB',
        uploaded_by: { nickname: '投稿人', username: 'student' },
        files: [{ id: 101, relative_path: '讲义.pdf', size_display: '1 KB' }],
        publish_error: '',
        resource_url: encodedResourceUrl,
      },
      {
        id: 44,
        revision: 1,
        status: 'pending',
        target_path: '/待审核',
        total_size_display: '2 KB',
        uploaded_by: { nickname: '投稿人', username: 'student' },
        files: [{ id: 102, relative_path: '待审核.pdf', size_display: '2 KB' }],
        publish_error: '',
        resource_url: null,
      },
    ]
    vi.mocked(api.get).mockImplementation(async ({ url }) => {
      if (url === '/api/management/session/') {
        return { status: 200, content: { ...baseSession, elevated: true } } as never
      }
      if (url === '/api/management/reports/') {
        return { status: 200, content: { results: [], page: 1, max_page: 1, count: 0 } } as never
      }
      return { status: 200, content: { results: uploads, page: 1, max_page: 1, count: 2 } } as never
    })
    await mountManage()

    findButton('文件审核').click()
    await flush()

    const resourceLink = container.querySelector(`a[href="${encodedResourceUrl}"]`) as HTMLAnchorElement
    expect(resourceLink.textContent).toBe('https://nwu.icu/disk/【1】中国特色课程(毛概马原)/马原')
    expect(resourceLink.target).toBe('_blank')
    expect(resourceLink.rel).toBe('noopener noreferrer')
    expect(container.querySelector('a[href="/api/management/uploads/files/101/download/"]')).toBeNull()
    expect(container.textContent).toContain('讲义.pdf · 1 KB')
    expect(container.querySelector('a[href="/api/management/uploads/files/102/download/"]')).not.toBeNull()
  })

  it('loads and saves the about page with the announcement rich text editor', async () => {
    let content = '<p>原介绍</p>'
    vi.mocked(api.get).mockImplementation(async ({ url }) => {
      if (url === '/api/management/session/') return { status: 200, content: { ...baseSession, elevated: true } } as never
      if (url === '/api/management/about/') return { status: 200, content: { about: { title: '关于本站', content, update_time: '2026-09-23T00:00:00Z' } } } as never
      return { status: 200, content: { results: [], page: 1, max_page: 1, count: 0 } } as never
    })
    vi.mocked(api.put).mockImplementation(async ({ query }: any) => {
      content = query.content
      return { status: 200, content: { about: { title: '关于本站', content, update_time: '2026-09-23T00:00:00Z' } } } as never
    })
    await mountManage('?tab=about')

    expect(findExactButton('关于本站')).not.toBeUndefined()
    const editor = container.querySelector('textarea[aria-label="公告正文"]') as HTMLTextAreaElement
    expect(editor.value).toBe('<p>原介绍</p>')
    editor.value = '<p>新介绍</p><a href="/announcements">公告</a>'
    editor.dispatchEvent(new Event('input', { bubbles: true }))
    findExactButton('保存内容').click()
    await flush()

    expect(api.put).toHaveBeenCalledWith({
      url: '/api/management/about/',
      query: { content: '<p>新介绍</p><a href="/announcements">公告</a>' },
    })
    expect(container.textContent).toContain('内容已保存。')
    expect(editor.value).toBe(content)
  })

  it('keeps the about editor unavailable when its content cannot be loaded', async () => {
    vi.mocked(api.get).mockImplementation(async ({ url }) => {
      if (url === '/api/management/session/') return { status: 200, content: { ...baseSession, elevated: true } } as never
      return { status: 500, errors: [] } as never
    })
    await mountManage('?tab=about')

    expect(container.textContent).toContain('关于本站加载失败。')
    expect(findExactButton('保存内容').disabled).toBe(true)
    expect(api.put).not.toHaveBeenCalled()
  })

  it('publishes announcements with the default priority and reloads the published list', async () => {
    vi.mocked(api.get).mockImplementation(async ({ url }) => {
      if (url === '/api/management/session/') return { status: 200, content: { ...baseSession, elevated: true } } as never
      return { status: 200, content: { results: [], page: 1, max_page: 1, count: 0 } } as never
    })
    vi.mocked(api.post).mockResolvedValue({ status: 201, content: { entry: announcementEntry, created: true } } as never)
    await mountManage('?tab=announcements')

    const title = container.querySelector('input[maxlength="100"]') as HTMLInputElement
    title.value = '新公告'
    title.dispatchEvent(new Event('input', { bubbles: true }))
    const content = container.querySelector('textarea[aria-label="公告正文"]') as HTMLTextAreaElement
    content.value = '<p>新正文</p>'
    content.dispatchEvent(new Event('input', { bubbles: true }))
    findButton('发布公告').click()
    await flush()

    expect(api.post).toHaveBeenCalledWith({
      url: '/api/management/announcements/',
      query: {
        title: '新公告', content: '<p>新正文</p>', priority: 0, submission_id: expect.any(String),
      },
    })
    expect(container.textContent).toContain('公告已发布。')
  })

  it('prefills an announcement and saves title, content, and bounded priority through PUT', async () => {
    vi.mocked(api.get).mockImplementation(async ({ url }) => {
      if (url === '/api/management/session/') return { status: 200, content: { ...baseSession, elevated: true } } as never
      return { status: 200, content: { results: [announcementEntry], page: 1, max_page: 1, count: 1 } } as never
    })
    vi.mocked(api.put).mockResolvedValue({
      status: 200,
      content: { entry: { ...announcementEntry, title: '更新公告', priority: 100, updated_at: '2026-09-22T00:00:00Z' } },
    } as never)
    await mountManage('?tab=announcements')

    findButton('编辑').click()
    await nextTick()
    const title = container.querySelector('input[maxlength="100"]') as HTMLInputElement
    const priority = container.querySelector('input[type="number"]') as HTMLInputElement
    expect(title.value).toBe('原公告')
    expect(priority.value).toBe('20')
    title.value = '更新公告'
    title.dispatchEvent(new Event('input', { bubbles: true }))
    priority.value = '100'
    priority.dispatchEvent(new Event('input', { bubbles: true }))
    findButton('保存修改').click()
    await flush()

    expect(api.put).toHaveBeenCalledWith({
      url: '/api/management/announcements/:id/',
      params: { id: 91 },
      query: { title: '更新公告', content: '<p>原正文</p>', priority: 100 },
    })
    expect(container.textContent).toContain('公告已更新。')
  })

  it('freezes editor switching while an announcement update is in flight', async () => {
    const update = deferred<any>()
    vi.mocked(api.get).mockImplementation(async ({ url }) => {
      if (url === '/api/management/session/') return { status: 200, content: { ...baseSession, elevated: true } } as never
      return { status: 200, content: { results: [announcementEntry], page: 1, max_page: 1, count: 1 } } as never
    })
    vi.mocked(api.put).mockReturnValue(update.promise as never)
    await mountManage('?tab=announcements')

    findExactButton('编辑').click()
    await nextTick()
    findExactButton('保存修改').click()
    await nextTick()

    expect(findExactButton('取消编辑').disabled).toBe(true)
    expect(findExactButton('编辑').disabled).toBe(true)
    expect(findExactButton('隐藏').disabled).toBe(true)

    update.resolve({ status: 200, content: { entry: { ...announcementEntry, updated_at: '2026-09-22T00:00:00Z' } } })
    await flush()
    expect(container.textContent).toContain('公告已更新。')
  })

  it('ignores an older announcement response after the visibility filter changes', async () => {
    const publishedRequest = deferred<any>()
    const hiddenRequest = deferred<any>()
    const hidden = { ...announcementEntry, id: 92, title: '隐藏的新公告', is_visible: false }
    vi.mocked(api.get).mockImplementation(({ url, query }: any) => {
      if (url === '/api/management/session/') {
        return Promise.resolve({ status: 200, content: { ...baseSession, elevated: true } }) as never
      }
      return (query?.visibility === 'hidden' ? hiddenRequest.promise : publishedRequest.promise) as never
    })
    await mountManage('?tab=announcements')

    const filter = container.querySelector('select') as HTMLSelectElement
    filter.value = 'hidden'
    filter.dispatchEvent(new Event('change', { bubbles: true }))
    hiddenRequest.resolve({ status: 200, content: { results: [hidden], page: 1, max_page: 1, count: 1 } })
    await flush()
    expect(container.textContent).toContain('隐藏的新公告')

    publishedRequest.resolve({ status: 200, content: { results: [announcementEntry], page: 1, max_page: 1, count: 1 } })
    await flush()
    expect(container.textContent).toContain('隐藏的新公告')
    expect(container.textContent).not.toContain('原公告')
  })

  it('toggles visibility and only offers deletion for hidden announcements', async () => {
    const hidden = { ...announcementEntry, is_visible: false }
    vi.mocked(api.get).mockImplementation(async ({ url, query }: any) => {
      if (url === '/api/management/session/') return { status: 200, content: { ...baseSession, elevated: true } } as never
      return {
        status: 200,
        content: { results: query?.visibility === 'hidden' ? [hidden] : [announcementEntry], page: 1, max_page: 1, count: 1 },
      } as never
    })
    vi.mocked(api.post).mockImplementation(async ({ query }: any) => ({
      status: 200,
      content: { entry: { ...announcementEntry, is_visible: query.visible } },
    }) as never)
    vi.mocked(api.delete).mockResolvedValue({ status: 200, content: { entry_id: hidden.id } } as never)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    await mountManage('?tab=announcements')

    expect(findButton('删除')).toBeUndefined()
    findButton('隐藏').click()
    await flush()
    expect(api.post).toHaveBeenCalledWith({
      url: '/api/management/announcements/:id/visibility/', params: { id: 91 }, query: { visible: false },
    })

    const filter = container.querySelector('select') as HTMLSelectElement
    filter.value = 'hidden'
    filter.dispatchEvent(new Event('change', { bubbles: true }))
    await flush()
    expect(findExactButton('发布')).not.toBeUndefined()
    findExactButton('发布').click()
    await flush()
    expect(api.post).toHaveBeenCalledWith({
      url: '/api/management/announcements/:id/visibility/', params: { id: 91 }, query: { visible: true },
    })
    findButton('删除').click()
    await flush()
    expect(window.confirm).toHaveBeenCalledWith('确定从公告管理中移除这条已隐藏的公告吗？移除后无法在管理界面恢复。')
    expect(api.delete).toHaveBeenCalledWith({ url: '/api/management/announcements/:id/', params: { id: 91 } })
  })
})
