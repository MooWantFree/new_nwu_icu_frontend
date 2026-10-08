import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, type App } from 'vue'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { NTooltip } from 'naive-ui'
import SearchComponent from './Search.vue'
import { api } from '@/lib/requests'
import { resourcePageUrl } from '@/lib/resourceBrowser'

vi.mock('@/lib/requests', () => ({ api: { get: vi.fn(), post: vi.fn() } }))
vi.mock('@/lib/useShadcnToast', () => ({ useShadcnToast: () => ({ error: vi.fn() }) }))
vi.mock('../courseReview/course/AddCourseModal.vue', () => ({ default: { render: () => null } }))
let app: App, host: HTMLDivElement, router: Router
const close = vi.fn()
const flush = async () => { for (let i = 0; i < 15; i++) { await Promise.resolve(); await nextTick() } }
async function mount(path = '/disk/课程') {
  router = createRouter({ history: createMemoryHistory(), routes: [
    { path: '/disk/:path(.*)*', name: 'disk', component: { render: () => null } },
    { path: '/', name: 'home', component: { render: () => null } },
    { path: '/review/course/:id', name: 'courseReviewItem', component: { render: () => null } },
    { path: '/review/teacher/:id', name: 'teacherReviewItem', component: { render: () => null } },
  ] })
  await router.push(path); await router.isReady()
  app = createApp({ render: () => h(SearchComponent, { onClose: close }) }).use(router)
  app.component('NTooltip', NTooltip)
  app.mount(host); await flush()
}
async function submit(keyword = '资料') {
  const input = host.querySelector('input')!
  input.value = keyword; input.dispatchEvent(new Event('input')); await flush()
  host.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true })); await flush()
}
beforeEach(() => {
  vi.useFakeTimers(); vi.resetAllMocks(); host = document.createElement('div'); document.body.append(host)
  vi.mocked(api.post).mockResolvedValue({ status: 200, content: { search_result: [], total_pages: 0 } } as never)
})
afterEach(() => { app?.unmount(); host.remove(); vi.clearAllTimers(); vi.useRealTimers() })
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
    expect(api.post).toHaveBeenCalledWith({ url: '/api/search/', query: { keyword: '高数', type: 'course', current_page: 1, page_size: 10 } })
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

const course = {
  id: 42, name: '数学分析', teacher: '李老师', classification: '必修', school: '数学学院', semester: '2025 春',
  rating: { average_rating: 4.5, normalized_rating: 0.9 }, like: { like: 3, dislike: 0 },
  review_count: 2, latest_review_time: null,
}
const searchResponse = (search_result: unknown[], total_pages = 1, current_page = 1) => ({
  status: 200, content: { search_result, total_pages, current_page, has_next: total_pages > current_page, has_previous: current_page > 1, total_count: search_result.length },
})
const button = (label: string) => [...host.querySelectorAll<HTMLButtonElement>('button')]
  .find(candidate => candidate.textContent?.trim() === label)!
const input = async (value: string) => {
  const target = host.querySelector<HTMLInputElement>('[aria-label="搜索关键词"]')!
  target.value = value
  target.dispatchEvent(new Event('input', { bubbles: true }))
  await flush()
}
const scrollToEnd = async () => {
  const region = host.querySelector<HTMLElement>('[aria-label="搜索结果"]')!
  Object.defineProperties(region, { scrollTop: { configurable: true, value: 80 }, scrollHeight: { configurable: true, value: 100 }, clientHeight: { configurable: true, value: 20 } })
  region.dispatchEvent(new Event('scroll'))
  await flush()
}

