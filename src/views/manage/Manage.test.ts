import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, type App } from 'vue'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'

import Manage from './Manage.vue'
import ResourceTools from '@/components/manage/ResourceTools.vue'
import ShadcnFeedbackProvider from '@/components/common/ShadcnFeedbackProvider.vue'
import { api } from '@/lib/requests'
import {
  browserSupportsWebAuthn,
  startAuthentication,
  startRegistration,
} from '@simplewebauthn/browser'

const messageSuccess = vi.fn()
const fileManagerSetup = vi.fn()

vi.mock('@/lib/requests', () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }))
vi.mock('@simplewebauthn/browser', () => ({
  browserSupportsWebAuthn: vi.fn(),
  startAuthentication: vi.fn(),
  startRegistration: vi.fn(),
}))
vi.mock('@/lib/useShadcnToast', () => ({ useShadcnToast: () => ({ success: messageSuccess }) }))
vi.mock('@/components/manage/ResourceFileManager.vue', () => ({
  default: {
    props: ['canReviewUploads'],
    emits: ['session-expired'],
    setup: (props: { canReviewUploads: boolean }, { emit }: { emit: (event: string) => void }) => {
      fileManagerSetup()
      return () => h('section', { 'aria-label': '资料文件管理' }, h(ResourceTools, {
        path: '/', canManageFiles: true, canReviewUploads: props.canReviewUploads,
        onSessionExpired: () => emit('session-expired'),
      }))
    },
  },
}))
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
  for (let index = 0; index < 30; index += 1) {
    await Promise.resolve()
    await nextTick()
  }
}

let app: App | undefined
let container: HTMLDivElement
const originalScroll = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollIntoView')
const waitOptions = { timeout: 2_000, interval: 10 }

const mountManage = async (location = '', previousLocation?: string) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{
      path: '/manage/:section(uploads|announcements|files|notifications|reports|about)?',
      name: 'manage', component: Manage, meta: { isManagement: true },
    }],
  })
  if (previousLocation) await router.push(`/manage${previousLocation}`)
  await router.push(`/manage${location}`)
  app = createApp({ render: () => h(ShadcnFeedbackProvider, null, { default: () => h(RouterView) }) }).use(router)
  app.mount(container)
  await flush()
  return router
}

const findButton = (text: string) => [...container.querySelectorAll('button')]
  .find(button => button.textContent?.includes(text)) as HTMLButtonElement
const findExactButton = (text: string) => [...container.querySelectorAll('button')]
  .find(button => button.textContent?.trim() === text) as HTMLButtonElement
const filter = (label: string) => container.querySelector<HTMLElement>(`[role="combobox"][aria-label="${label}"]`)!
const selectFilter = async (label: string, optionLabel: string) => {
  const trigger = filter(label)
  trigger.focus()
  trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }))
  let option: HTMLElement | undefined
  await vi.waitFor(() => {
    option = [...document.body.querySelectorAll<HTMLElement>('[data-shadcn-select-menu] [role="option"]')]
      .find(candidate => candidate.textContent?.trim() === optionLabel)
    expect(option).toBeDefined()
  }, waitOptions)
  if (!option) throw new Error(`Missing option: ${label} / ${optionLabel}`)
  option.focus()
  option.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
  await vi.waitFor(() => {
    expect(document.body.querySelector('[data-shadcn-select-menu]')).toBeNull()
    expect(document.activeElement).toBe(trigger)
  }, waitOptions)
  await flush()
}
const confirmation = (title: string) => document.body.querySelector<HTMLElement>(`[role="dialog"][aria-label="${title}"]`)
const confirmAction = async (title: string, buttonLabel: string) => {
  await vi.waitFor(() => expect(confirmation(title)).not.toBeNull(), waitOptions)
  const button = [...confirmation(title)!.querySelectorAll<HTMLButtonElement>('button')]
    .find(candidate => candidate.textContent?.trim() === buttonLabel)!
  button.click()
  await vi.waitFor(() => expect(confirmation(title)).toBeNull(), waitOptions)
  await flush()
}

