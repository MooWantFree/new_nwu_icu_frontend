import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, type App } from 'vue'
import { createMemoryHistory, createRouter, RouterView, type Router } from 'vue-router'
import Disk from './Disk.vue'
import { resourcePageUrl, type ResourceContents } from '@/lib/resourceBrowser'

const warning = vi.hoisted(() => vi.fn())
vi.mock('naive-ui', () => ({ createDiscreteApi: () => ({ message: { warning }, unmount: vi.fn() }) }))

const folder = (path = '/', readme = '# 目录说明'): ResourceContents => ({
  name: '资料', path, type: 'directory', size: null, modified_at: '2026-09-07T00:00:00Z', readme, readme_warning: '',
  entries: [
    { name: '课程.2026', path: '/课程.2026', type: 'directory', size: null, modified_at: '2026-09-07T00:00:00Z' },
    { name: '试卷 #1%.pdf', path: '/试卷 #1%.pdf', type: 'file', size: 20, modified_at: '2026-09-07T00:00:00Z' },
    { name: 'README.md', path: '/README.md', type: 'file', size: 20, modified_at: '2026-09-07T00:00:00Z' },
  ],
})
const response = (data: ResourceContents) => ({ ok: true, json: async () => ({ contents: data }) })
const flush = async () => { for (let i = 0; i < 20; i++) { await Promise.resolve(); await nextTick() } }
let app: App
let host: HTMLDivElement
let router: Router
const fetchMock = vi.fn()

beforeEach(() => {
  warning.mockReset()
  localStorage.removeItem('nwuicu:resource-readme-collapsed')
  fetchMock.mockReset().mockResolvedValue(response(folder()))
  vi.stubGlobal('fetch', fetchMock)
  host = document.createElement('div')
  document.body.appendChild(host)
})
afterEach(() => { app?.unmount(); host.remove(); vi.unstubAllGlobals(); vi.useRealTimers(); vi.restoreAllMocks() })
async function mount(path = '/disk') {
  router = createRouter({ history: createMemoryHistory(), routes: [
    { path: '/disk/:path(.*)*', component: Disk },
    { path: '/upload', component: { render: () => null } },
  ] })
  await router.push(path)
  await router.isReady()
  app = createApp({ render: () => h(RouterView) }).use(router)
  app.mount(host)
  await flush()
}