describe('global search interactions', () => {
  it.each([
    { category: '课程', result: course, link: '/review/course/42' },
    { category: '教师', result: { id: 9, name: '李老师', school: '数学学院' }, link: '/review/teacher/9' },
    { category: '课程评价', result: {
      id: 71, course: { id: 42, name: '数学分析' }, content: '<p>讲解清楚</p>', rating: 5,
      created_by: { id: 1, nickname: '同学', avatar_uuid: '' }, modify_time: '2025-01-01T00:00:00Z',
      like: { like: 2, dislike: 0 }, semester: '2025 春',
    }, link: '/review/course/42#review-71' },
  ])('opens $category results in the current tab and retains the review anchor', async ({ category, result, link }) => {
    vi.mocked(api.post).mockResolvedValue(searchResponse([result]) as never)
    await mount('/')
    button(category).click()
    await submit('数学')
    const target = host.querySelector<HTMLAnchorElement>(`a[href="${link}"]`)!
    expect(target).not.toBeNull()
    expect(target.hasAttribute('target')).toBe(false)
    target.click()
    await flush()
    expect(router.currentRoute.value.fullPath).toBe(link)
    expect(close).toHaveBeenCalledOnce()
  })

  it('debounces trimmed keywords, cancels pending work for blank input, and ignores late search results', async () => {
    let finishOld!: (value: never) => void
    vi.mocked(api.post).mockImplementationOnce(() => new Promise(resolve => { finishOld = resolve }))
    await mount('/')
    await input('  数学  ')
    await vi.advanceTimersByTimeAsync(599)
    expect(api.post).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    await flush()
    expect(api.post).toHaveBeenCalledWith({ url: '/api/search/', query: { keyword: '数学', type: 'course', current_page: 1, page_size: 10 } })
    await input('线性代数')
    await input('   ')
    await vi.advanceTimersByTimeAsync(700)
    finishOld(searchResponse([course]) as never)
    await flush()
    expect(api.post).toHaveBeenCalledOnce()
    expect(host.textContent).toContain('输入关键词开始搜索')
    expect(host.querySelector('a')).toBeNull()
    const field = host.querySelector<HTMLInputElement>('input')!
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
    await flush()
    expect(api.post).toHaveBeenCalledOnce()
  })

  it.each([
    { category: '课程', path: '/' },
    { category: '资源', path: '/disk/课程' },
  ])('waits for backspace edits to stop before searching $category', async ({ category, path }) => {
    vi.mocked(api.get).mockResolvedValue({ status: 200, content: { entries: [], page: 1, page_size: 100, total_count: 0 } } as never)
    await mount(path)
    await input('  数学分析  ')
    await vi.advanceTimersByTimeAsync(400)
    expect(api.post).not.toHaveBeenCalled()
    expect(api.get).not.toHaveBeenCalled()

    await input('  数学分  ')
    await vi.advanceTimersByTimeAsync(400)
    expect(api.post).not.toHaveBeenCalled()
    expect(api.get).not.toHaveBeenCalled()

    await input('  数学  ')
    await vi.advanceTimersByTimeAsync(599)
    expect(api.post).not.toHaveBeenCalled()
    expect(api.get).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    await flush()

    if (category === '课程') {
      expect(api.post).toHaveBeenCalledOnce()
      expect(api.post).toHaveBeenCalledWith({ url: '/api/search/', query: { keyword: '数学', type: 'course', current_page: 1, page_size: 10 } })
      expect(api.get).not.toHaveBeenCalled()
    } else {
      expect(api.get).toHaveBeenCalledOnce()
      expect(api.get).toHaveBeenCalledWith({ url: '/api/resources/search/', query: { q: '数学', path: '/课程', page: 1, type: 'file' } })
      expect(api.post).not.toHaveBeenCalled()
    }
  })

  it('submits Enter immediately while keeping composition Enter from submitting', async () => {
    await mount('/')
    await input('数学')
    const field = host.querySelector<HTMLInputElement>('input')!
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true, cancelable: true }))
    await flush()
    expect(api.post).not.toHaveBeenCalled()
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
    await flush()
    expect(api.post).toHaveBeenCalledOnce()
    await vi.advanceTimersByTimeAsync(700)
    expect(api.post).toHaveBeenCalledOnce()
  })

  it('offers an initial retry after a failure and renders the recovered search', async () => {
    vi.mocked(api.post).mockRejectedValueOnce(new Error('搜索连接失败'))
      .mockResolvedValueOnce(searchResponse([course]) as never)
    await mount('/')
    await submit('数学')
    expect(host.querySelector('[role="alert"]')?.textContent).toContain('搜索连接失败')
    expect(host.textContent).not.toContain('添加新课程')
    button('重新搜索').click()
    await flush()
    expect(api.post).toHaveBeenCalledTimes(2)
    expect(host.querySelector('[role="alert"]')).toBeNull()
    expect(host.querySelector('a[href="/review/course/42"]')).not.toBeNull()
  })

  it('preserves results on a failed next page, retries that page, and blocks duplicate scroll requests', async () => {
    let finishPage!: (value: never) => void
    vi.mocked(api.post).mockResolvedValueOnce(searchResponse([course], 2) as never)
      .mockRejectedValueOnce(new Error('下一页连接失败'))
      .mockImplementationOnce(() => new Promise(resolve => { finishPage = resolve }))
    await mount('/')
    await submit('数学')
    await scrollToEnd()
    expect(vi.mocked(api.post).mock.calls[1][0].query).toEqual({ keyword: '数学', type: 'course', current_page: 2, page_size: 10 })
    expect(host.querySelector('a[href="/review/course/42"]')).not.toBeNull()
    expect(host.querySelector('[role="alert"]')?.textContent).toContain('下一页连接失败')
    button('重试').click()
    await flush()
    await scrollToEnd()
    expect(api.post).toHaveBeenCalledTimes(3)
    expect(vi.mocked(api.post).mock.calls[2][0].query).toEqual({ keyword: '数学', type: 'course', current_page: 2, page_size: 10 })
    finishPage(searchResponse([{ ...course, id: 43, name: '线性代数' }], 2, 2) as never)
    await flush()
    expect([...host.querySelectorAll('a')].map(target => target.getAttribute('href'))).toEqual(['/review/course/42', '/review/course/43'])
    expect(host.querySelector('[role="alert"]')).toBeNull()
  })
})