const deferred = <T>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((promiseResolve) => { resolve = promiseResolve })
  return { promise, resolve }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
  Element.prototype.scrollIntoView = vi.fn()
  container = document.createElement('div')
  document.body.append(container)
  vi.mocked(api.get).mockReset().mockResolvedValue({ status: 200, content: baseSession } as never)
  vi.mocked(api.post).mockReset()
  vi.mocked(api.put).mockReset()
  vi.mocked(api.delete).mockReset()
  vi.mocked(browserSupportsWebAuthn).mockReturnValue(true)
})

describe('management list request ordering', () => {
  const reports = (status: string) => ({ status: 200, content: { page: 1, max_page: 1, results: [{
    id: 1, status, reason: 'spam', created_at: '', entry: { board: 'guestbook', content: `${status}举报`, author: {} }, reporter: {},
  }] } })
  const uploads = (status: string) => ({ status: 200, content: { page: 1, max_page: 1, results: [{
    id: 1, status, uploaded_by: { nickname: `${status}投稿` }, files: [], target_path: '/课程', resource_url: '',
  }] } })
  const statusLabels: Record<string, string> = {
    pending: '待处理', dismissed: '已驳回', removed: '已移除', rejected: '已拒绝', approved: '已通过',
  }
  const selectStatus = async (status: string) => {
    const label = filter('举报状态') ? '举报状态' : '审核状态'
    await selectFilter(label, statusLabels[status])
  }
  for (const [tab, response, first, second] of [
    ['reports', reports, 'dismissed', 'removed'], ['uploads', uploads, 'rejected', 'approved'],
  ] as const) {
    it(`keeps ${tab} results for the latest filter and ignores stale errors`, async () => {
      vi.mocked(api.get).mockImplementation(async ({ url }) => (url === '/api/management/session/'
        ? { status: 200, content: { ...baseSession, elevated: true } } : response('pending')) as never)
      await mountManage(`?tab=${tab}`)
      const old = deferred<ReturnType<typeof response>>()
      const latest = deferred<ReturnType<typeof response>>()
      vi.mocked(api.get).mockReturnValueOnce(old.promise as never).mockReturnValueOnce(latest.promise as never)
      await selectStatus(first); await selectStatus(second)
      old.resolve(response(first)); await flush()
      expect(container.textContent).toContain('加载中…')
      latest.resolve(response(second)); await flush()
      expect(container.textContent).toContain(`${second}${tab === 'reports' ? '举报' : '投稿'}`)
      expect(container.textContent).not.toContain(`${first}${tab === 'reports' ? '举报' : '投稿'}`)
      let rejectOld!: (error: Error) => void
      vi.mocked(api.get).mockReturnValueOnce(new Promise((_resolve, reject) => { rejectOld = reject }) as never)
        .mockResolvedValueOnce(response(second) as never)
      await selectStatus(first); await selectStatus(second)
      rejectOld(new Error('stale failure')); await flush()
      expect(container.textContent).not.toContain('stale failure')
      expect(filter(tab === 'reports' ? '举报状态' : '审核状态').textContent).toContain(statusLabels[second])
    })
  }

  it('ignores a report response after switching to uploads', async () => {
    vi.mocked(api.get).mockImplementation(async ({ url }) => (url === '/api/management/session/'
      ? { status: 200, content: { ...baseSession, elevated: true } } : reports('pending')) as never)
    await mountManage('?tab=reports')
    const old = deferred<ReturnType<typeof reports>>()
    const latest = deferred<ReturnType<typeof uploads>>()
    vi.mocked(api.get).mockReturnValueOnce(old.promise as never).mockReturnValueOnce(latest.promise as never)
    await selectStatus('dismissed')
    findButton('文件审核').click(); await flush()
    old.resolve(reports('dismissed')); await flush()
    expect(container.textContent).toContain('加载中…')
    latest.resolve(uploads('approved')); await flush()
    expect(container.textContent).toContain('approved投稿')
  })

  it('preserves report filters through shared pagination and resets the page when a filter changes', async () => {
    vi.mocked(api.get).mockImplementation(async ({ url, query }) => {
      if (url === '/api/management/session/') return { status: 200, content: { ...baseSession, elevated: true } } as never
      const filters = query as { status?: string; page?: number } | undefined
      const result = reports(filters?.status ?? 'pending')
      return { ...result, content: { ...result.content, page: filters?.page ?? 1, max_page: 3 } } as never
    })
    await mountManage('?tab=reports')
    await selectFilter('举报来源', '公告回复')
    await selectFilter('举报状态', '已移除')
    container.querySelector<HTMLButtonElement>('button[aria-label="下一页"]')!.click()
    await flush()
    expect(api.get).toHaveBeenLastCalledWith({
      url: '/api/management/reports/', query: { status: 'removed', board: 'announcement', page: 2, pageSize: 10 },
    })
    expect(container.querySelector('[aria-current="page"]')?.getAttribute('aria-label')).toBe('第 2 页')
    await selectFilter('举报状态', '待处理')
    expect(api.get).toHaveBeenLastCalledWith({
      url: '/api/management/reports/', query: { status: 'pending', board: 'announcement', page: 1, pageSize: 10 },
    })
    expect(container.querySelector('[aria-current="page"]')?.getAttribute('aria-label')).toBe('第 1 页')
    expect(filter('举报来源').textContent).toContain('公告回复')
  })
})

