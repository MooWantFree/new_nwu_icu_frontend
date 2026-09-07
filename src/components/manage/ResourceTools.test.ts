import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, ref, type App } from 'vue'
import ResourceTools from './ResourceTools.vue'
import { api } from '@/lib/requests'

vi.mock('@/lib/requests', () => ({ api: { get: vi.fn(), post: vi.fn() } }))
let app: App, host: HTMLDivElement
const currentPath = ref('/')
const expired = vi.fn()
const flush = async () => { for (let i = 0; i < 20; i++) { await Promise.resolve(); await nextTick() } }
async function click(label: string) { const button = [...host.querySelectorAll('button')].find(item => item.textContent?.trim() === label); expect(button).toBeTruthy(); button!.click(); await flush() }
async function mount() { app = createApp({ render: () => h(ResourceTools, { path: currentPath.value, onSessionExpired: expired }) }); app.mount(host); await flush() }
beforeEach(() => {
  vi.resetAllMocks(); currentPath.value = '/'
  host = document.createElement('div'); document.body.append(host)
  vi.mocked(api.get).mockImplementation(async ({ url, query }) => {
    const path = (query as unknown as { path: string } | undefined)?.path || '/'
    if (url.endsWith('/readme/')) return { status: 200, content: { path, content: '# 原说明', version: 'v1', warning: '' } } as never
    if (url.endsWith('/access/')) return { status: 200, content: { path, mode: 'public', effective: 'public', rules: [] } } as never
    if (url.endsWith('/index/')) return { status: 200, content: { updated_at: '2026-09-07T00:00:00Z', summary: { file_count: 8, directory_count: 2, total_file_size: 1000 } } } as never
    if (url.endsWith('/audit/')) return { status: 200, content: { count: 1, page: 1, results: [{ id: 1, action: 'move', actor: '管理员', path: '/旧.pdf', destination: '/新/旧.pdf', created_at: '2026-09-07T00:00:00Z', detail: {} }] } } as never
    return { status: 200, content: { days: 7, total: 3, guest: 2, authenticated: 1,
      unique_ips: 1, unique_users: 1, unique_uas: 1, unknown_ip: 0, unknown_ua: 0, unknown_user: 0,
      ips: [{ ip_address: '203.0.113.7', count: 3 }], users: [{ user_id: 42, username: '学生', count: 1 }], uas: [{ user_agent: 'ExampleBrowser/1', count: 3 }],
      events: { count: 51, page: 1, page_size: 50, results: [{ id: 1, path: '/资料.pdf', created_at: '2026-09-07T00:00:00Z', authenticated: true, user_id: 42, username: '学生', ip_address: '203.0.113.7', user_agent: 'ExampleBrowser/1' }] },
      daily: [{ date: '2026-09-07', count: 3 }], files: [{ path: '/资料.pdf', count: 3 }] } } as never
  })
})
afterEach(() => { app?.unmount(); host.remove() })
describe('resource maintenance tools', () => {
  it('sanitizes preview and preserves the original directory when an unsaved draft is open', async () => {
    await mount()
    const textarea = host.querySelector('textarea')!
    textarea.value = '# 新说明\n<script>alert(1)</script>'; textarea.dispatchEvent(new Event('input')); await flush()
    expect(host.querySelector('.prose h1')?.textContent).toBe('新说明')
    expect(host.querySelector('.prose script')).toBeNull()
    currentPath.value = '/其他'; await flush()
    expect(host.textContent).toContain('当前保留的是 / 的草稿')
    vi.mocked(api.post).mockResolvedValueOnce({ status: 200, content: { path: '/', content: textarea.value, version: 'v2', warning: '' } } as never)
    await click('保存目录说明')
    expect(api.post).toHaveBeenCalledWith({ url: '/api/management/resources/readme/', query: { path: '/', version: 'v1', content: textarea.value } })
  })
  it('keeps the draft visible on a version conflict', async () => {
    await mount(); const textarea = host.querySelector('textarea')!
    textarea.value = '草稿'; textarea.dispatchEvent(new Event('input')); await flush()
    vi.mocked(api.post).mockResolvedValueOnce({ status: 409, errors: [{ err_msg: '说明已被修改' }] } as never)
    await click('保存目录说明')
    expect(textarea.value).toBe('草稿'); expect(host.textContent).toContain('说明已被修改')
  })
  it('updates directory permissions and shows inherited restrictions', async () => {
    await mount(); await click('访问权限')
    const select = host.querySelector('select')!; select.value = 'login'; select.dispatchEvent(new Event('change')); await flush()
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
    await click('下一页')
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
})
