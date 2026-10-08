import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, ref, type App } from 'vue'
import { useResourceArchives, type ArchiveController } from './useResourceArchives'
import type { ResourceEntry } from './resourceBrowser'
import type { ArchiveTask } from '@/types/api/resourceArchives'
import ResourceArchivePanel from '@/components/disk/ResourceArchivePanel.vue'

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), warning: vi.fn() }))
vi.mock('@/lib/requests', () => ({ api: mocks }))
vi.mock('@/lib/useShadcnToast', () => ({ useShadcnToast: () => ({ warning: mocks.warning }) }))
const file = (name: string, size = 10): ResourceEntry => ({ name, path: '/' + name, type: 'file', size, modified_at: '' })
const task = (status: ArchiveTask['status'] = 'queued'): ArchiveTask => ({
  id: 'receipt', status, file_count: 2, paths: ['/a', '/b'], source_bytes: 20, zip_bytes: 200,
  processed_bytes: 0, processed_files: 0, ahead: 2, expires_at: '2026-09-28T12:00:00Z', created_at: '', filename: '资料.zip', message: '',
})
const flush = async () => { for (let n = 0; n < 10; n++) { await Promise.resolve(); await nextTick() } }
const ok = (content: unknown) => ({ status: 200, content })
let app: App
let host: HTMLDivElement
let control: ArchiveController
const entries = ref<ResourceEntry[]>([])
const context = ref('/')

beforeEach(() => {
  vi.useFakeTimers(); localStorage.clear(); mocks.get.mockReset(); mocks.post.mockReset(); mocks.warning.mockReset()
  mocks.get.mockImplementation(({ url }) => Promise.resolve(ok(url.endsWith('config/')
    ? { max_files: 2, max_bytes: 25, idle_ttl: 1800, queue_limit: 100, anonymous: true } : { tasks: [] })))
  entries.value = [file('a'), file('b'), { ...file('folder'), type: 'directory', size: null }]
  context.value = '/'
  host = document.createElement('div'); document.body.appendChild(host)
})
afterEach(() => { app?.unmount(); host.remove(); localStorage.clear(); vi.useRealTimers(); vi.restoreAllMocks() })
function mount(withPanel = false) {
  app = createApp({ setup() { control = useResourceArchives(entries, context); return () => withPanel ? h(ResourceArchivePanel, { control }) : h('div') } })
  app.mount(host)
}