afterEach(() => {
  app?.unmount()
  app = undefined
  container.remove()
  if (originalScroll) Object.defineProperty(Element.prototype, 'scrollIntoView', originalScroll)
  else Reflect.deleteProperty(Element.prototype, 'scrollIntoView')
  vi.unstubAllGlobals()
})

describe('management navigation and pending indicators', () => {
  const emptyList = { status: 200, content: { count: 0, results: [], page: 1, max_page: 1 } }
  const dot = (kind: 'reports' | 'uploads') => container.querySelector<HTMLElement>(`[data-pending-dot="${kind}"]`)
  const pendingRequests = () => vi.mocked(api.get).mock.calls.map(([request]) => request)
    .filter(request => (request.query as { pageSize?: number } | undefined)?.pageSize === 1)

  it('orders the permitted menus, defaults to file review and keeps pending dots independent of list filters', async () => {
    vi.mocked(api.get).mockImplementation(async ({ url, query }) => {
      if (url === '/api/management/session/') return { status: 200, content: {
        ...baseSession, elevated: true, permissions: { ...baseSession.permissions, manage_resource_files: true },
      } } as never
      if ((query as { pageSize?: number } | undefined)?.pageSize === 1) {
        return { ...emptyList, content: { ...emptyList.content, count: url === '/api/management/reports/' ? 3 : 2 } } as never
      }
      return emptyList as never
    })
    await mountManage()
    const navigation = container.querySelector('nav[aria-label="管理功能"]')!
    expect([...navigation.querySelectorAll('button')].map(button => button.textContent?.trim())).toEqual([
      '文件审核', '公告管理', '资料管理', 'Telegram 通知', '举报处理', '关于本站',
    ])
    expect(findExactButton('文件审核').getAttribute('aria-pressed')).toBe('true')
    expect(dot('reports')?.getAttribute('aria-label')).toBe('有待处理举报')
    expect(dot('reports')?.closest('button')).toBe(findExactButton('举报处理'))
    expect(dot('uploads')?.getAttribute('aria-label')).toBe('有待审核文件')
    expect(dot('uploads')?.closest('button')).toBe(findExactButton('文件审核'))
    expect(pendingRequests()).toEqual(expect.arrayContaining([
      { url: '/api/management/reports/', query: { status: 'pending', page: 1, pageSize: 1 } },
      { url: '/api/management/uploads/', query: { status: 'pending', page: 1, pageSize: 1 } },
    ]))
    expect(pendingRequests()).toHaveLength(2)

    await selectFilter('审核状态', '已通过')
    expect(dot('uploads')).not.toBeNull()
    findExactButton('举报处理').click()
    await flush()
    await selectFilter('举报状态', '已驳回')
    expect(dot('reports')).not.toBeNull()
    expect(pendingRequests()).toHaveLength(2)
  })

  it.each([
    { label: 'before Passkey verification', elevated: false, reports: true, uploads: true, expected: [] },
    { label: 'without either moderation permission', elevated: true, reports: false, uploads: false, expected: [] },
    { label: 'with only report permission', elevated: true, reports: true, uploads: false, expected: ['/api/management/reports/'] },
    { label: 'with only upload permission', elevated: true, reports: false, uploads: true, expected: ['/api/management/uploads/'] },
  ])('requests pending indicators only when authorized $label', async ({ elevated, reports, uploads, expected }) => {
    vi.mocked(api.get).mockImplementation(async ({ url }) => {
      if (url === '/api/management/session/') return { status: 200, content: {
        ...baseSession, elevated, permissions: {
          moderate_reports: reports, review_resource_uploads: uploads, publish_announcements: false,
          manage_resource_files: false, manage_telegram_notifications: false,
        },
      } } as never
      return { ...emptyList, content: { ...emptyList.content, count: 1 } } as never
    })
    await mountManage()
    expect(pendingRequests().map(request => request.url).sort()).toEqual(expected)
    expect(Boolean(dot('reports'))).toBe(elevated && reports)
    expect(Boolean(dot('uploads'))).toBe(elevated && uploads)
    if (elevated && (reports || uploads)) {
      expect(findExactButton(uploads ? '文件审核' : '举报处理').getAttribute('aria-pressed')).toBe('true')
    }
  })

  it('falls back to the first permitted menu in the new order', async () => {
    vi.mocked(api.get).mockImplementation(async ({ url }) => (url === '/api/management/session/'
      ? { status: 200, content: { ...baseSession, elevated: true, permissions: {
        ...baseSession.permissions, review_resource_uploads: false,
      } } } : emptyList) as never)
    await mountManage('?tab=uploads')
    expect(findExactButton('文件审核')).toBeUndefined()
    expect(findExactButton('公告管理').getAttribute('aria-pressed')).toBe('true')
    expect(findExactButton('举报处理').getAttribute('aria-pressed')).toBe('false')
    expect(filter('公告状态')).not.toBeNull()
  })

  it('refreshes each pending dot after completing the last item without clearing the other dot', async () => {
    let pendingReports = 1
    let pendingUploads = 1
    const report = { id: 1, status: 'pending', reason: 'spam', created_at: '',
      entry: { board: 'guestbook', content: '待处理举报内容', author: {} }, reporter: {} }
    const upload = { id: 42, revision: 1, status: 'pending', target_path: '/courses', total_size_display: '1 KB',
      uploaded_by: { nickname: '投稿人', username: 'student' }, files: [], publish_error: '' }
    vi.mocked(api.get).mockImplementation(async ({ url, query }) => {
      if (url === '/api/management/session/') return { status: 200, content: { ...baseSession, elevated: true } } as never
      const isReport = url === '/api/management/reports/'
      const count = isReport ? pendingReports : pendingUploads
      const isIndicator = (query as { pageSize?: number } | undefined)?.pageSize === 1
      return { ...emptyList, content: { ...emptyList.content, count, results: isIndicator || !count ? [] : [isReport ? report : upload] } } as never
    })
    vi.mocked(api.post).mockImplementation(async ({ url }) => {
      if (url === '/api/management/uploads/:id/') {
        pendingUploads = 0
        return { status: 200, content: { upload_request: { ...upload, status: 'approved' } } } as never
      }
      pendingReports = 0
      return { status: 200, content: {} } as never
    })
    await mountManage()
    expect(dot('reports')).not.toBeNull()
    expect(dot('uploads')).not.toBeNull()
    findExactButton('通过并发布').click()
    await flush()
    expect(dot('uploads')).toBeNull()
    expect(dot('reports')).not.toBeNull()

    findExactButton('举报处理').click()
    await flush()
    const note = container.querySelector<HTMLInputElement>('input[aria-label="举报 1 的处理说明"]')!
    note.value = '经核查不属于违规内容'
    note.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
    findExactButton('驳回举报').click()
    await flush()
    expect(api.post).toHaveBeenCalledWith({ url: '/api/management/reports/:id/resolve/', params: { id: 1 },
      query: { decision: 'dismiss', note: '经核查不属于违规内容' } })
    expect(dot('reports')).toBeNull()
    expect(dot('uploads')).toBeNull()
    expect(pendingRequests().filter(request => request.url === '/api/management/reports/')).toHaveLength(2)
    expect(pendingRequests().filter(request => request.url === '/api/management/uploads/')).toHaveLength(2)
  })
})

