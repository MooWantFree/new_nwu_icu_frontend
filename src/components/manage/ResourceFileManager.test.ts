import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick, type App } from 'vue'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import ResourceFileManager from './ResourceFileManager.vue'
import { api } from '@/lib/requests'

vi.mock('@/lib/requests', () => ({ api: { get: vi.fn(), post: vi.fn() } }))
const editor = vi.hoisted(() => ({ open: vi.fn() }))
const toast = vi.hoisted(() => ({ info: vi.fn(), success: vi.fn(), error: vi.fn() }))
vi.mock('@/lib/useShadcnToast', () => ({ useShadcnToast: () => toast }))
vi.mock('./ResourceTools.vue', async () => {
  const { defineComponent, h } = await import('vue')
  return { default: defineComponent({
    props: { path: String, canReviewUploads: Boolean, active: { type: Boolean, default: true } },
    setup(props) {
      return () => props.active ? h('div', { 'data-review-uploads': String(props.canReviewUploads) }, '维护工具') : null
    },
  }) }
})
vi.mock('./ResourceReadmeEditor.vue', async () => {
  const { defineComponent } = await import('vue')
  return { default: defineComponent({
    props: { path: String },
    setup(_, { expose }) { expose({ open: editor.open }); return () => null },
  }) }
})
let app: App
let host: HTMLDivElement
const expired = vi.fn()
const flush = async () => {
  for (let i = 0; i < 15; i++) { await Promise.resolve(); await nextTick() }
  await vi.advanceTimersByTimeAsync(25)
  for (let i = 0; i < 5; i++) { await Promise.resolve(); await nextTick() }
}
const click = async (label: string, scope: ParentNode = document.body) => {
  const button = [...scope.querySelectorAll('button')].find(item => item.textContent?.trim() === label || item.getAttribute('aria-label') === label)
  expect(button, label).toBeTruthy(); button!.click(); await flush()
}
const file = { name: 'readme.md', path: '/readme.md', version: 'current-version', size: 10, type: 'file', modified_at: '2026-09-07T00:00:00Z' }
const folder = { name: '目标', path: '/目标', version: 'folder-version', size: null, type: 'directory', modified_at: '2026-09-07T00:00:00Z' }
const mount = async (props: { canReviewUploads?: boolean } = {}, router?: Router) => {
  app = createApp(ResourceFileManager, { ...props, onSessionExpired: expired })
  if (router) app.use(router)
  app.mount(host); await flush()
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.useFakeTimers()
  host = document.createElement('div'); document.body.append(host)
  vi.mocked(api.get).mockImplementation(async ({ url, query }) => {
    if (url === '/api/management/resources/readme/') return { status: 200, content: { path: (query as unknown as { path: string }).path, content: '# 说明', version: 'readme-version', warning: '' } } as never
    if (url === '/api/management/resources/trash/') return { status: 200, content: { entries: [{ id: 'trash-id', name: file.name, path: file.path, size: 10, deleted_at: file.modified_at }] } } as never
    const path = (query as unknown as { path: string }).path
    return { status: 200, content: { path, entries: path === '/' ? [folder, file] : [], max_file_size: 100 * 1024 * 1024, max_files: 20 } } as never
  })
  vi.mocked(api.post).mockResolvedValue({ status: 200, content: {} } as never)
})
afterEach(() => { app?.unmount(); host.remove(); vi.clearAllTimers(); vi.useRealTimers() })

