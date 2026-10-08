import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, ref, type App } from 'vue'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import ResourceTools from './ResourceTools.vue'
import { api } from '@/lib/requests'

vi.mock('@/lib/requests', () => ({ api: { get: vi.fn(), post: vi.fn() } }))
let app: App, host: HTMLDivElement
let router: Router | undefined
const originalScroll = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollIntoView')
const currentPath = ref('/')
const active = ref(true)
const expired = vi.fn()
const flush = async () => { for (let i = 0; i < 20; i++) { await Promise.resolve(); await nextTick() } }
const settle = async () => { await flush(); await vi.advanceTimersByTimeAsync(50); await flush() }
async function chooseOption(label: string, optionLabel: string) {
  const trigger = host.querySelector<HTMLElement>(`[role="combobox"][aria-label="${label}"]`)!
  trigger.focus(); trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })); await settle()
  const option = [...document.body.querySelectorAll<HTMLElement>('[role="option"]')].find(item => item.textContent?.trim() === optionLabel)!
  expect(option).toBeTruthy()
  option.focus(); option.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })); await settle()
}
async function click(label: string) { const button = [...host.querySelectorAll('button')].find(item => item.textContent?.trim() === label); expect(button).toBeTruthy(); button!.click(); await flush() }
async function mount(options: { canManageFiles?: boolean; canReviewUploads?: boolean; active?: boolean } = {}, location?: string) {
  active.value = options.active ?? true
  app = createApp({ render: () => h(ResourceTools, { path: currentPath.value, onSessionExpired: expired, ...options, active: active.value }) })
  if (location) {
    router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/manage/files', component: { render: () => null } }] })
    await router.push(location); await router.isReady(); app.use(router)
  }
  app.mount(host); await flush()
}
beforeEach(() => {
  vi.resetAllMocks(); currentPath.value = '/'; active.value = true; router = undefined
  vi.useFakeTimers()
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
  Element.prototype.scrollIntoView = vi.fn()
  host = document.createElement('div'); document.body.append(host)
  vi.mocked(api.get).mockImplementation(async ({ url, query }) => {
    const path = (query as unknown as { path: string } | undefined)?.path || '/'
    if (url.endsWith('/access/')) return { status: 200, content: { path, mode: 'public', effective: 'public', rules: [] } } as never
    if (url === '/api/management/resources/') return { status: 200, content: { path, entries: [] } } as never
    if (url.endsWith('/index/')) return { status: 200, content: { updated_at: '2026-09-07T00:00:00Z', summary: { file_count: 8, directory_count: 2, total_file_size: 1000 } } } as never
    if (url.endsWith('/audit/')) return { status: 200, content: { count: 1, page: 1, results: [{ id: 1, action: 'move', actor: '管理员', path: '/旧.pdf', destination: '/新/旧.pdf', created_at: '2026-09-07T00:00:00Z', detail: {} }] } } as never
    if (url === '/api/management/uploads/blacklist/') return { status: 200, content: { paths: ['/private'] } } as never
    if (url === '/api/management/uploads/directories/') return { status: 200, content: { path, directories: [{ name: 'public', path: '/public' }] } } as never
    return { status: 200, content: { days: 7, total: 3, guest: 2, authenticated: 1,
      unique_ips: 1, unique_users: 1, unique_uas: 1, unknown_ip: 0, unknown_ua: 0, unknown_user: 0,
      ips: [{ ip_address: '203.0.113.7', count: 3 }], users: [{ user_id: 42, username: '学生', count: 1 }], uas: [{ user_agent: 'ExampleBrowser/1', count: 3 }],
      events: { count: 51, page: 1, page_size: 50, results: [{ id: 1, path: '/资料.pdf', created_at: '2026-09-07T00:00:00Z', authenticated: true, user_id: 42, username: '学生', ip_address: '203.0.113.7', user_agent: 'ExampleBrowser/1' }] },
      daily: [{ date: '2026-09-07', count: 3 }], files: [{ path: '/资料.pdf', count: 3 }] } } as never
  })
})
afterEach(() => {
  app?.unmount(); host.remove()
  if (originalScroll) Object.defineProperty(Element.prototype, 'scrollIntoView', originalScroll)
  else Reflect.deleteProperty(Element.prototype, 'scrollIntoView')
  vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals()
})
describe('resource maintenance tools', () => {
  it('starts without a maintenance panel or README editor', async () => {
    await mount()
    expect(api.get).not.toHaveBeenCalled()
    expect(host.querySelector('fieldset')).toBeNull()
    expect(document.body.querySelector('[aria-label="目录说明 Markdown"]')).toBeNull()
    expect(host.textContent).not.toContain('添加目录说明')
  })
  it('keeps README creation and editing outside the maintenance menu', async () => {
    await mount()
    expect(host.querySelector('[aria-label="资料维护"]')?.textContent).not.toContain('目录说明')
    expect(host.textContent).not.toContain('添加目录说明')
    expect(document.body.querySelector('[aria-label="目录说明预览"]')).toBeNull()
  })
  it('shows only authorized tools for a review-only administrator', async () => {
    await mount({ canManageFiles: false, canReviewUploads: true })
    expect(host.textContent).toContain('投稿文件夹黑名单')
    expect(host.textContent).not.toContain('访问权限')
    expect(host.textContent).not.toContain('添加目录说明')
    expect(api.get).not.toHaveBeenCalled()
    await click('投稿文件夹黑名单')
    expect(api.get).toHaveBeenCalledWith({ url: '/api/management/uploads/blacklist/' })
    expect(host.querySelector('[aria-label="禁止投稿的文件夹"]')?.textContent).toContain('/private')
    expect(vi.mocked(api.get).mock.calls.every(([request]) => request.url.startsWith('/api/management/uploads/'))).toBe(true)
  })
  it('updates directory permissions and shows inherited restrictions', async () => {
    await mount(); await click('访问权限')
    await chooseOption('目录规则', '仅登录用户')
    vi.mocked(api.post).mockResolvedValueOnce({ status: 200, content: { effective: 'login' } } as never)
    await click('保存访问权限')
    expect(api.post).toHaveBeenCalledWith({ url: '/api/management/resources/access/', query: { path: '/', mode: 'login' } })
    expect(host.textContent).toContain('子目录不能放宽上级限制')
  })
  it('shows download totals and file ranking and supports audit queries', async () => {
    await mount(); await click('下载统计')
    expect(host.textContent).toContain('游客下载'); expect(host.textContent).toContain('/资料.pdf')
    expect(api.get).toHaveBeenLastCalledWith({ url: '/api/management/resources/statistics/', query: { days: 30 } })
    await click('操作记录'); expect(host.textContent).toContain('/旧.pdf → /新/旧.pdf')
    const search = host.querySelector('input')!; search.value = '管理员'; search.dispatchEvent(new Event('input')); await flush()
    host.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true })); await flush()
    expect(api.get).toHaveBeenLastCalledWith({ url: '/api/management/resources/audit/', query: { page: 1, action: '', search: '管理员' } })
  })
  it('requests elevation again when maintenance authorization expires', async () => {
    await mount(); vi.mocked(api.get).mockResolvedValueOnce({ status: 403, errors: [{ err_msg: '请验证 Passkey' }] } as never)
    await click('下载统计'); expect(expired).toHaveBeenCalledOnce()
  })
  it('shows IP, user and UA rankings and applies filters to paginated records', async () => {
    await mount(); await click('下载统计')
    expect(host.textContent).toContain('独立 IP'); expect(host.textContent).toContain('登录用户排行')
    expect(host.querySelector('[aria-label="下载记录明细"]')?.textContent).toContain('学生 #42')
    expect(host.querySelector('[aria-label="下载记录明细"]')?.textContent).toContain('ExampleBrowser/1')
    ;(host.querySelector('[aria-label="筛选 IP 203.0.113.7"]') as HTMLButtonElement).click(); await flush()
    expect(api.get).toHaveBeenLastCalledWith({ url: '/api/management/resources/statistics/', query: { days: 30, ip: '203.0.113.7' } })
    host.querySelector<HTMLButtonElement>('[aria-label="下一页"]')!.click(); await flush()
    expect(api.get).toHaveBeenLastCalledWith({ url: '/api/management/resources/statistics/', query: { days: 30, ip: '203.0.113.7', page: 2 } })
    ;(host.querySelector('[aria-label="筛选用户 42"]') as HTMLButtonElement).click(); await flush()
    expect(api.get).toHaveBeenLastCalledWith({ url: '/api/management/resources/statistics/', query: { days: 30, ip: '203.0.113.7', user_id: 42 } })
    await click('ExampleBrowser/1')
    expect(api.get).toHaveBeenLastCalledWith({ url: '/api/management/resources/statistics/', query: { days: 30, ip: '203.0.113.7', user_id: 42, ua: 'ExampleBrowser/1' } })
    await click('重置筛选')
    expect(api.get).toHaveBeenLastCalledWith({ url: '/api/management/resources/statistics/', query: { days: 30 } })
  })
  it('retains the last successful report when a filter request fails', async () => {
    await mount(); await click('下载统计')
    vi.mocked(api.get).mockResolvedValueOnce({ status: 400, errors: [{ err_msg: 'IP 地址格式错误' }] } as never)
    ;(host.querySelector('[aria-label="筛选 IP 203.0.113.7"]') as HTMLButtonElement).click(); await flush()
    expect(host.textContent).toContain('IP 地址格式错误'); expect(host.textContent).not.toContain('当前报表筛选')
    expect(host.querySelector('[aria-label="下载记录明细"]')?.textContent).toContain('学生 #42')
  })
  it('changes the statistics range through the shared dropdown while preserving numeric days', async () => {
    await mount(); await click('下载统计')
    const trigger = host.querySelector<HTMLElement>('#resource-statistics-days')!
    trigger.focus(); trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })); await settle()
    const option = [...document.body.querySelectorAll<HTMLElement>('[role="option"]')].find(item => item.textContent?.trim() === '近 90 天')!
    option.focus(); option.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })); await settle()
    expect(api.get).toHaveBeenLastCalledWith({ url: '/api/management/resources/statistics/', query: { days: 90 } })
  })
  it('pushes tool selections while preserving the directory and return URL, and restores them with history', async () => {
    await mount({ canReviewUploads: true }, '/manage/files?path=/课程&next=/admin/&filter=pdf&trash=1')
    await click('访问权限')
    expect(router!.currentRoute.value.query).toEqual({ path: '/课程', next: '/admin/', filter: 'pdf', view: 'maintenance', tool: 'access' })
    expect(host.querySelector('[aria-pressed="true"]')?.textContent).toBe('访问权限')
    await click('投稿文件夹黑名单')
    expect(router!.currentRoute.value.query.tool).toBe('blacklist')
    router!.back(); await flush()
    expect(router!.currentRoute.value.query.tool).toBe('access')
    expect(host.querySelector('[aria-pressed="true"]')?.textContent).toBe('访问权限')
    router!.back(); await flush()
    expect(router!.currentRoute.value.query.tool).toBeUndefined()
    expect(host.querySelector('fieldset')).toBeNull()
    router!.forward(); await flush()
    expect(host.querySelector('[aria-pressed="true"]')?.textContent).toBe('访问权限')
    host.querySelector<HTMLButtonElement>('[aria-label="关闭资料维护"]')!.click(); await flush()
    expect(router!.currentRoute.value.query).toEqual({ path: '/课程', next: '/admin/', filter: 'pdf', view: 'maintenance' })
  })
  it('loads a permitted tool from a deep link without fetching README', async () => {
    await mount({}, '/manage/files?tool=index')
    expect(api.get).toHaveBeenCalledOnce()
    expect(api.get).toHaveBeenLastCalledWith({ url: '/api/management/resources/index/' })
    expect(host.querySelector('[aria-pressed="true"]')?.textContent).toBe('目录索引')
  })
  it('opens the maintenance menu without loading a default tool', async () => {
    await mount({}, '/manage/files?view=maintenance&path=/课程')
    expect(host.querySelector('[aria-label="资料维护"]')).not.toBeNull()
    expect(host.querySelector('fieldset')).toBeNull()
    expect(api.get).not.toHaveBeenCalled()
  })
  it('does not load a selected tool until maintenance becomes active and uses the latest URL selection', async () => {
    await mount({ active: false }, '/manage/files?view=directory&tool=index')
    expect(host.querySelector('[aria-label="资料维护工具"]')).toBeNull()
    expect(api.get).not.toHaveBeenCalled()
    await router!.push('/manage/files?view=directory&tool=statistics'); await flush()
    expect(api.get).not.toHaveBeenCalled()
    active.value = true; await flush()
    expect(api.get).toHaveBeenCalledOnce()
    expect(api.get).toHaveBeenLastCalledWith({ url: '/api/management/resources/statistics/', query: { days: 30 } })
    expect(host.querySelector('[aria-pressed="true"]')?.textContent).toBe('下载统计')
    active.value = false; await flush()
    expect(host.querySelector('fieldset')).toBeNull()
    await router!.push('/manage/files?view=maintenance&tool=index'); await flush()
    expect(api.get).toHaveBeenCalledOnce()
    active.value = true; await flush()
    expect(api.get).toHaveBeenLastCalledWith({ url: '/api/management/resources/index/' })
    expect(host.querySelector('[aria-pressed="true"]')?.textContent).toBe('目录索引')
  })
  it('does not mount or fetch blacklist while maintenance is inactive', async () => {
    await mount({ active: false, canReviewUploads: true }, '/manage/files?tool=blacklist')
    expect(api.get).not.toHaveBeenCalled()
    active.value = true; await flush()
    expect(api.get).toHaveBeenCalledWith({ url: '/api/management/uploads/blacklist/' })
    active.value = false; await flush()
    expect(host.querySelector('[aria-label="禁止投稿的文件夹"]')).toBeNull()
  })
  it('does not follow a pending maintenance request with hidden tool loads', async () => {
    let finish!: (value: never) => void
    vi.mocked(api.get).mockReturnValueOnce(new Promise(resolve => { finish = resolve }))
    await mount({}, '/manage/files?view=maintenance&tool=access')
    await router!.push('/manage/files?view=maintenance&tool=index'); await flush()
    active.value = false; await flush()
    finish({ status: 200, content: { path: '/', mode: 'public', effective: 'public', rules: [] } } as never); await flush()
    expect(api.get).toHaveBeenCalledTimes(2)
    expect(host.querySelector('fieldset')).toBeNull()
    active.value = true; await flush()
    expect(api.get).toHaveBeenLastCalledWith({ url: '/api/management/resources/index/' })
    expect(host.querySelector('[aria-pressed="true"]')?.textContent).toBe('目录索引')
  })
  it.each(['access', 'readme', 'unknown'])('does not request a forbidden or unsupported deep-linked tool %s', async (tool) => {
    await mount({ canManageFiles: false, canReviewUploads: true }, `/manage/files?tool=${tool}`)
    expect(api.get).not.toHaveBeenCalled()
    expect(host.querySelector('fieldset')).toBeNull()
  })
  it('discards a stale panel response and loads the new deep-linked tool after pending work finishes', async () => {
    let finish!: (value: never) => void
    vi.mocked(api.get).mockReturnValueOnce(new Promise(resolve => { finish = resolve }))
    await mount({}, '/manage/files?tool=access')
    await router!.push('/manage/files?tool=index'); await flush()
    finish({ status: 200, content: { path: '/', mode: 'public', effective: 'public', rules: [] } } as never); await flush()
    expect(api.get).toHaveBeenLastCalledWith({ url: '/api/management/resources/index/' })
    expect(host.querySelector('[aria-pressed="true"]')?.textContent).toBe('目录索引')
    expect(host.textContent).toContain('索引更新时间')
    expect(host.textContent).not.toContain('当前实际权限')
  })
})