describe('resource browser page', () => {
  it.each(['file', 'directory'] as const)('restores search, sort and page after going back from a %s result', async (type) => {
    vi.useFakeTimers()
    const target = { name: '试卷.pdf', path: '/其他/试卷.pdf', type, size: 20, modified_at: '' }
    fetchMock.mockImplementation(async (url: string) => {
      if (url.startsWith('/api/resources/search/')) return { ok: true, json: async () => ({ contents: { entries: [target], total_count: 201 } }) }
      const path = new URL(url, 'http://localhost').searchParams.get('path') || '/'
      return response(path === target.path ? { ...folder(path), ...target } : folder(path))
    })
    await mount('/disk/课程.2026?q=试卷&sort=size&direction=asc&page=2')
    await vi.advanceTimersByTimeAsync(250); await flush()
    expect(host.querySelector<HTMLInputElement>('input[type="search"]')!.value).toBe('试卷')
    expect(host.querySelector('[data-sort="size"]')!.getAttribute('aria-label')).toContain('正序')
    expect(host.textContent).toContain('2 / 3')
    host.querySelector<HTMLAnchorElement>(`a[href="${resourcePageUrl(target.path)}"]`)!.click(); await flush()
    expect(router.currentRoute.value.path).toBe(resourcePageUrl(target.path))
    expect(router.currentRoute.value.query.q).toBeUndefined()
    router.back(); await flush()
    await vi.advanceTimersByTimeAsync(250); await flush()
    expect(host.querySelector<HTMLInputElement>('input[type="search"]')!.value).toBe('试卷')
    expect(host.querySelector('[data-sort="size"]')!.getAttribute('aria-label')).toContain('正序')
    expect(host.textContent).toContain('2 / 3')
    expect(host.querySelector<HTMLAnchorElement>(`a[href="${resourcePageUrl(target.path)}"]`)).not.toBeNull()
    const search = [...fetchMock.mock.calls].reverse().find(([url]) => url.startsWith('/api/resources/search/'))!
    const params = new URL(search[0], 'http://localhost').searchParams
    expect(params.get('page')).toBe('2')
    expect(params.get('direction')).toBe('asc')
  })
  it('records typed searches in the current history entry without one entry per character', async () => {
    await mount()
    await router.push('/disk/课程.2026'); await flush()
    const input = host.querySelector<HTMLInputElement>('input[type="search"]')!
    for (const value of ['高', '高数']) {
      input.value = value; input.dispatchEvent(new Event('input')); await flush()
      expect(router.currentRoute.value.query.q).toBe(value)
    }
    router.back(); await flush()
    expect(router.currentRoute.value.path).toBe('/disk')
    expect(host.querySelector<HTMLInputElement>('input[type="search"]')!.value).toBe('')
  })
  it('toggles each header direction while keeping directories first', async () => {
    const data = folder()
    data.entries = [
      { name: 'B.pdf', path: '/B.pdf', type: 'file', size: 10, modified_at: '2026-01-03T00:00:00Z' },
      { name: 'A.pdf', path: '/A.pdf', type: 'file', size: 30, modified_at: '2026-01-01T00:00:00Z' },
      { name: 'C.pdf', path: '/C.pdf', type: 'file', size: 20, modified_at: '2026-01-02T00:00:00Z' },
      { name: 'Z', path: '/Z', type: 'directory', size: null, modified_at: '' },
    ]
    fetchMock.mockResolvedValue(response(data))
    await mount()
    const names = () => [...host.querySelectorAll('[aria-label="文件列表"] ul a')].map(a => a.textContent)
    const header = (key: string) => host.querySelector<HTMLButtonElement>(`[data-sort="${key}"]`)!
    expect(host.querySelector('select')).toBeNull()
    expect(names()).toEqual(['Z', 'A.pdf', 'B.pdf', 'C.pdf'])
    header('name').click(); await flush()
    expect(names()).toEqual(['Z', 'C.pdf', 'B.pdf', 'A.pdf'])
    expect(header('name').getAttribute('aria-label')).toContain('倒序')
    header('name').click(); await flush()
    expect(names()).toEqual(['Z', 'A.pdf', 'B.pdf', 'C.pdf'])
    header('modified').click(); await flush()
    expect(names()).toEqual(['Z', 'B.pdf', 'C.pdf', 'A.pdf'])
    header('modified').click(); await flush()
    expect(names()).toEqual(['Z', 'A.pdf', 'C.pdf', 'B.pdf'])
    header('size').click(); await flush()
    expect(names()).toEqual(['Z', 'A.pdf', 'C.pdf', 'B.pdf'])
    header('size').click(); await flush()
    expect(names()).toEqual(['Z', 'B.pdf', 'C.pdf', 'A.pdf'])
  })
  it('sends header direction to global search and resets pagination', async () => {
    await mount(); vi.useFakeTimers()
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ contents: { entries: [], total_count: 101 } }) })
    const input = host.querySelector<HTMLInputElement>('input[type="search"]')!
    input.value = '试卷'; input.dispatchEvent(new Event('input')); await flush()
    await vi.advanceTimersByTimeAsync(250); await flush()
    ;[...host.querySelectorAll('button')].find(b => b.textContent === '下一页')!.click(); await flush()
    await vi.advanceTimersByTimeAsync(250); await flush()
    expect(new URL(fetchMock.mock.lastCall![0], 'http://localhost').searchParams.get('page')).toBe('2')
    host.querySelector<HTMLButtonElement>('[data-sort="name"]')!.click(); await flush()
    await vi.advanceTimersByTimeAsync(250); await flush()
    const params = new URL(fetchMock.mock.lastCall![0], 'http://localhost').searchParams
    expect(params.get('page')).toBe('1')
    expect(params.get('sort')).toBe('name')
    expect(params.get('direction')).toBe('desc')
  })
  it('shows select-all left of the name heading only in batch mode and tracks partial selection', async () => {
    const data = folder()
    data.entries!.push({ name: '第二份.pdf', path: '/第二份.pdf', type: 'file', size: 20, modified_at: '' })
    fetchMock.mockResolvedValue(response(data))
    await mount()
    expect(host.querySelector('[aria-label="全选本页文件"]')).toBeNull()
    document.cookie = 'csrftoken=test-token; path=/'
    fetchMock.mockResolvedValueOnce({
      status: 200, statusText: 'OK', headers: new Headers(),
      text: async () => JSON.stringify({ errors: [], contents: {
        max_files: 20, max_bytes: 200 * 1024 ** 2, idle_ttl: 1800, queue_limit: 100, anonymous: true,
      } }),
    })
    ;[...host.querySelectorAll('button')].find(b => b.textContent === '批量下载')!.click()
    await flush()
    const selectAll = host.querySelector<HTMLInputElement>('[aria-label="全选本页文件"]')!
    expect(selectAll.nextElementSibling?.textContent).toBe('名称')
    expect(selectAll.closest('[aria-hidden="true"]')).toBeNull()
    host.querySelector<HTMLButtonElement>('[data-sort="name"]')!.click(); await flush()
    expect(selectAll.checked).toBe(false)
    expect(host.textContent).toContain('已选 0 个')
    host.querySelector<HTMLInputElement>('[aria-label="选择 试卷 #1%.pdf"]')!.click()
    await flush()
    expect(selectAll.indeterminate).toBe(true)
    selectAll.click(); await flush()
    expect(selectAll.checked).toBe(true)
    expect(selectAll.indeterminate).toBe(false)
    expect(host.textContent).toContain('已选 2 个')
    selectAll.click(); await flush()
    expect(selectAll.checked).toBe(false)
    expect(host.textContent).toContain('已选 0 个')
    ;[...host.querySelectorAll('button')].find(b => b.textContent === '取消选择')!.click()
    await flush()
    expect(host.querySelector('[aria-label="全选本页文件"]')).toBeNull()
  })
  it('restores a native checkbox when archive size limits reject the file', async () => {
    document.cookie = 'csrftoken=test-token; path=/'
    await mount()
    fetchMock.mockResolvedValueOnce({
      status: 200, statusText: 'OK', headers: new Headers(),
      text: async () => JSON.stringify({ errors: [], contents: {
        max_files: 20, max_bytes: 1, idle_ttl: 1800, queue_limit: 100, anonymous: true,
      } }),
    })
    ;[...host.querySelectorAll('button')].find(b => b.textContent === '批量下载')!.click()
    await flush()
    const checkbox = host.querySelector<HTMLInputElement>('[aria-label="选择 试卷 #1%.pdf"]')!
    checkbox.click(); await flush()
    expect(checkbox.checked).toBe(false)
    expect(warning).toHaveBeenCalledWith(expect.stringContaining('请分批选择'), { duration: 4000 })
    expect(host.textContent).not.toContain('请分批选择')
    expect(host.textContent).toContain('已选 0 个')
    const selectAll = host.querySelector<HTMLInputElement>('[aria-label="全选本页文件"]')!
    selectAll.click(); await flush()
    expect(selectAll.checked).toBe(false)
    expect(warning).toHaveBeenCalledTimes(2)
    expect(host.textContent).toContain('已选 0 个')
  })
  it('sets distinct file metadata and replaces it when navigating between resources', async () => {
    const path = '/课程/试卷 #1%.pdf'
    fetchMock.mockResolvedValue(response({ ...folder(path), name: '试卷 #1%.pdf', type: 'file', size: 20 }))
    await mount(resourcePageUrl(path))
    expect(document.title).toBe('试卷 #1%.pdf - 课程 - NWU.ICU')
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://nwu.icu' + resourcePageUrl(path))
    fetchMock.mockResolvedValue(response(folder('/课程')))
    await router.push(resourcePageUrl('/课程')); await flush()
    expect(document.title).toBe('资料 - 资料下载 - NWU.ICU')
    expect(document.head.querySelector('meta[name="description"]')?.getAttribute('content')).not.toContain('试卷')
  })
  it('uses the server bootstrap once and still refreshes through the API', async () => {
    const script = document.createElement('script')
    script.id = 'resource-bootstrap'; script.type = 'application/json'; script.textContent = JSON.stringify(folder())
    document.body.appendChild(script)
    await mount()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(document.getElementById('resource-bootstrap')).toBeNull()
    host.querySelector<HTMLButtonElement>('[aria-label="刷新目录"]')!.click(); await flush()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
  it('does not index errors and clears that instruction after a successful retry', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404 })
    await mount('/disk/missing')
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex, follow')
    fetchMock.mockResolvedValue(response(folder('/missing')))
    host.querySelector<HTMLButtonElement>('[aria-label="刷新目录"]')!.click(); await flush()
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull()
  })
  it.each(['network', '503'])('does not mark a temporary %s failure as noindex', async (failure) => {
    if (failure === 'network') fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    else fetchMock.mockResolvedValue({ ok: false, status: 503 })
    await mount('/disk/课程')
    expect(host.querySelector('[role="alert"]')).not.toBeNull()
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull()
  })
  it.each([true, false])('keeps file content and indexable=%s when an optional image preview fails', async (indexable) => {
    const path = '/课程/图片.png'
    fetchMock.mockResolvedValueOnce(response({ ...folder(path, ''), name: '图片.png', type: 'file', download_gate_enabled: true, indexable }))
      .mockRejectedValue(new TypeError('Failed to fetch'))
    await mount(resourcePageUrl(path))
    expect(host.querySelector('[aria-label="文件详情"]')).not.toBeNull()
    expect(host.querySelector('[role="alert"]')).toBeNull()
    expect(document.title).toBe('图片.png - 课程 - NWU.ICU')
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content') || null).toBe(indexable ? null : 'noindex, follow')
  })
  it('keeps the directory and README text when a README image cannot be authorized', async () => {
    fetchMock.mockResolvedValueOnce(response({ ...folder('/课程', '说明文字\n\n![插图](image.png)'), download_gate_enabled: true }))
      .mockRejectedValue(new TypeError('Failed to fetch'))
    await mount(resourcePageUrl('/课程'))
    expect(host.querySelector('[aria-label="文件列表"]')).not.toBeNull()
    expect(host.querySelector('[aria-label="目录说明"]')?.textContent).toContain('说明文字')
    expect(host.querySelector('[aria-label="目录说明"] img')?.hasAttribute('src')).toBe(false)
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull()
  })
  it('remembers both collapsed and expanded README preferences across visits', async () => {
    const toggle = () => host.querySelector<HTMLButtonElement>('[aria-controls="resource-readme-content"]')!
    const content = () => host.querySelector<HTMLElement>('#resource-readme-content')!
    await mount()
    expect(toggle().getAttribute('aria-expanded')).toBe('true')
    toggle().click(); await flush()
    expect(content().style.display).toBe('none')
    app.unmount(); await mount('/disk/课程.2026')
    expect(toggle().getAttribute('aria-expanded')).toBe('false')
    expect(content().style.display).toBe('none')
    toggle().click(); await flush()
    app.unmount(); await mount()
    expect(toggle().getAttribute('aria-expanded')).toBe('true')
    expect(content().style.display).not.toBe('none')
  })
  it('keeps README toggling usable when browser storage is unavailable', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
    await mount()
    const toggle = host.querySelector<HTMLButtonElement>('[aria-controls="resource-readme-content"]')!
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    toggle.click(); await flush()
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
  })
  it('places parsed README before the listing and hides the filename', async () => {
    await mount()
    expect(host.querySelector('[aria-label="目录说明"] h1')?.textContent).toBe('目录说明')
    expect(host.textContent).not.toContain('README.md')
    const readme = host.querySelector('[aria-label="目录说明"]')!
    expect(readme.compareDocumentPosition(host.querySelector('[aria-label="文件列表"]')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
  it('uses decoded route params exactly once for special filenames', async () => {
    const path = '/试卷 #1%.pdf'
    fetchMock.mockResolvedValue(response({ ...folder(path), name: '试卷 #1%.pdf', type: 'file', size: 20 }))
    await mount(resourcePageUrl(path))
    const request = new URL(fetchMock.mock.calls[0][0], 'http://localhost')
    expect(request.searchParams.get('path')).toBe(path)
    expect(host.querySelector('[aria-label="文件详情"]')?.textContent).toContain('下载文件')
    expect(host.querySelector('[aria-label="文件详情"]')?.textContent).toContain('打开预览')
  })
  it('authorizes a gated preview before opening the signed URL', async () => {
    document.cookie = 'csrftoken=test-token; path=/'
    const path = '/试卷 #1%.pdf'
    fetchMock
      .mockResolvedValueOnce(response({
        ...folder(path), name: '试卷 #1%.pdf', type: 'file', size: 20, download_gate_enabled: true,
      }))
      .mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify({
          message: '', errors: [], contents: { url: '/api/resources/file/?access=signed', expires_in: 600, gate_enabled: true },
        }),
      })
    const preview = { opener: window, location: { href: '' }, close: vi.fn() }
    vi.spyOn(window, 'open').mockReturnValue(preview as unknown as Window)
    await mount(resourcePageUrl(path))

    const previewButton = [...host.querySelectorAll<HTMLButtonElement>('button')]
      .find(button => button.textContent?.includes('打开预览'))!
    previewButton.click()
    await flush()

    expect(fetchMock.mock.calls[1][0]).toBe('/api/resources/file/authorize/')
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ path, inline: true })
    expect(preview.opener).toBeNull()
    expect(preview.location.href).toBe('/api/resources/file/?access=signed')
  })
  it('displays a recoverable missing-path error', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404 })
    await mount()
    expect(host.querySelector('[role="alert"]')?.textContent).toContain('这个资料不存在、已移动或无权访问')
    expect(host.querySelector('[aria-label="文件列表"]')).toBeNull()
  })
  it('does not let an old request overwrite a newly navigated directory', async () => {
    let finishOld!: (value: ReturnType<typeof response>) => void
    fetchMock.mockReturnValueOnce(new Promise(resolve => { finishOld = resolve }))
    await mount()
    fetchMock.mockResolvedValue(response(folder('/课程.2026', '# 新目录')))
    await router.push(resourcePageUrl('/课程.2026'))
    await flush()
    finishOld(response(folder('/', '# 旧目录')))
    await flush()
    expect(host.querySelector('[aria-label="目录说明"]')?.textContent).toContain('新目录')
    expect(host.textContent).not.toContain('旧目录')
  })
  it.each(['file', 'directory'] as const)('searches globally and navigates to a %s result', async (type) => {
    await mount('/disk/课程.2026'); vi.useFakeTimers()
    const target = { name: '全局 #1%.pdf', path: '/其他目录/全局 #1%.pdf', type, size: 20, modified_at: '2026-09-07T00:00:00Z' }
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ contents: { entries: [target], total_count: 1 } }) })
    const input = host.querySelector<HTMLInputElement>('[aria-label="全局搜索资料"]')!
    input.value = '全局'; input.dispatchEvent(new Event('input')); await flush()
    await vi.advanceTimersByTimeAsync(250); await flush()
    const url = new URL(fetchMock.mock.lastCall![0], 'http://localhost')
    expect(url.pathname).toBe('/api/resources/search/')
    expect(url.searchParams.get('path')).toBe('/课程.2026')
    expect(url.searchParams.get('q')).toBe('全局')
    expect(host.textContent).toContain('全局找到 1 项'); expect(host.textContent).toContain('/其他目录')
    fetchMock.mockResolvedValueOnce(response({ ...folder(target.path), ...target }))
    const link = host.querySelector<HTMLAnchorElement>(`a[href="${resourcePageUrl(target.path)}"]`)!
    link.click(); await flush()
    expect(router.currentRoute.value.fullPath).toBe(resourcePageUrl(target.path))
    if (type === 'file') expect(host.querySelector('[aria-label="文件详情"]')).not.toBeNull()
    else expect(host.querySelector<HTMLInputElement>('[aria-label="全局搜索资料"]')!.value).toBe('')
  })
  it('discards a stale global search after the input is cleared', async () => {
    await mount(); vi.useFakeTimers()
    let finish!: (value: unknown) => void
    fetchMock.mockReturnValueOnce(new Promise(resolve => { finish = resolve }))
    const input = host.querySelector<HTMLInputElement>('input[type="search"]')!
    input.value = '旧搜索'; input.dispatchEvent(new Event('input')); await flush()
    await vi.advanceTimersByTimeAsync(250); await flush()
    input.value = ''; input.dispatchEvent(new Event('input')); await flush()
    finish({ ok: true, json: async () => ({ contents: { entries: [{ ...folder('/旧结果'), name: '旧搜索结果' }], total_count: 1 } }) }); await flush()
    expect(host.textContent).not.toContain('旧搜索结果')
    expect(host.querySelector('[aria-label="文件列表"] ul')?.textContent).toContain('试卷 #1%.pdf')
  })
})
