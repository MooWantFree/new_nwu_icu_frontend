import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, type App } from 'vue'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import ResourceFileManager from './ResourceFileManager.vue'
import ShadcnFeedbackProvider from '@/components/common/ShadcnFeedbackProvider.vue'
import { api } from '@/lib/requests'

vi.mock('@/lib/requests', () => ({ api: { get: vi.fn(), post: vi.fn() } }))
let app: App | undefined
let host: HTMLDivElement
let hasReadme = true
let readmeContent = '# 课程说明\n\n已有的目录说明。'
const flush = async () => {
  for (let index = 0; index < 15; index++) { await Promise.resolve(); await nextTick() }
  await vi.advanceTimersByTimeAsync(25)
  for (let index = 0; index < 10; index++) { await Promise.resolve(); await nextTick() }
}
const button = (label: string, scope: ParentNode = document.body) => [...scope.querySelectorAll<HTMLButtonElement>('button')]
  .find(item => item.textContent?.trim() === label || item.getAttribute('aria-label') === label)
const click = async (label: string) => { expect(button(label), label).toBeTruthy(); button(label)!.click(); await flush() }
const file = { name: 'README.MD', path: '/README.MD', version: 'file-version', type: 'file', size: 30, modified_at: '2026-10-08T00:00:00Z' }
const directoryQueries = () => vi.mocked(api.get).mock.calls.filter(([request]) => request.url === '/api/management/resources/')

beforeEach(() => {
  vi.resetAllMocks(); vi.useFakeTimers(); hasReadme = true; readmeContent = '# 课程说明\n\n已有的目录说明。'
  host = document.createElement('div'); document.body.append(host)
  vi.mocked(api.get).mockImplementation(async ({ url, query }) => {
    if (url === '/api/management/resources/readme/') return { status: 200, content: {
      path: (query as unknown as { path: string }).path,
      content: hasReadme ? readmeContent : '', version: hasReadme ? 'readme-version' : '', warning: '',
    } } as never
    if (url === '/api/management/resources/access/') return { status: 200, content: { path: (query as unknown as { path: string }).path, mode: 'public', effective: 'public', rules: [] } } as never
    if (url === '/api/management/resources/trash/') return { status: 200, content: { entries: [] } } as never
    const path = (query as unknown as { path: string }).path
    return { status: 200, content: { path, entries: hasReadme ? [{ ...file, path: `${path === '/' ? '' : path}/README.MD` }] : [], max_files: 20, max_file_size: 100 } } as never
  })
  vi.mocked(api.post).mockImplementation(async ({ url, query }) => {
    expect(url).toBe('/api/management/resources/readme/')
    hasReadme = true
    readmeContent = (query as unknown as { content: string }).content
    return { status: 200, content: { path: (query as unknown as { path: string }).path, content: '', version: 'created-version', warning: '' } } as never
  })
})
afterEach(() => { app?.unmount(); app = undefined; host.remove(); vi.clearAllTimers(); vi.useRealTimers() })
const mount = async (router?: Router) => {
  app = createApp({ render: () => h(ShadcnFeedbackProvider, null, { default: () => h(ResourceFileManager) }) })
  if (router) app.use(router)
  app.mount(host); await flush()
}

