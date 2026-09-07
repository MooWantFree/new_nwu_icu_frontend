import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick, type App } from 'vue'
import ResourceUploadBlacklist from './ResourceUploadBlacklist.vue'
import { api } from '@/lib/requests'

vi.mock('@/lib/requests', () => ({ api: { get: vi.fn(), post: vi.fn() } }))

let app: App
let container: HTMLDivElement
const flush = async () => {
  for (let i = 0; i < 10; i += 1) { await Promise.resolve(); await nextTick() }
}
const button = (label: string) => container.querySelector(`[aria-label="${label}"]`) as HTMLButtonElement | null
const mount = async () => { app = createApp(ResourceUploadBlacklist); app.mount(container); await flush() }

beforeEach(() => {
  vi.resetAllMocks()
  container = document.createElement('div')
  document.body.append(container)
  vi.mocked(api.get).mockImplementation(async ({ url, query }) => {
    if (url === '/api/management/uploads/blacklist/') return { status: 200, content: { paths: ['/private'] } } as never
    const path = (query as unknown as { path: string }).path
    return { status: 200, content: {
      path, updated_at: null,
      directories: path === '/' ? [{ name: 'private', path: '/private' }, { name: 'public', path: '/public' }] : [{ name: 'child', path: '/private/child' }],
    } } as never
  })
})
afterEach(() => { app?.unmount(); container.remove() })

describe('upload directory blacklist management', () => {
  it('browses the complete admin directory tree including blocked folders', async () => {
    await mount()
    expect(button('解除黑名单 /private')).not.toBeNull()
    const directory = [...container.querySelectorAll('button')].find(item => item.textContent?.trim() === 'private')!
    directory.click()
    await flush()
    expect(api.get).toHaveBeenCalledWith({ url: '/api/management/uploads/directories/', query: { path: '/private' } })
    expect(container.textContent).toContain('父文件夹已拉黑')
    expect(button('拉黑 /private/child')).toBeNull()
  })

  it('adds and removes a folder and renders the saved blacklist', async () => {
    await mount()
    vi.mocked(api.post).mockResolvedValueOnce({ status: 200, content: { paths: ['/private', '/public'] } } as never)
    button('拉黑 /public')!.click()
    await flush()
    expect(api.post).toHaveBeenCalledWith({ url: '/api/management/uploads/blacklist/', query: { path: '/public', action: 'add' } })
    expect(button('解除黑名单 /public')).not.toBeNull()
    expect(button('拉黑 /public')).toBeNull()
    vi.mocked(api.post).mockResolvedValueOnce({ status: 200, content: { paths: ['/private'] } } as never)
    button('解除黑名单 /public')!.click()
    await flush()
    expect(button('拉黑 /public')).not.toBeNull()
    expect(button('解除黑名单 /public')).toBeNull()
  })

  it('keeps the saved state and displays the error when a change fails', async () => {
    await mount()
    vi.mocked(api.post).mockResolvedValueOnce({ status: 500, errors: [{ err_msg: '保存失败' }] } as never)
    button('解除黑名单 /private')!.click()
    await flush()
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('保存失败')
    expect(button('解除黑名单 /private')).not.toBeNull()
    expect(container.querySelector('[role="status"]')).toBeNull()
  })
})