describe('resource file management', () => {
  it('removes direct uploads and opens the README editor from the case-insensitive file row', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ status: 200, content: { path: '/', entries: [{ ...file, name: 'README.MD' }], max_file_size: 100, max_files: 20 } } as never)
    await mount()
    expect(host.textContent).toContain('目录说明')
    expect(host.querySelector('input[type="file"]')).toBeNull()
    expect(host.textContent).not.toContain('上传到当前目录')
    expect(editor.open).not.toHaveBeenCalled()
    await click('编辑 README.MD')
    expect(editor.open).toHaveBeenCalledTimes(1)
    expect(api.post).not.toHaveBeenCalled()
    expect(host.querySelector('[data-review-uploads]')).toBeNull()
    expect(host.querySelector('h2')).toBeNull()
  })

  it('forwards upload review permission to the maintenance tools', async () => {
    await mount({ canReviewUploads: true })
    await click('资料维护')
    expect(host.querySelector('[data-review-uploads]')?.getAttribute('data-review-uploads')).toBe('true')
    expect(host.textContent).not.toContain('选择本页文件')
    expect(host.textContent).not.toContain('readme.md')
    expect(api.get).toHaveBeenCalledTimes(1)
  })

  it('offers README creation and uses a toast when a case-insensitive README file already exists', async () => {
    await mount()
    await click('新建 README.md')
    expect(toast.info).toHaveBeenCalledExactlyOnceWith('当前目录已存在 README.md。')
    expect(editor.open).not.toHaveBeenCalled()
    expect(api.get).toHaveBeenCalledTimes(1)
    expect(api.post).not.toHaveBeenCalled()
    expect(document.querySelector('[role="dialog"]')).toBeNull()
  })

  it('creates README.md for an empty directory and opens its editor', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ status: 200, content: { path: '/', entries: [] } } as never)
      .mockResolvedValueOnce({ status: 200, content: { path: '/', content: '', version: '', warning: '' } } as never)
    vi.mocked(api.post).mockResolvedValueOnce({ status: 200, content: { path: '/', content: '', version: 'created-version', warning: '' } } as never)
    await mount(); await click('新建 README.md')
    expect(editor.open).toHaveBeenCalledTimes(1)
    expect(toast.info).not.toHaveBeenCalled()
    expect(api.post).toHaveBeenCalledExactlyOnceWith({ url: '/api/management/resources/readme/', query: { path: '/', version: '', content: '' } })
    expect(toast.success).toHaveBeenCalledWith('README.md 已创建。')
    expect(api.get).toHaveBeenCalledTimes(3)
  })

  it('reports an invalid README path from the pre-create check without writing to it', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ status: 200, content: { path: '/', entries: [] } } as never)
      .mockResolvedValueOnce({ status: 409, errors: [{ err_msg: 'README 路径不是文件。' }] } as never)
    await mount(); await click('新建 README.md')
    expect(api.post).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith('README 路径不是文件。')
    expect(toast.success).not.toHaveBeenCalled()
    expect(editor.open).not.toHaveBeenCalled()
  })

  it('reports a README found during the pre-create check without overwriting or opening it', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ status: 200, content: { path: '/', entries: [] } } as never)
    await mount(); await click('新建 README.md')
    expect(api.get).toHaveBeenCalledWith({ url: '/api/management/resources/readme/', query: { path: '/' } })
    expect(api.post).not.toHaveBeenCalled()
    expect(editor.open).not.toHaveBeenCalled()
    expect(toast.info).toHaveBeenCalledExactlyOnceWith('当前目录已存在 README.md。')
    expect(api.get).toHaveBeenCalledTimes(3)
  })

  it('turns a create conflict into an already-exists toast after refreshing the directory', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ status: 200, content: { path: '/', entries: [] } } as never)
      .mockResolvedValueOnce({ status: 200, content: { path: '/', content: '', version: '', warning: '' } } as never)
    vi.mocked(api.post).mockResolvedValueOnce({ status: 409, errors: [{ err_msg: '目录说明已被修改，请重新加载后再保存。' }] } as never)
    await mount(); await click('新建 README.md')
    expect(api.post).toHaveBeenCalledTimes(1)
    expect(toast.info).toHaveBeenCalledExactlyOnceWith('当前目录已存在 README.md。')
    expect(toast.error).not.toHaveBeenCalled()
    expect(editor.open).not.toHaveBeenCalled()
    expect(api.get).toHaveBeenCalledTimes(3)
  })

  it('shows a create conflict without a new README as an error instead of claiming it exists', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ status: 200, content: { path: '/', entries: [] } } as never)
      .mockResolvedValueOnce({ status: 200, content: { path: '/', content: '', version: '', warning: '' } } as never)
      .mockResolvedValueOnce({ status: 200, content: { path: '/', entries: [] } } as never)
    vi.mocked(api.post).mockResolvedValueOnce({ status: 409, errors: [{ err_msg: '目录说明已被修改，请重新加载后再保存。' }] } as never)
    await mount(); await click('新建 README.md')
    expect(toast.error).toHaveBeenCalledWith('目录说明已被修改，请重新加载后再保存。')
    expect(toast.info).not.toHaveBeenCalled()
    expect(editor.open).not.toHaveBeenCalled()
  })

  it('reports a creation failure and requests revalidation when the management session has expired', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ status: 200, content: { path: '/', entries: [] } } as never)
      .mockResolvedValueOnce({ status: 200, content: { path: '/', content: '', version: '', warning: '' } } as never)
    vi.mocked(api.post).mockResolvedValueOnce({ status: 403, errors: [{ err_msg: '请重新验证 Passkey' }] } as never)
    await mount(); await click('新建 README.md')
    expect(expired).toHaveBeenCalledTimes(1)
    expect(toast.error).toHaveBeenCalledWith('请重新验证 Passkey')
    expect(toast.success).not.toHaveBeenCalled()
    expect(editor.open).not.toHaveBeenCalled()
  })

  it('keeps README creation unavailable while a directory is loading and after its load fails', async () => {
    let resolve!: (value: unknown) => void
    vi.mocked(api.get).mockImplementationOnce(() => new Promise(done => { resolve = done }) as never)
    await mount()
    const button = [...host.querySelectorAll<HTMLButtonElement>('button')].find(item => item.textContent?.trim() === '新建 README.md')!
    expect(button.matches(':disabled')).toBe(true)
    button.click(); await flush()
    expect(editor.open).not.toHaveBeenCalled()
    resolve({ status: 500, errors: [{ err_msg: '目录读取失败' }] }); await flush()
    expect(button.matches(':disabled')).toBe(true)
    expect(host.textContent).toContain('目录读取失败')
    button.click(); await flush()
    expect(editor.open).not.toHaveBeenCalled()
    expect(toast.info).not.toHaveBeenCalled()
  })

  it('loads local directories and the recycle bin when no router is provided', async () => {
    await mount(); await click('目标')
    expect(api.get).toHaveBeenLastCalledWith({ url: '/api/management/resources/', query: { path: '/目标' } })
    await click('回收站')
    expect(api.get).toHaveBeenLastCalledWith({ url: '/api/management/resources/trash/' })
    await click('当前目录')
    expect(api.get).toHaveBeenLastCalledWith({ url: '/api/management/resources/', query: { path: '/目标' } })
  })

  it('keeps directory and recycle-bin navigation in browser history while preserving other query fields', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/manage/files', component: { render: () => null } }] })
    await router.push({ path: '/manage/files', query: { path: '/目标', next: '/upload' }, hash: '#directory' })
    await router.isReady(); await mount({}, router)
    expect(api.get).toHaveBeenLastCalledWith({ url: '/api/management/resources/', query: { path: '/目标' } })
    await click('根目录')
    expect(router.currentRoute.value.query).toEqual({ path: '/', next: '/upload' })
    expect(router.currentRoute.value.hash).toBe('#directory')
    router.back(); await flush()
    expect(router.currentRoute.value.query.path).toBe('/目标')
    expect(api.get).toHaveBeenLastCalledWith({ url: '/api/management/resources/', query: { path: '/目标' } })
    await click('刷新')
    expect(api.get).toHaveBeenLastCalledWith({ url: '/api/management/resources/', query: { path: '/目标' } })
    await click('回收站')
    expect(router.currentRoute.value.query).toEqual({ path: '/目标', next: '/upload', trash: '1' })
    expect(router.currentRoute.value.hash).toBe('#directory')
    expect(api.get).toHaveBeenLastCalledWith({ url: '/api/management/resources/trash/' })
    router.back(); await flush()
    expect(router.currentRoute.value.query.trash).toBeUndefined()
    expect(host.textContent).toContain('当前目录')
    router.forward(); await flush()
    expect(router.currentRoute.value.query.trash).toBe('1')
    expect(host.textContent).toContain('回收站占用')
  })

  it('loads a deep-linked recycle bin and retains its directory when returning to files', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/manage/files', component: { render: () => null } }] })
    await router.push('/manage/files?path=/目标&trash=1&next=/upload')
    await router.isReady(); await mount({}, router)
    expect(api.get).toHaveBeenCalledExactlyOnceWith({ url: '/api/management/resources/trash/' })
    await click('当前目录')
    expect(router.currentRoute.value.query).toEqual({ path: '/目标', next: '/upload' })
    expect(api.get).toHaveBeenLastCalledWith({ url: '/api/management/resources/', query: { path: '/目标' } })
  })

  it('restores the maintenance menu from a deep link without loading directory files', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/manage/files', component: { render: () => null } }] })
    await router.push('/manage/files?path=/目标&view=maintenance&tool=statistics&next=/upload#directory')
    await router.isReady(); await mount({ canReviewUploads: true }, router)
    expect(host.textContent).toContain('维护工具')
    expect(host.querySelector('[data-review-uploads]')).not.toBeNull()
    expect(host.querySelector('[aria-label="筛选管理文件"]')).toBeNull()
    expect(host.textContent).not.toContain('回收站占用')
    expect(api.get).not.toHaveBeenCalled()
    await click('当前目录')
    expect(router.currentRoute.value.query).toEqual({ path: '/目标', next: '/upload' })
    expect(router.currentRoute.value.hash).toBe('#directory')
    expect(host.querySelector('[data-review-uploads]')).toBeNull()
    expect(api.get).toHaveBeenCalledExactlyOnceWith({ url: '/api/management/resources/', query: { path: '/目标' } })
    router.back(); await flush()
    expect(router.currentRoute.value.query.view).toBe('maintenance')
    expect(router.currentRoute.value.query.tool).toBe('statistics')
    expect(host.querySelector('[aria-label="筛选管理文件"]')).toBeNull()
    expect(api.get).toHaveBeenCalledTimes(1)
    router.forward(); await flush()
    expect(router.currentRoute.value.query.view).toBeUndefined()
    expect(host.querySelector('[aria-label="筛选管理文件"]')).not.toBeNull()
    expect(api.get).toHaveBeenCalledTimes(2)
  })

  it('recognizes older maintenance links and clears the selected tool when opening the recycle bin', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/manage/files', component: { render: () => null } }] })
    await router.push('/manage/files?path=/目标&tool=access&next=/upload#directory')
    await router.isReady(); await mount({}, router)
    expect(host.querySelector('[data-review-uploads]')).not.toBeNull()
    expect(api.get).not.toHaveBeenCalled()
    await click('回收站')
    expect(router.currentRoute.value.query).toEqual({ path: '/目标', next: '/upload', trash: '1' })
    expect(router.currentRoute.value.hash).toBe('#directory')
    expect(host.querySelector('[data-review-uploads]')).toBeNull()
    expect(api.get).toHaveBeenCalledExactlyOnceWith({ url: '/api/management/resources/trash/' })
    expect(host.textContent).toContain('回收站占用')
    router.back(); await flush()
    expect(router.currentRoute.value.query.tool).toBe('access')
    expect(host.querySelector('[data-review-uploads]')).not.toBeNull()
    expect(api.get).toHaveBeenCalledTimes(1)
  })

  it('switches between three exclusive menus without creating a directory request for maintenance', async () => {
    await mount()
    expect(host.querySelector('[aria-label="筛选管理文件"]')).not.toBeNull()
    expect(host.querySelector('[data-review-uploads]')).toBeNull()
    await click('资料维护')
    expect(host.querySelector('[data-review-uploads]')).not.toBeNull()
    expect(host.querySelector('[aria-label="筛选管理文件"]')).toBeNull()
    expect(api.get).toHaveBeenCalledTimes(1)
    await click('回收站')
    expect(host.querySelector('[data-review-uploads]')).toBeNull()
    expect(host.textContent).toContain('回收站占用')
    expect(host.textContent).not.toContain('选择本页文件')
    await click('当前目录')
    expect(host.querySelector('[data-review-uploads]')).toBeNull()
    expect(host.textContent).toContain('选择本页文件')
    expect(api.get).toHaveBeenCalledTimes(3)
  })

  it('ignores a directory response that arrives after history navigates to another path', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/manage/files', component: { render: () => null } }] })
    await router.push('/manage/files')
    await router.isReady()
    let resolve!: (value: unknown) => void
    vi.mocked(api.get).mockImplementationOnce(() => new Promise(done => { resolve = done }) as never)
    await mount({}, router)
    await router.push('/manage/files?path=/目标'); await flush()
    expect(router.currentRoute.value.query.path).toBe('/目标')
    resolve({ status: 200, content: { path: '/', entries: [file], max_files: 20, max_file_size: 100 } })
    await flush()
    expect(host.textContent).not.toContain('readme.md')
    expect(host.querySelector<HTMLAnchorElement>('a[target="_blank"]')!.getAttribute('href')).toBe('/disk/%E7%9B%AE%E6%A0%87')
    expect(editor.open).not.toHaveBeenCalled()
  })

  it('requires deletion confirmation and sends the displayed file revision', async () => {
    await mount(); await click('删除 readme.md')
    expect(api.post).not.toHaveBeenCalled()
    expect(document.querySelector('[role="dialog"]')).not.toBeNull()
    await click('取消', document.querySelector<HTMLElement>('[role="dialog"]')!)
    expect(api.post).not.toHaveBeenCalled()
    await click('删除 readme.md'); await click('移入回收站')
    expect(api.post).toHaveBeenCalledWith({ url: '/api/management/resources/action/', query: { action: 'delete', path: '/readme.md', version: 'current-version' } })
    expect(host.textContent).toContain('文件已移入回收站')
  })

  it('selects a destination folder before moving the file', async () => {
    await mount(); await click('移动 readme.md')
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!
    const submit = [...dialog.querySelectorAll('button')].find(button => button.textContent === '移动到此目录')!
    expect(submit.disabled).toBe(true)
    await click('目标', dialog)
    expect(submit.disabled).toBe(false)
    await click('移动到此目录', dialog)
    expect(api.post).toHaveBeenCalledWith({ url: '/api/management/resources/action/', query: { action: 'move', path: '/readme.md', version: 'current-version', destination: '/目标' } })
  })

  it('keeps conflicts visible without closing the action dialog', async () => {
    await mount(); await click('删除 readme.md')
    vi.mocked(api.post).mockResolvedValueOnce({ status: 409, errors: [{ err_msg: '文件已被修改' }] } as never)
    await click('移入回收站')
    expect(document.querySelector('[role="dialog"]')).not.toBeNull()
    expect(document.querySelector('[role="dialog"] [role="alert"]')?.textContent).toContain('文件已被修改')
  })

  it('restores a deleted file to its original directory', async () => {
    await mount(); await click('回收站'); await click('恢复 readme.md')
    await click('恢复文件', document.querySelector<HTMLElement>('[role="dialog"]')!)
    expect(api.post).toHaveBeenCalledWith({ url: '/api/management/resources/action/', query: { action: 'restore', trash_id: 'trash-id' } })
  })

  it('requests Passkey revalidation when elevation expires', async () => {
    await mount(); await click('删除 readme.md')
    vi.mocked(api.post).mockResolvedValueOnce({ status: 403, errors: [{ err_msg: '请重新验证 Passkey' }] } as never)
    await click('移入回收站')
    expect(expired).toHaveBeenCalledTimes(1)
  })

  it('creates a folder and renames a file with the displayed revision', async () => {
    await mount(); await click('新建文件夹')
    let input = document.querySelector('[role="dialog"] input') as HTMLInputElement
    input.value = '新目录'; input.dispatchEvent(new Event('input')); await flush()
    vi.mocked(api.post).mockResolvedValueOnce({ status: 200, content: { completed: 1, failed: [] } } as never)
    await click('创建文件夹')
    expect(api.post).toHaveBeenLastCalledWith({ url: '/api/management/resources/operations/', query: { action: 'mkdir', path: '/', name: '新目录' } })
    await click('重命名 readme.md')
    input = document.querySelector('[role="dialog"] input') as HTMLInputElement
    input.value = '说明.md'; input.dispatchEvent(new Event('input')); await flush(); await click('保存新名称')
    expect(api.post).toHaveBeenLastCalledWith({ url: '/api/management/resources/action/', query: { action: 'rename', path: '/readme.md', version: 'current-version', name: '说明.md' } })
  })

  it('requires typed confirmation before purging the displayed trash snapshot', async () => {
    await mount(); await click('回收站'); await click('清空回收站')
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!
    const submit = [...dialog.querySelectorAll('button')].find(button => button.textContent === '确认永久删除')!
    expect(submit.disabled).toBe(true)
    const input = dialog.querySelector('input')!
    input.value = '永久删除'; input.dispatchEvent(new Event('input')); await flush()
    expect(submit.disabled).toBe(false)
    vi.mocked(api.post).mockResolvedValueOnce({ status: 200, content: { completed: 1, failed: [] } } as never)
    await click('确认永久删除', dialog)
    expect(api.post).toHaveBeenLastCalledWith({ url: '/api/management/resources/operations/', query: { action: 'purge', trash_ids: ['trash-id'], confirmation: '永久删除' } })
  })

  it('keeps failed batch items available for retry and reports partial success', async () => {
    await mount()
    const checkbox = host.querySelector('[aria-label="选择 readme.md"]') as HTMLInputElement
    checkbox.click(); await flush(); await click('批量删除')
    vi.mocked(api.post).mockResolvedValueOnce({ status: 409, errors: [{ err_msg: '目标已变化' }] } as never)
    await click('移入回收站')
    expect(document.querySelector('[role="dialog"]')).not.toBeNull()
    expect(document.querySelector('[role="dialog"] [role="alert"]')?.textContent).toContain('成功 0 个，失败 1 个')
    expect((host.querySelector('[aria-label="选择 readme.md"]') as HTMLInputElement).checked).toBe(true)
  })

  it('keeps a pending file mutation open when closing controls, Escape, or the backdrop are used', async () => {
    await mount(); await click('删除 readme.md')
    let resolve!: (value: unknown) => void
    vi.mocked(api.post).mockImplementationOnce(() => new Promise(done => { resolve = done }) as never)
    await click('移入回收站')
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!
    expect(dialog.querySelector<HTMLButtonElement>('[aria-label="关闭删除文件窗口"]')!.disabled).toBe(true)
    await click('取消', dialog)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
    document.querySelector<HTMLElement>('[data-shadcn-modal-overlay]')!.click()
    await flush()
    expect(document.querySelector('[role="dialog"]')).not.toBeNull()
    expect(api.post).toHaveBeenCalledTimes(1)
    resolve({ status: 200, content: {} })
    await flush()
    expect(document.querySelector('[role="dialog"]')).toBeNull()
    expect(host.textContent).toContain('文件已移入回收站')
  })

  it('uses shared pagination and resets the page after filtering', async () => {
    vi.mocked(api.get).mockResolvedValue({ status: 200, content: {
      path: '/', entries: Array.from({ length: 101 }, (_, index) => ({ ...file, name: `资料-${index + 1}.pdf`, path: `/资料-${index + 1}.pdf` })),
      max_file_size: 100 * 1024 * 1024, max_files: 20,
    } } as never)
    await mount()
    expect(host.querySelector('[aria-label="分页"]')).not.toBeNull()
    expect(host.querySelector('[aria-current="page"]')?.getAttribute('aria-label')).toBe('第 1 页')
    await click('下一页')
    expect(host.querySelector('[aria-current="page"]')?.getAttribute('aria-label')).toBe('第 2 页')
    expect(host.textContent).toContain('资料-101.pdf')
    const input = host.querySelector<HTMLInputElement>('[aria-label="筛选管理文件"]')!
    input.value = '资料-1.pdf'; input.dispatchEvent(new Event('input')); await flush()
    expect(host.querySelector('[aria-label="分页"]')).toBeNull()
    expect(host.textContent).toContain('资料-1.pdf')
    expect(host.textContent).not.toContain('资料-101.pdf')
  })
})
