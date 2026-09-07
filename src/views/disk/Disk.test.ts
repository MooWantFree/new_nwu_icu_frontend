import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, type App } from 'vue'
import { createMemoryHistory, createRouter, RouterView, type Router } from 'vue-router'
import Disk from './Disk.vue'
import { resourcePageUrl, type ResourceContents } from '@/lib/resourceBrowser'

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
  fetchMock.mockReset().mockResolvedValue(response(folder()))
  vi.stubGlobal('fetch', fetchMock)
  host = document.createElement('div')
  document.body.appendChild(host)
})
afterEach(() => { app?.unmount(); host.remove(); vi.unstubAllGlobals() })
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
  it('places parsed README before the listing and hides the filename', async () => {
    await mount()
    expect(host.querySelector('[aria-label="目录说明"] h1')?.textContent).toBe('目录说明')
    expect(host.textContent).not.toContain('README.md')
    const readme = host.querySelector('[aria-label="目录说明"]')!
    expect(readme.compareDocumentPosition(host.querySelector('[aria-label="文件列表"]')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    const filter = host.querySelector<HTMLInputElement>('input[type="search"]')!
    filter.value = '试卷'
    filter.dispatchEvent(new Event('input'))
    await flush()
    expect(host.querySelector('[aria-label="文件列表"] ul')?.textContent).not.toContain('课程.2026')
    expect(host.querySelector('[aria-label="文件列表"] ul')?.textContent).toContain('试卷 #1%.pdf')
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
})
