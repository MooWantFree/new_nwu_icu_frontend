import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, ref, type App } from 'vue'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import ResourceTools from './ResourceTools.vue'
import { api } from '@/lib/requests'
import type { AccessData } from '@/types/api/resourceTools'
import type { ManagedResourceFile } from '@/types/api/management'

vi.mock('@/lib/requests', () => ({ api: { get: vi.fn(), post: vi.fn() } }))
let app: App | undefined, host: HTMLDivElement, router: Router | undefined
const pathProp = ref('/')
const expired = vi.fn()
const originalScroll = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollIntoView')
const flush = async () => { for (let i = 0; i < 25; i++) { await Promise.resolve(); await nextTick() } }
const settle = async () => { await flush(); await vi.advanceTimersByTimeAsync(50); await flush() }
const button = (label: string) => [...host.querySelectorAll<HTMLButtonElement>('button')].find(item => item.getAttribute('aria-label') === label || item.textContent?.trim() === label)
const click = async (label: string) => { expect(button(label), label).toBeTruthy(); button(label)!.click(); await flush() }
const directoryList = () => host.querySelector('[aria-label="访问权限目录"]')!
const expectSelectedDirectory = (path: string) => expect(host.querySelector('[aria-label="当前目录访问权限"] p')?.textContent).toBe(`${path}（含全部子目录与文件）`)
const rule: AccessData['rules'] = [{ path: '/课程', mode: 'login' }, { path: '/课程/private', mode: 'admin' }, { path: '/课程/公开', mode: 'public' }]
const entry = (path: string, type: ManagedResourceFile['type'] = 'directory'): ManagedResourceFile => ({
  path, name: path.split('/').at(-1)!, type, size: type === 'file' ? 10 : null,
  modified_at: '2026-10-08T00:00:00Z', version: 'v1',
})
const entries: Record<string, ManagedResourceFile[]> = {
  '/': [entry('/课程'), entry('/课程库'), entry('/README.md', 'file')],
  '/课程': [entry('/课程/公开'), entry('/课程/private'), entry('/课程/README.md', 'file')],
  '/课程/private': [entry('/课程/private/child')],
  '/课程/private/child': [], '/课程/公开': [], '/课程库': [],
}
const accessContent = (path: string): AccessData => ({
  path, rules: rule,
  mode: path === '/课程' ? 'login' : path === '/课程/private' ? 'admin' : 'public',
  effective: path.startsWith('/课程/private') ? 'admin' : path === '/课程' || path.startsWith('/课程/') ? 'login' : 'public',
})
const accessResponse = (path: string) => ({ status: 200, content: accessContent(path) }) as never
const directoryResponse = (path: string) => ({ status: 200, content: { path, entries: entries[path] ?? [], max_file_size: 100, max_files: 20 } }) as never
const getResponse = async ({ url, query }: { url: string; query?: unknown }) => {
  const path = (query as { path?: string } | undefined)?.path || '/'
  if (url === '/api/management/resources/access/') return accessResponse(path)
  if (url === '/api/management/resources/') return directoryResponse(path)
  throw new Error(`Unexpected request: ${url}`)
}
async function mount(location?: string) {
  app = createApp({ render: () => h(ResourceTools, { path: pathProp.value, onSessionExpired: expired }) })
  if (location) {
    router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/manage/files', component: { render: () => null } }] })
    await router.push(location); await router.isReady(); app.use(router)
  }
  app.mount(host); await flush()
  if (!location) await click('访问权限')
}
async function selectMode(label: string) {
  const trigger = host.querySelector<HTMLElement>('[role="combobox"][aria-label="目录规则"]')!
  expect(trigger).toBeTruthy()
  trigger.focus(); trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })); await settle()
  const option = [...document.body.querySelectorAll<HTMLElement>('[role="option"]')].find(item => item.textContent?.trim() === label)!
  expect(option).toBeTruthy()
  option.focus(); option.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })); await settle()
}
beforeEach(() => {
  vi.resetAllMocks(); vi.useFakeTimers(); router = undefined; pathProp.value = '/'
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
  Element.prototype.scrollIntoView = vi.fn()
  host = document.createElement('div'); document.body.append(host)
  vi.mocked(api.get).mockImplementation(getResponse)
  vi.mocked(api.post).mockResolvedValue({ status: 200, content: { effective: 'login' } } as never)
})
afterEach(() => {
  app?.unmount(); app = undefined; host.remove()
  if (originalScroll) Object.defineProperty(Element.prototype, 'scrollIntoView', originalScroll)
  else Reflect.deleteProperty(Element.prototype, 'scrollIntoView')
  vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals()
})