describe('ResourceFileManager with real maintenance tools', () => {
  it('loads the source and Markdown preview only when the README file edit button is selected', async () => {
    await mount()
    expect(api.get).toHaveBeenCalledExactlyOnceWith({ url: '/api/management/resources/', query: { path: '/' } })
    expect(document.querySelector('[role="dialog"]')).toBeNull()
    expect(document.querySelector('[aria-label="目录说明 Markdown"]')).toBeNull()
    expect(document.querySelector('[aria-label="目录说明预览"]')).toBeNull()
    expect(button('新建 README.md')).toBeDefined()
    expect(host.querySelector('[aria-label="资料维护工具"]')).toBeNull()
    expect(host.querySelector('input[type="file"]')).toBeNull()
    await click('编辑 README.MD')
    expect(api.get).toHaveBeenLastCalledWith({ url: '/api/management/resources/readme/', query: { path: '/' } })
    expect(document.querySelector<HTMLTextAreaElement>('[aria-label="目录说明 Markdown"]')!.value).toContain('# 课程说明')
    expect(document.querySelector('[aria-label="目录说明预览"] h1')?.textContent).toBe('课程说明')
    await click('关闭目录说明编辑器')
    expect(document.querySelector('[role="dialog"]')).toBeNull()
  })

  it('saves the README snapshot and refreshes the surrounding file list', async () => {
    await mount(); await click('编辑 README.MD')
    const source = document.querySelector<HTMLTextAreaElement>('[aria-label="目录说明 Markdown"]')!
    source.value = '# 更新说明'; source.dispatchEvent(new Event('input')); await flush()
    expect(document.querySelector('[aria-label="目录说明预览"] h1')?.textContent).toBe('更新说明')
    vi.mocked(api.post).mockResolvedValueOnce({ status: 200, content: { path: '/', version: 'new-version', content: '# 更新说明', warning: '' } } as never)
    await click('保存目录说明')
    expect(api.post).toHaveBeenCalledExactlyOnceWith({ url: '/api/management/resources/readme/', query: { path: '/', version: 'readme-version', content: '# 更新说明' } })
    expect(directoryQueries()).toHaveLength(2)
    expect(document.querySelector('[role="dialog"] [role="status"]')?.textContent).toContain('目录说明已保存')
    expect(button('保存目录说明')!.disabled).toBe(true)
  })

  it('creates README.md for an empty directory and opens its source and preview after the file is created', async () => {
    hasReadme = false
    await mount()
    expect(api.get).toHaveBeenCalledTimes(1)
    expect(button('新建 README.md')).toBeDefined()
    expect(button('编辑 README.MD')).toBeUndefined()
    await click('新建 README.md')
    expect(api.get).toHaveBeenLastCalledWith({ url: '/api/management/resources/readme/', query: { path: '/' } })
    expect(document.querySelector<HTMLTextAreaElement>('[aria-label="目录说明 Markdown"]')!.value).toBe('')
    expect(document.querySelector('[aria-label="目录说明预览"]')).not.toBeNull()
    expect(api.post).toHaveBeenCalledExactlyOnceWith({ url: '/api/management/resources/readme/', query: { path: '/', version: '', content: '' } })
    expect(document.querySelector('[aria-label="通知"]')?.textContent).toContain('README.md 已创建。')
    expect(directoryQueries()).toHaveLength(2)
    expect(button('编辑 README.MD')).toBeDefined()
  })

  it('shows the shared toast for an existing README without requesting or opening the Markdown editor', async () => {
    await mount(); await click('新建 README.md')
    expect(document.querySelector('[aria-label="通知"]')?.textContent).toContain('当前目录已存在 README.md。')
    expect(document.querySelector('[role="dialog"]')).toBeNull()
    expect(document.querySelector('[aria-label="目录说明 Markdown"]')).toBeNull()
    expect(api.get).toHaveBeenCalledTimes(1)
    expect(api.post).not.toHaveBeenCalled()
  })

  it('keeps the real maintenance tools and directory list in separate history-backed menus', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/manage/files', component: { render: () => null } }] })
    await router.push('/manage/files?path=/课程&next=/upload#resource'); await router.isReady()
    await mount(router)
    expect(host.querySelector('[aria-label="资料维护工具"]')).toBeNull()
    expect(button('编辑 README.MD')).toBeDefined()
    await click('资料维护')
    expect(router.currentRoute.value.query).toEqual({ path: '/课程', next: '/upload', view: 'maintenance' })
    expect(host.querySelector('[aria-label="资料维护工具"]')).not.toBeNull()
    expect(host.querySelector('[aria-label="筛选管理文件"]')).toBeNull()
    expect(button('新建 README.md')).toBeUndefined()
    expect(directoryQueries()).toHaveLength(1)
    await click('访问权限')
    expect(router.currentRoute.value.query.tool).toBe('access')
    expect(router.currentRoute.value.hash).toBe('#resource')
    expect(api.get).toHaveBeenCalledWith({ url: '/api/management/resources/access/', query: { path: '/课程' } })
    expect(api.get).toHaveBeenCalledWith({ url: '/api/management/resources/', query: { path: '/课程' } })
    expect(directoryQueries()).toHaveLength(2)
    await click('当前目录')
    expect(router.currentRoute.value.query).toEqual({ path: '/课程', next: '/upload' })
    expect(host.querySelector('[aria-label="资料维护工具"]')).toBeNull()
    expect(button('编辑 README.MD')).toBeDefined()
    expect(directoryQueries()).toHaveLength(3)
    router.back(); await flush()
    expect(router.currentRoute.value.query.tool).toBe('access')
    expect(host.querySelector('[aria-label="资料维护工具"]')).not.toBeNull()
    expect(host.querySelector('[aria-label="筛选管理文件"]')).toBeNull()
    expect(directoryQueries()).toHaveLength(4)
    router.forward(); await flush()
    expect(host.querySelector('[aria-label="资料维护工具"]')).toBeNull()
    expect(directoryQueries()).toHaveLength(5)
  })

  it('shares a browsed access directory with the file menu and restores both views with history', async () => {
    vi.mocked(api.get).mockImplementation(async ({ url, query }) => {
      const path = (query as unknown as { path: string }).path
      if (url === '/api/management/resources/access/') return { status: 200, content: { path, mode: 'login', effective: 'login', rules: [] } } as never
      expect(url).toBe('/api/management/resources/')
      return { status: 200, content: {
        path, max_files: 20, max_file_size: 100,
        entries: path === '/课程' ? [{ name: '数学', path: '/课程/数学', version: 'folder-v1', type: 'directory', size: null, modified_at: file.modified_at }]
          : [{ ...file, name: '数学.pdf', path: '/课程/数学/数学.pdf' }],
      } } as never
    })
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/manage/files', component: { render: () => null } }] })
    await router.push('/manage/files?view=maintenance&tool=access&path=/课程&next=/upload#resource'); await router.isReady()
    await mount(router)
    expect(host.querySelector('[aria-label="筛选管理文件"]')).toBeNull()
    expect(directoryQueries()).toHaveLength(1)
    await click('进入目录 数学')
    expect(router.currentRoute.value.query).toEqual({ view: 'maintenance', tool: 'access', path: '/课程/数学', next: '/upload' })
    expect(router.currentRoute.value.hash).toBe('#resource')
    expect(host.querySelector('[aria-label="当前目录访问权限"] p')?.textContent).toBe('/课程/数学（含全部子目录与文件）')
    expect(directoryQueries()).toHaveLength(2)
    await click('当前目录')
    expect(router.currentRoute.value.query).toEqual({ path: '/课程/数学', next: '/upload' })
    expect(host.querySelector('[aria-label="资料维护工具"]')).toBeNull()
    expect(host.querySelector('[aria-label="选择 数学.pdf"]')).not.toBeNull()
    expect(button('编辑 README.MD')).toBeUndefined()
    expect([...host.querySelectorAll('span')].some(item => item.textContent === '/课程/数学')).toBe(true)
    expect(directoryQueries()).toHaveLength(3)
    router.back(); await flush()
    expect(router.currentRoute.value.query.tool).toBe('access')
    expect(host.querySelector('[aria-label="筛选管理文件"]')).toBeNull()
    expect(host.querySelector('[aria-label="当前目录访问权限"] p')?.textContent).toBe('/课程/数学（含全部子目录与文件）')
    expect(directoryQueries()).toHaveLength(4)
    router.back(); await flush()
    expect(router.currentRoute.value.query.path).toBe('/课程')
    expect(button('进入目录 数学')).toBeDefined()
    expect(host.querySelector('[aria-label="当前目录访问权限"] p')?.textContent).toBe('/课程（含全部子目录与文件）')
    expect(directoryQueries()).toHaveLength(5)
    expect(api.post).not.toHaveBeenCalled()
  })
})