describe('management section routes', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockImplementation(async ({ url }) => {
      if (url === '/api/management/session/') return { status: 200, content: {
        ...baseSession, elevated: true, permissions: { ...baseSession.permissions, manage_resource_files: true },
      } } as never
      if (url === '/api/management/about/') return { status: 200, content: {
        about: { title: '关于本站', content: '<p>本站介绍</p>', update_time: '2026-10-08T00:00:00Z' },
      } } as never
      if (url === '/api/management/notifications/telegram/') return { status: 200, content: {
        user_registration_enabled: true, guestbook_entry_enabled: false, course_review_enabled: true, reply_enabled: false,
      } } as never
      return { status: 200, content: { count: 0, results: [], page: 1, max_page: 1 } } as never
    })
  })

  const assertSection = (section: string, label: string) => {
    expect(findExactButton(label).getAttribute('aria-pressed')).toBe('true')
    expect(container.querySelectorAll('nav[aria-label="管理功能"] button[aria-pressed="true"]')).toHaveLength(1)
    if (section === 'uploads') expect(filter('审核状态')).not.toBeNull()
    if (section === 'announcements') expect(filter('公告状态')).not.toBeNull()
    if (section === 'files') expect(container.querySelector('[aria-label="资料维护工具"]')).not.toBeNull()
    if (section === 'notifications') expect(container.querySelectorAll('[role="switch"]')).toHaveLength(4)
    if (section === 'reports') expect(filter('举报状态')).not.toBeNull()
    if (section === 'about') expect(container.querySelector<HTMLTextAreaElement>('textarea[aria-label="公告正文"]')?.value).toBe('<p>本站介绍</p>')
  }

  it.each([
    ['uploads', '文件审核'], ['announcements', '公告管理'], ['files', '资料管理'],
    ['notifications', 'Telegram 通知'], ['reports', '举报处理'], ['about', '关于本站'],
  ])('opens the %s section from a direct link', async (section, label) => {
    const router = await mountManage(`/${section}`)
    expect(router.currentRoute.value.path).toBe(`/manage/${section}`)
    expect(router.currentRoute.value.params.section).toBe(section)
    expect(router.currentRoute.value.meta.isManagement).toBe(true)
    assertSection(section, label)
  })

  it('adds menu navigation to history and restores sections on back, forward and refresh', async () => {
    const router = await mountManage('/reports?next=%2Fadmin%2F&context=mail')
    findExactButton('公告管理').click()
    await vi.waitFor(() => {
      expect(router.currentRoute.value.path).toBe('/manage/announcements')
      assertSection('announcements', '公告管理')
    }, waitOptions)
    findExactButton('资料管理').click()
    await vi.waitFor(() => {
      expect(router.currentRoute.value.path).toBe('/manage/files')
      assertSection('files', '资料管理')
    }, waitOptions)
    expect(router.currentRoute.value.query).toEqual({ next: '/admin/', context: 'mail' })
    router.back()
    await vi.waitFor(() => {
      expect(router.currentRoute.value.path).toBe('/manage/announcements')
      assertSection('announcements', '公告管理')
    }, waitOptions)
    router.back()
    await vi.waitFor(() => {
      expect(router.currentRoute.value.path).toBe('/manage/reports')
      assertSection('reports', '举报处理')
    }, waitOptions)
    router.forward()
    await vi.waitFor(() => {
      expect(router.currentRoute.value.path).toBe('/manage/announcements')
      assertSection('announcements', '公告管理')
    }, waitOptions)
    expect(vi.mocked(api.get).mock.calls.filter(([request]) => request.url === '/api/management/session/')).toHaveLength(1)

    const location = router.currentRoute.value.fullPath.slice('/manage'.length)
    app!.unmount()
    app = undefined
    const refreshedRouter = await mountManage(location)
    expect(refreshedRouter.currentRoute.value.path).toBe('/manage/announcements')
    assertSection('announcements', '公告管理')
  })

  it.each([
    ['', 'uploads', '文件审核'],
    ['?tab=reports&next=%2Fadmin%2F&context=mail', 'reports', '举报处理'],
    ['/files?tab=reports&next=%2Fadmin%2F&context=mail', 'files', '资料管理'],
  ])('normalizes %s with replace, retains other queries and removes legacy tab', async (location, section, label) => {
    const router = await mountManage(location, '/notifications')
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe(`/manage/${section}`), waitOptions)
    expect(router.currentRoute.value.query.tab).toBeUndefined()
    if (location) expect(router.currentRoute.value.query).toEqual({ next: '/admin/', context: 'mail' })
    assertSection(section, label)
    findExactButton('关于本站').click()
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/manage/about'), waitOptions)
    router.back()
    await vi.waitFor(() => {
      expect(router.currentRoute.value.path).toBe(`/manage/${section}`)
      expect(router.currentRoute.value.query.tab).toBeUndefined()
      assertSection(section, label)
    }, waitOptions)
    router.back()
    await vi.waitFor(() => {
      expect(router.currentRoute.value.path).toBe('/manage/notifications')
      assertSection('notifications', 'Telegram 通知')
    }, waitOptions)
  })

  it.each(['/files?next=%2Fadmin%2F&context=mail', '?tab=files&next=%2Fadmin%2F&context=mail'])('replaces unauthorized %s with the first permitted section', async location => {
    vi.mocked(api.get).mockImplementation(async ({ url }) => (url === '/api/management/session/'
      ? { status: 200, content: { ...baseSession, elevated: true, permissions: {
        ...baseSession.permissions, review_resource_uploads: false, manage_resource_files: false,
      } } } : { status: 200, content: { count: 0, results: [], page: 1, max_page: 1 } }) as never)
    const router = await mountManage(location)
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/manage/announcements'), waitOptions)
    expect(router.currentRoute.value.query).toEqual({ next: '/admin/', context: 'mail' })
    assertSection('announcements', '公告管理')
    expect(findExactButton('资料管理')).toBeUndefined()
    expect(fileManagerSetup).not.toHaveBeenCalled()
    expect(vi.mocked(api.get).mock.calls.some(([request]) => request.url.startsWith('/api/management/resources/'))).toBe(false)
  })

  it('defers section requests until Passkey verification and then loads the current route', async () => {
    let elevated = false
    vi.mocked(api.get).mockImplementation(async ({ url }) => {
      if (url === '/api/management/session/') return { status: 200, content: { ...baseSession, elevated } } as never
      return { status: 200, content: { count: 0, results: [], page: 1, max_page: 1 } } as never
    })
    const router = await mountManage('/uploads?context=mail')
    await router.push('/manage/reports?context=mail')
    await flush()
    expect(container.textContent).toContain('使用 Passkey 继续')
    expect(vi.mocked(api.get).mock.calls.map(([request]) => request.url)).toEqual(['/api/management/session/'])
    vi.mocked(startAuthentication).mockResolvedValueOnce({ id: 'credential' } as never)
    vi.mocked(api.post).mockImplementation(async ({ url }) => {
      if (url === '/api/management/passkeys/authentication/verify/') elevated = true
      return { status: 200, content: {} } as never
    })
    findExactButton('验证 Passkey').click()
    await flush()
    expect(router.currentRoute.value.path).toBe('/manage/reports')
    assertSection('reports', '举报处理')
    expect(api.get).toHaveBeenCalledWith({
      url: '/api/management/reports/', query: { status: 'pending', board: undefined, page: 1, pageSize: 10 },
    })
    expect(router.currentRoute.value.query).toEqual({ context: 'mail' })
  })
})