describe('access permission directory browsing', () => {
  it('lists only directories and displays the selected directory effective permission returned by the server', async () => {
    vi.mocked(api.get).mockImplementation(async request => request.url === '/api/management/resources/access/' && (request.query as unknown as { path: string }).path === '/课程'
      ? { status: 200, content: { ...accessContent('/课程'), effective: 'admin' } } as never : getResponse(request))
    await mount()
    expect(api.get).toHaveBeenCalledWith({ url: '/api/management/resources/', query: { path: '/' } })
    expect(directoryList().textContent).toContain('课程')
    expect(directoryList().textContent).not.toContain('README.md')
    expect(button('进入目录 课程')).toBeTruthy()
    expect(button('进入目录 课程库')).toBeTruthy()
    await click('进入目录 课程')
    expect(host.textContent).toContain('当前实际权限：仅资料管理员')
    expect(host.querySelector('[role="combobox"]')!.textContent).toContain('仅登录用户')
    expect(directoryList().textContent).not.toContain('README.md')
  })

  it('navigates locally through child, parent and root directories and refreshes the current permission target', async () => {
    await mount(); expect(button('上一级')!.disabled).toBe(true)
    await click('进入目录 课程'); await click('进入目录 private')
    expectSelectedDirectory('/课程/private')
    await click('上一级'); expectSelectedDirectory('/课程')
    await click('根目录'); expectSelectedDirectory('/')
    expect(button('上一级')!.disabled).toBe(true)
    vi.mocked(api.get).mockClear(); await click('刷新访问权限')
    expect(api.get).toHaveBeenCalledTimes(2)
    expect(api.get).toHaveBeenCalledWith({ url: '/api/management/resources/access/', query: { path: '/' } })
    expect(api.get).toHaveBeenCalledWith({ url: '/api/management/resources/', query: { path: '/' } })
  })

  it('loads a directory deep link and restores permission selection with browser history without losing unrelated state', async () => {
    await mount('/manage/files?view=maintenance&tool=access&path=/课程&next=/admin/&filter=pdf#权限')
    expect(api.get).toHaveBeenCalledWith({ url: '/api/management/resources/access/', query: { path: '/课程' } })
    expect(host.querySelector('[role="combobox"]')!.textContent).toContain('仅登录用户')
    await click('进入目录 private')
    expect(router!.currentRoute.value.query).toEqual({ view: 'maintenance', tool: 'access', path: '/课程/private', next: '/admin/', filter: 'pdf' })
    expect(router!.currentRoute.value.hash).toBe('#权限')
    expect(host.querySelector('[role="combobox"]')!.textContent).toContain('仅资料管理员')
    router!.back(); await flush()
    expect(router!.currentRoute.value.query.path).toBe('/课程')
    expect(host.querySelector('[role="combobox"]')!.textContent).toContain('仅登录用户')
    router!.forward(); await flush()
    expectSelectedDirectory('/课程/private')
  })

  it('allows browsing a saved restriction even when its directory is not in the currently displayed list', async () => {
    await mount()
    await click('查看权限 /课程/private')
    expect(api.get).toHaveBeenCalledWith({ url: '/api/management/resources/access/', query: { path: '/课程/private' } })
    expect(directoryList().textContent).toContain('child')
    expectSelectedDirectory('/课程/private')
  })

  it('synchronizes non-router prop changes before writing a directory rule', async () => {
    await mount(); pathProp.value = '/课程'; await flush()
    expectSelectedDirectory('/课程')
    await selectMode('仅资料管理员'); await click('保存访问权限')
    expect(api.post).toHaveBeenCalledExactlyOnceWith({ url: '/api/management/resources/access/', query: { path: '/课程', mode: 'admin' } })
    expect(api.get).toHaveBeenCalledWith({ url: '/api/management/resources/access/', query: { path: '/课程' } })
  })

  it('binds a pending save to its original directory and reloads a history destination after it settles', async () => {
    await mount('/manage/files?view=maintenance&tool=access&path=/课程')
    await selectMode('仅资料管理员')
    let finish!: (value: never) => void
    vi.mocked(api.post).mockReturnValueOnce(new Promise(resolve => { finish = resolve }))
    await click('保存访问权限')
    expect(button('进入目录 private')!.disabled).toBe(true)
    expect(host.querySelector<HTMLFieldSetElement>('fieldset')!.disabled).toBe(true)
    await router!.push('/manage/files?view=maintenance&tool=access&path=/课程库'); await flush()
    finish({ status: 200, content: { effective: 'admin' } } as never); await flush()
    expect(api.post).toHaveBeenCalledExactlyOnceWith({ url: '/api/management/resources/access/', query: { path: '/课程', mode: 'admin' } })
    expectSelectedDirectory('/课程库')
    expect(host.textContent).not.toContain('访问权限已保存。')
  })

  it.each(['/api/management/resources/', '/api/management/resources/access/'])('clears stale controls when %s fails and reloads both endpoints when retried', async endpoint => {
    await mount()
    vi.mocked(api.get).mockImplementation(async request => request.url === endpoint && (request.query as unknown as { path: string }).path === '/课程'
      ? { status: 500, errors: [{ err_msg: '目录读取失败' }] } as never : getResponse(request))
    await click('进入目录 课程')
    expect(host.querySelector('[role="alert"]')!.textContent).toContain('目录读取失败')
    expect(host.querySelector('[role="combobox"]')).toBeNull()
    expect(button('保存访问权限')).toBeUndefined()
    expect(button('进入目录 private')).toBeUndefined()
    expect(api.post).not.toHaveBeenCalled()
    vi.mocked(api.get).mockImplementation(getResponse)
    await click('重新加载目录')
    expect(host.querySelector('[role="combobox"]')!.textContent).toContain('仅登录用户')
    expect(button('进入目录 private')).toBeTruthy()
    expect(host.querySelector('[role="alert"]')).toBeNull()
  })

  it('requests renewed authorization when the directory endpoint forbids browsing and keeps rule writes unavailable', async () => {
    vi.mocked(api.get).mockImplementation(async request => request.url === '/api/management/resources/'
      ? { status: 403, errors: [{ err_msg: '请重新验证管理权限' }] } as never : getResponse(request))
    await mount()
    expect(expired).toHaveBeenCalledOnce()
    expect(host.querySelector('[role="alert"]')!.textContent).toContain('请重新验证管理权限')
    expect(host.querySelector('[role="combobox"]')).toBeNull()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('ignores a slow directory response after a history change and displays the latest target', async () => {
    let finish!: (value: never) => void
    await mount('/manage/files?view=maintenance&tool=access&path=/课程')
    vi.mocked(api.get).mockImplementation(async request => request.url === '/api/management/resources/' && (request.query as unknown as { path: string }).path === '/课程/private'
      ? new Promise(resolve => { finish = resolve }) : getResponse(request))
    await click('进入目录 private')
    expect(host.querySelector('[role="combobox"]')).toBeNull()
    router!.back(); await flush()
    finish(directoryResponse('/课程/private')); await flush()
    expect(router!.currentRoute.value.query.path).toBe('/课程')
    expectSelectedDirectory('/课程')
    expect(button('进入目录 公开')).toBeTruthy()
    expect(button('进入目录 child')).toBeUndefined()
  })
})
