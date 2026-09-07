import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick, type App } from 'vue'
import ResourceFileManager from './ResourceFileManager.vue'
import { api } from '@/lib/requests'

vi.mock('@/lib/requests', () => ({ api: { get: vi.fn(), post: vi.fn() } }))
let app: App
let host: HTMLDivElement
const expired = vi.fn()
const flush = async () => { for (let i = 0; i < 15; i++) { await Promise.resolve(); await nextTick() } }
const click = async (label: string, scope: ParentNode = host) => {
  const button = [...scope.querySelectorAll('button')].find(item => item.textContent?.trim() === label || item.getAttribute('aria-label') === label)
  expect(button, label).toBeTruthy(); button!.click(); await flush()
}
const file = { name: 'readme.md', path: '/readme.md', version: 'current-version', size: 10, type: 'file', modified_at: '2026-09-07T00:00:00Z' }
const folder = { name: '目标', path: '/目标', version: 'folder-version', size: null, type: 'directory', modified_at: '2026-09-07T00:00:00Z' }
const mount = async () => { app = createApp(ResourceFileManager, { onSessionExpired: expired }); app.mount(host); await flush() }

beforeEach(() => {
  vi.resetAllMocks()
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value() { this.open = true } })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value() { this.open = false } })
  host = document.createElement('div'); document.body.append(host)
  vi.mocked(api.get).mockImplementation(async ({ url, query }) => {
    if (url === '/api/management/resources/readme/') return { status: 200, content: { path: (query as unknown as { path: string }).path, content: '# 说明', version: 'readme-version', warning: '' } } as never
    if (url === '/api/management/resources/trash/') return { status: 200, content: { entries: [{ id: 'trash-id', name: file.name, path: file.path, size: 10, deleted_at: file.modified_at }] } } as never
    const path = (query as unknown as { path: string }).path
    return { status: 200, content: { path, entries: path === '/' ? [folder, file] : [], max_file_size: 100 * 1024 * 1024, max_files: 20 } } as never
  })
  vi.mocked(api.post).mockResolvedValue({ status: 200, content: {} } as never)
})
afterEach(() => { app?.unmount(); host.remove() })

describe('resource file management', () => {
  it('shows README as editable metadata and uploads to the selected directory', async () => {
    await mount()
    expect(host.textContent).toContain('目录说明')
    await click('目标')
    const input = host.querySelector('input[type="file"]') as HTMLInputElement
    Object.defineProperty(input, 'files', { value: [new File(['# 新说明'], 'README.md')] })
    input.dispatchEvent(new Event('change')); await flush()
    vi.mocked(api.post).mockResolvedValueOnce({ status: 201, content: { uploaded: 1 } } as never)
    await click('上传并发布 1 个文件')
    const call = vi.mocked(api.post).mock.calls[0][0]
    expect(call.url).toBe('/api/management/resources/upload/')
    const data = call.query as unknown as FormData
    expect(data.get('path')).toBe('/目标')
    expect((data.get('files') as File).name).toBe('README.md')
    expect(host.textContent).toContain('已发布 1 个文件')
  })

  it('requires deletion confirmation and sends the displayed file revision', async () => {
    await mount(); await click('删除 readme.md')
    expect(api.post).not.toHaveBeenCalled()
    expect(host.querySelector('dialog')?.open).toBe(true)
    await click('取消', host.querySelector('dialog')!)
    expect(api.post).not.toHaveBeenCalled()
    await click('删除 readme.md'); await click('移入回收站')
    expect(api.post).toHaveBeenCalledWith({ url: '/api/management/resources/action/', query: { action: 'delete', path: '/readme.md', version: 'current-version' } })
    expect(host.textContent).toContain('文件已移入回收站')
  })

  it('selects a destination folder before moving the file', async () => {
    await mount(); await click('移动 readme.md')
    const dialog = host.querySelector('dialog')!
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
    expect(host.querySelector('dialog')?.open).toBe(true)
    expect(host.querySelector('dialog [role="alert"]')?.textContent).toContain('文件已被修改')
  })

  it('restores a deleted file to its original directory', async () => {
    await mount(); await click('回收站'); await click('恢复 readme.md')
    await click('恢复文件', host.querySelector('dialog')!)
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
    let input = host.querySelector('dialog input') as HTMLInputElement
    input.value = '新目录'; input.dispatchEvent(new Event('input')); await flush()
    vi.mocked(api.post).mockResolvedValueOnce({ status: 200, content: { completed: 1, failed: [] } } as never)
    await click('创建文件夹')
    expect(api.post).toHaveBeenLastCalledWith({ url: '/api/management/resources/operations/', query: { action: 'mkdir', path: '/', name: '新目录' } })
    await click('重命名 readme.md')
    input = host.querySelector('dialog input') as HTMLInputElement
    input.value = '说明.md'; input.dispatchEvent(new Event('input')); await flush(); await click('保存新名称')
    expect(api.post).toHaveBeenLastCalledWith({ url: '/api/management/resources/action/', query: { action: 'rename', path: '/readme.md', version: 'current-version', name: '说明.md' } })
  })

  it('requires typed confirmation before purging the displayed trash snapshot', async () => {
    await mount(); await click('回收站'); await click('清空回收站')
    const dialog = host.querySelector('dialog')!
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
    expect(host.querySelector('dialog')?.open).toBe(true)
    expect(host.querySelector('dialog [role="alert"]')?.textContent).toContain('成功 0 个，失败 1 个')
    expect((host.querySelector('[aria-label="选择 readme.md"]') as HTMLInputElement).checked).toBe(true)
  })
})