describe('resource blacklist navigation and permissions', () => {
  const tools = () => container.querySelector<HTMLElement>('[aria-label="资料维护工具"]')
  const blacklistTab = () => [...container.querySelectorAll<HTMLButtonElement>('nav[aria-label="资料维护"] button')]
    .find(button => button.textContent?.trim() === '投稿文件夹黑名单')
  const blacklistButton = (label: string) => container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)
  const blacklistRequests = () => vi.mocked(api.get).mock.calls.map(([request]) => request)
    .filter(request => request.url === '/api/management/uploads/blacklist/' || request.url === '/api/management/uploads/directories/')
  const fileRequests = () => vi.mocked(api.get).mock.calls.map(([request]) => request)
    .filter(request => request.url.startsWith('/api/management/resources/'))
  const mockResourceSession = (files: boolean, uploads: boolean) => {
    vi.mocked(api.get).mockImplementation(async ({ url }) => {
      if (url === '/api/management/session/') return { status: 200, content: {
        ...baseSession, elevated: true, permissions: {
          moderate_reports: false, publish_announcements: false, manage_telegram_notifications: false,
          manage_resource_files: files, review_resource_uploads: uploads,
        },
      } } as never
      if (url === '/api/management/uploads/blacklist/') return { status: 200, content: { paths: [] } } as never
      if (url === '/api/management/uploads/directories/') return { status: 200, content: {
        path: '/', updated_at: null, directories: [{ name: 'courses', path: '/courses' }],
      } } as never
      return { status: 200, content: { count: 0, results: [], page: 1, max_page: 1 } } as never
    })
  }

  it('offers the blacklist in resource tools and loads it only when selected', async () => {
    mockResourceSession(true, true)
    const router = await mountManage()
    expect(findExactButton('文件审核').getAttribute('aria-pressed')).toBe('true')
    expect(tools()).toBeNull()
    expect(container.textContent).not.toContain('投稿文件夹黑名单')
    expect(blacklistRequests()).toHaveLength(0)

    findExactButton('资料管理').click()
    await flush()
    expect(container.querySelector('[aria-label="资料文件管理"]')?.contains(tools())).toBe(true)
    expect(blacklistTab()!.getAttribute('aria-pressed')).toBe('false')
    expect(container.querySelectorAll('nav[aria-label="资料维护"] button[aria-pressed="true"]')).toHaveLength(0)
    expect(container.querySelector('[aria-label="禁止投稿的文件夹"]')).toBeNull()
    expect(blacklistRequests()).toHaveLength(0)

    blacklistTab()!.click()
    await flush()
    expect(router.currentRoute.value.query.tool).toBe('blacklist')
    expect(blacklistTab()!.getAttribute('aria-pressed')).toBe('true')
    expect(container.querySelector('[aria-label="禁止投稿的文件夹"]')).not.toBeNull()
    expect(blacklistRequests()).toEqual(expect.arrayContaining([
      { url: '/api/management/uploads/blacklist/' },
      { url: '/api/management/uploads/directories/', query: { path: '/' } },
    ]))
    expect(blacklistRequests()).toHaveLength(2)

    container.querySelector<HTMLButtonElement>('button[aria-label="关闭资料维护"]')!.click()
    await flush()
    expect(router.currentRoute.value.query.tool).toBeUndefined()
    expect(blacklistTab()!.getAttribute('aria-pressed')).toBe('false')
    expect(container.querySelector('[aria-label="禁止投稿的文件夹"]')).toBeNull()
    expect(blacklistRequests()).toHaveLength(2)
    findExactButton('文件审核').click()
    await flush()
    expect(tools()).toBeNull()
  })

  it('lets upload reviewers configure the blacklist without mounting file management', async () => {
    mockResourceSession(false, true)
    const router = await mountManage('/files')
    expect(router.currentRoute.value.path).toBe('/manage/files')
    expect(findExactButton('资料管理').getAttribute('aria-pressed')).toBe('true')
    expect([...container.querySelectorAll('nav[aria-label="资料维护"] button')].map(button => button.textContent?.trim())).toEqual(['投稿文件夹黑名单'])
    expect(findExactButton('添加目录说明')).toBeUndefined()
    expect(fileManagerSetup).not.toHaveBeenCalled()
    expect(container.querySelector('[aria-label="资料文件管理"]')).toBeNull()
    expect(fileRequests()).toHaveLength(0)
    expect(blacklistRequests()).toHaveLength(0)

    blacklistTab()!.click()
    await flush()
    vi.mocked(api.post).mockResolvedValueOnce({ status: 200, content: { paths: ['/courses'] } } as never)
    blacklistButton('拉黑 /courses')!.click()
    await flush()
    expect(api.post).toHaveBeenLastCalledWith({
      url: '/api/management/uploads/blacklist/', query: { path: '/courses', action: 'add' },
    })
    expect(blacklistButton('解除黑名单 /courses')).not.toBeNull()
    expect(blacklistButton('拉黑 /courses')).toBeNull()

    vi.mocked(api.post).mockResolvedValueOnce({ status: 200, content: { paths: [] } } as never)
    blacklistButton('解除黑名单 /courses')!.click()
    await flush()
    expect(api.post).toHaveBeenLastCalledWith({
      url: '/api/management/uploads/blacklist/', query: { path: '/courses', action: 'remove' },
    })
    expect(blacklistButton('拉黑 /courses')).not.toBeNull()
    expect(fileManagerSetup).not.toHaveBeenCalled()
    expect(fileRequests()).toHaveLength(0)
  })

  it('keeps blacklist settings unavailable to file managers without upload review permission', async () => {
    mockResourceSession(true, false)
    await mountManage('/files?tool=blacklist')
    expect(findExactButton('资料管理').getAttribute('aria-pressed')).toBe('true')
    expect(findExactButton('文件审核')).toBeUndefined()
    expect(fileManagerSetup).toHaveBeenCalledOnce()
    expect(container.querySelector('[aria-label="资料文件管理"]')).not.toBeNull()
    expect(tools()).not.toBeNull()
    expect(blacklistTab()).toBeUndefined()
    expect(container.querySelector('[aria-label="禁止投稿的文件夹"]')).toBeNull()
    expect(container.textContent).not.toContain('投稿文件夹黑名单')
    expect(blacklistRequests()).toHaveLength(0)
    expect(api.post).not.toHaveBeenCalled()
  })

  it.each([false, true])('reloads the session when blacklist authorization expires with file management %s', async files => {
    mockResourceSession(files, true)
    await mountManage('/files')
    blacklistTab()!.click()
    await flush()
    const initialSessionRequests = vi.mocked(api.get).mock.calls.filter(([request]) => request.url === '/api/management/session/')
    expect(initialSessionRequests).toHaveLength(1)
    vi.mocked(api.get).mockImplementation(async ({ url }) => {
      if (url !== '/api/management/session/') throw new Error(`Unexpected request after expiration: ${url}`)
      return { status: 200, content: baseSession } as never
    })
    vi.mocked(api.post).mockResolvedValueOnce({
      status: 403, errors: [{ err_msg: '请重新验证管理权限' }],
    } as never)
    blacklistButton('拉黑 /courses')!.click()
    await flush()
    expect(vi.mocked(api.get).mock.calls.filter(([request]) => request.url === '/api/management/session/')).toHaveLength(2)
    expect(container.textContent).toContain('使用 Passkey 继续')
    expect(findExactButton('验证 Passkey')).toBeDefined()
    expect(tools()).toBeNull()
    expect(container.querySelector('[aria-label="资料文件管理"]')).toBeNull()
  })
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
    vi.mocked(api.get).mockImplementation(async ({ url }) => (url === '/api/management/session/'
      ? { status: 200, content: { ...baseSession, elevated: true } }
      : { status: 200, content: { results: [], page: 1, max_page: 1, count: 0 } }) as never)
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
    const switches = container.querySelectorAll<HTMLButtonElement>('[role="switch"]')
    expect(switches).toHaveLength(4)
    expect([...switches].map(item => item.getAttribute('aria-label'))).toEqual(['用户注册', '发表留言', '发表课程评价', '发表回复'])
    expect([...switches].map(item => item.getAttribute('aria-checked'))).toEqual(['true', 'true', 'false', 'true'])
    switches[0].click()
    await flush()
    expect([...switches].map(item => item.getAttribute('aria-checked'))).toEqual(['false', 'true', 'false', 'true'])
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

    await selectFilter('公告状态', '已隐藏')
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
    await mountManage('?tab=announcements')

    expect(findButton('删除')).toBeUndefined()
    findButton('隐藏').click()
    await flush()
    expect(api.post).toHaveBeenCalledWith({
      url: '/api/management/announcements/:id/visibility/', params: { id: 91 }, query: { visible: false },
    })

    await selectFilter('公告状态', '已隐藏')
    expect(findExactButton('发布')).not.toBeUndefined()
    findExactButton('发布').click()
    await flush()
    expect(api.post).toHaveBeenCalledWith({
      url: '/api/management/announcements/:id/visibility/', params: { id: 91 }, query: { visible: true },
    })
    findButton('删除').click()
    await flush()
    expect(confirmation('删除公告')?.textContent).toContain('确定从公告管理中移除这条已隐藏的公告吗？移除后无法在管理界面恢复。')
    expect(api.delete).not.toHaveBeenCalled()
    await confirmAction('删除公告', '取消')
    expect(api.delete).not.toHaveBeenCalled()
    expect(container.textContent).toContain('原公告')
    findButton('删除').click()
    await confirmAction('删除公告', '删除公告')
    expect(api.delete).toHaveBeenCalledWith({ url: '/api/management/announcements/:id/', params: { id: 91 } })
  })
})