describe('mobile archive flow', () => {
  it('opens on submission and only X closes it, even while the request is pending', async () => {
    mount(true)
    let resolve!: (value: unknown) => void
    mocks.post.mockReturnValueOnce(new Promise(done => { resolve = done }))
    const submit = control.submit(['/a', '/b'])
    await flush()
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!
    expect(dialog).not.toBeNull()
    expect(dialog.textContent).toContain('正在提交打包任务')
    expect(document.body.textContent).not.toContain('我的资料包')
    expect(document.body.style.overflow).toBe('hidden')
    dialog.parentElement!.click()
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await flush()
    expect(control.state.panel).toBe(true)
    dialog.querySelector<HTMLButtonElement>('[aria-label="关闭打包窗口"]')!.click()
    await flush()
    expect(control.state.panel).toBe(false)
    expect(document.querySelector('[role="dialog"]')).toBeNull()
    expect(document.body.style.overflow).toBe('')
    resolve(ok({ task: task(), result: 'created' }))
    await submit; await flush()
    expect(document.querySelector('[role="dialog"]')).toBeNull()
    expect(host.querySelector('button')).toBeNull()
  })
  it('loads lazily and selects only files on the current page', async () => {
    mount(); expect(mocks.get).not.toHaveBeenCalled()
    await control.startSelection(); control.selectPage()
    expect(control.state.selected.map(f => f.path)).toEqual(['/a', '/b'])
    expect(control.pageSelected).toBe(true)
    control.selectPage(); expect(control.state.selected).toEqual([])
  })
  it('rejects an oversized select-all without silently changing selection', async () => {
    mount(); await control.startSelection(); control.toggle(file('a'))
    entries.value = [file('b'), file('c')]
    control.selectPage()
    expect(control.state.selected.map(f => f.path)).toEqual(['/a'])
    expect(mocks.warning).toHaveBeenCalledWith(expect.stringContaining('分批'), { duration: 4000 })
    expect(control.state.error).toBe('')
    control.toggle(file('large', 30))
    expect(control.selectedBytes).toBe(10)
  })
  it('retains selection across pages but clears on directory or search change', async () => {
    mount(); await control.startSelection(); control.toggle(file('a'))
    entries.value = [file('b')]; await nextTick()
    expect(control.state.selected).toHaveLength(1)
    control.selectPage(); control.selectPage()
    expect(control.state.selected.map(f => f.path)).toEqual(['/a'])
    context.value = '/next'; await nextTick()
    expect(control.state.selected).toHaveLength(0)
  })
  it('preserves an idempotency key after network failure and selection on queue rejection', async () => {
    mount(); await control.startSelection(); control.toggle(file('a'))
    mocks.post.mockRejectedValueOnce(new Error('断网')).mockResolvedValueOnce({ status: 429, errors: [{ err_msg: '队列已满' }] })
    await control.submit(); await control.submit()
    expect(mocks.post.mock.calls[0][0].query.request_key).toBe(mocks.post.mock.calls[1][0].query.request_key)
    expect(control.state.selected).toHaveLength(1)
    expect(control.state.error).toBe('队列已满')
  })
  it('displays the existing task when another submission is already active', async () => {
    mount(); await control.startSelection(); control.toggle(file('a'))
    mocks.post.mockResolvedValue(ok({ task: task(), result: 'active' }))
    await control.submit()
    expect(control.state.panel).toBe(true)
    expect(control.state.message).toContain('已有一个')
    expect(control.running?.ahead).toBe(2)
    expect(localStorage.getItem('nwuicu:archive-history')).toBeNull()
  })
  it('does not restore history and polls only the task returned by this submission', async () => {
    localStorage.setItem('nwuicu:archive-history', 'true')
    mount(); await flush()
    expect(control.state.tasks).toHaveLength(0)
    expect(mocks.get).not.toHaveBeenCalled()
    mocks.post.mockResolvedValue(ok({ task: task(), result: 'created' }))
    await control.submit(['/a', '/b'])
    mocks.get.mockResolvedValue(ok({ task: task('ready') }))
    await vi.advanceTimersByTimeAsync(2000)
    expect(mocks.get).toHaveBeenCalledExactlyOnceWith({ url: '/api/resources/archives/:id/', params: { id: 'receipt' } })
    expect(control.state.tasks).toHaveLength(1)
    expect(control.state.tasks[0].status).toBe('ready')
    await vi.advanceTimersByTimeAsync(15000)
    expect(mocks.get).toHaveBeenCalledTimes(1)
    expect(mocks.post).toHaveBeenCalledTimes(1)
  })
  it('replaces the previous task and ignores its late progress response', async () => {
    mount()
    mocks.post.mockResolvedValueOnce(ok({ task: task('ready'), result: 'created' }))
    await control.submit(['/a', '/b'])
    let resolve!: (value: unknown) => void
    mocks.get.mockReturnValueOnce(new Promise(done => { resolve = done }))
    const refresh = control.refresh()
    const next = { ...task(), id: 'next-receipt' }
    mocks.post.mockResolvedValueOnce(ok({ task: next, result: 'created' }))
    const submit = control.submit(['/c'])
    expect(control.state.tasks).toEqual([])
    await submit
    resolve(ok({ task: task('ready') }))
    await refresh
    expect(control.state.tasks).toEqual([next])
    mocks.get.mockResolvedValueOnce(ok({ task: { ...next, status: 'ready' } }))
    await control.refresh()
    expect(mocks.get).toHaveBeenLastCalledWith({ url: '/api/resources/archives/:id/', params: { id: 'next-receipt' } })
    expect(control.state.tasks).toHaveLength(1)
  })
  it('shows reused archives without a duplicate-package notice', async () => {
    mount()
    mocks.post.mockResolvedValue(ok({ task: task('ready'), result: 'reused' }))
    await control.submit(['/a', '/b'])
    expect(control.state.message).toBe('')
    expect(control.state.tasks[0].status).toBe('ready')
  })
  it('keeps changed-file failures only in the current panel, never restored history', async () => {
    mount()
    mocks.post.mockResolvedValue(ok({ task: task(), result: 'created' }))
    await control.submit(['/a', '/b'])
    const failed = { ...task('failed'), transient: true, message: '打包期间文件发生变化，请重新选择。' }
    mocks.get.mockResolvedValue(ok({ task: failed }))
    await control.refresh()
    expect(mocks.get).toHaveBeenLastCalledWith({ url: '/api/resources/archives/:id/', params: { id: 'receipt' } })
    expect(control.state.tasks[0].message).toContain('发生变化')
    await control.refresh()
    expect(control.state.tasks).toHaveLength(1)
    control.state.panel = false
    expect(control.state.tasks).toEqual([])
    control.state.panel = true
    await control.refresh()
    expect(control.state.tasks).toEqual([])
    expect(mocks.get).toHaveBeenCalledTimes(2)
  })
  it('does not restore a transient failure from a poll that finishes after closing', async () => {
    mount()
    mocks.post.mockResolvedValue(ok({ task: task(), result: 'created' }))
    await control.submit(['/a', '/b'])
    let resolve!: (value: unknown) => void
    mocks.get.mockReturnValueOnce(new Promise(done => { resolve = done }))
    const refresh = control.refresh()
    control.state.panel = false
    resolve(ok({ task: { ...task('failed'), transient: true } }))
    await refresh
    expect(control.state.tasks.some(t => t.transient)).toBe(false)
  })
  it('hands a signed URL to the browser without allocating a ZIP Blob', async () => {
    mount()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    const ready = task('ready')
    control.state.tasks = [ready]
    mocks.post.mockResolvedValue(ok({ url: '/api/resources/archives/receipt/download/?access=secret', task: ready }))
    await control.download(ready)
    expect(click).toHaveBeenCalledOnce()
    expect(control.state.message).toContain('已发起下载')
    expect(control.state.message).not.toContain('下载完成')
  })
  it('retains selected files when a queued task is cancelled', async () => {
    mount(); await control.startSelection(); control.toggle(file('a'))
    mocks.post.mockResolvedValue(ok({ task: task('cancelled') }))
    await control.cancel(task())
    expect(control.state.selected).toHaveLength(1)
  })
})
