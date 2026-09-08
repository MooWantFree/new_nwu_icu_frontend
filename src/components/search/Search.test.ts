import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, type App } from 'vue'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import SearchComponent from './Search.vue'
import { api } from '@/lib/requests'
import { resourcePageUrl } from '@/lib/resourceBrowser'

vi.mock('@/lib/requests', () => ({ api: { get: vi.fn(), post: vi.fn() } }))
vi.mock('../courseReview/course/AddCourseModal.vue', () => ({ default: { render: () => null } }))
let app: App, host: HTMLDivElement, router: Router
const close = vi.fn()
const flush = async () => { for (let i = 0; i < 15; i++) { await Promise.resolve(); await nextTick() } }
async function mount(path = '/disk/课程') {
  router = createRouter({ history: createMemoryHistory(), routes: [
    { path: '/disk/:path(.*)*', name: 'disk', component: { render: () => null } },
    { path: '/', name: 'home', component: { render: () => null } },
  ] })
  await router.push(path); await router.isReady()
  app = createApp({ render: () => h(SearchComponent, { onClose: close }) }).use(router)
  app.mount(host); await flush()
}
async function submit(keyword = '资料') {
  const input = host.querySelector('input')!
  input.value = keyword; input.dispatchEvent(new Event('input')); await flush()
  host.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true })); await flush()
}
beforeEach(() => {
  vi.resetAllMocks(); host = document.createElement('div'); document.body.append(host)
  vi.mocked(api.post).mockResolvedValue({ status: 200, content: { search_result: [], total_pages: 0 } } as never)
})
afterEach(() => { app?.unmount(); host.remove() })
describe('navbar resource search', () => {
  it.each(['file', 'directory'] as const)('opens a %s in the current tab and closes the search modal', async (type) => {
    const path = '/其他/资料 #1%.docx'
    vi.mocked(api.get).mockResolvedValue({ status: 200, content: { entries: [{ name: '资料 #1%.docx', path, type, size: 12 }], page: 1, page_size: 100, total_count: 1 } } as never)
    await mount()
    if (type === 'directory') {
      host.querySelectorAll<HTMLButtonElement>('[aria-label="资源类型"] button')[1].click(); await flush()
    }
    await submit()
    expect(api.get).toHaveBeenCalledWith({ url: '/api/resources/search/', query: { q: '资料', path: '/课程', page: 1, type } })
    expect(api.post).not.toHaveBeenCalled()
    const link = host.querySelector<HTMLAnchorElement>(`a[href="${resourcePageUrl(path)}"]`)!
    expect(link).not.toBeNull(); expect(link.hasAttribute('target')).toBe(false)
    expect(link.textContent).toBe('资料 #1%.docx')
    expect(host.textContent).toContain('所在目录：/其他')
    link.click(); await flush()
    expect(router.currentRoute.value.fullPath).toBe(resourcePageUrl(path))
    expect(close).toHaveBeenCalledOnce()
  })
  it('uses the current file as search context and preserves server result order', async () => {
    vi.mocked(api.get).mockResolvedValue({ status: 200, content: { entries: [
      { name: '本目录文件', path: '/课程/本目录文件', type: 'file', size: 1 },
      { name: '其他文件', path: '/其他文件', type: 'file', size: 1 },
    ], page: 1, page_size: 100, total_count: 2 } } as never)
    await mount('/disk/课程/文件.docx'); await submit()
    expect(api.get).toHaveBeenLastCalledWith({ url: '/api/resources/search/', query: { q: '资料', path: '/课程/文件.docx', page: 1, type: 'file' } })
    expect([...host.querySelectorAll('a')].map(link => link.getAttribute('href'))).toEqual([resourcePageUrl('/课程/本目录文件'), resourcePageUrl('/其他文件')])
  })
  it('keeps other search categories and uses root context outside resource pages', async () => {
    await mount('/'); await submit('高数')
    expect(host.querySelector('[aria-label="资源类型"]')).toBeNull()
    expect(api.post).toHaveBeenCalledWith({ url: '/api/search/', query: { keyword: '高数', type: 'review', current_page: 1, page_size: 10 } })
    vi.mocked(api.get).mockResolvedValue({ status: 200, content: { entries: [], page: 1, page_size: 100, total_count: 0 } } as never)
    const resourceTab = [...host.querySelectorAll('button')].find(button => button.textContent?.trim() === '资源')!
    resourceTab.click(); await flush()
    expect(api.get).toHaveBeenLastCalledWith({ url: '/api/resources/search/', query: { q: '高数', path: '/', page: 1, type: 'file' } })
  })
  it('switches resource types with the same keyword and ignores late results from the previous type', async () => {
    let finishFiles!: (value: never) => void
    vi.mocked(api.get).mockImplementationOnce(() => new Promise(resolve => { finishFiles = resolve }))
    await mount(); await submit('课程')
    vi.mocked(api.get).mockResolvedValue({ status: 200, content: { entries: [{ name: '课程文件夹', path: '/课程文件夹', type: 'directory' }], page: 1, page_size: 100, total_count: 1 } } as never)
    const kinds = host.querySelectorAll<HTMLButtonElement>('[aria-label="资源类型"] button')
    expect(kinds[0].getAttribute('aria-pressed')).toBe('true')
    kinds[1].click(); await flush()
    expect(api.get).toHaveBeenLastCalledWith({ url: '/api/resources/search/', query: { q: '课程', path: '/课程', page: 1, type: 'directory' } })
    expect(kinds[1].getAttribute('aria-pressed')).toBe('true')
    finishFiles({ status: 200, content: { entries: [{ name: '课程旧文件', path: '/课程旧文件', type: 'file' }], page: 1, page_size: 100, total_count: 1 } } as never)
    await flush()
    expect([...host.querySelectorAll('a')].map(link => link.textContent)).toEqual(['课程文件夹'])
  })
})
