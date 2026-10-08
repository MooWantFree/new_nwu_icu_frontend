import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, ref, type App } from 'vue'
import { createMemoryHistory, createRouter, RouterView, type Router } from 'vue-router'
import ResourceReadmeEditor from './ResourceReadmeEditor.vue'
import { api } from '@/lib/requests'

vi.mock('@/lib/requests', () => ({ api: { get: vi.fn(), post: vi.fn() } }))
let app: App, host: HTMLDivElement, router: Router | undefined
const editor = ref<InstanceType<typeof ResourceReadmeEditor>>()
const currentPath = ref('/')
const expired = vi.fn(), changed = vi.fn()
const flush = async () => { for (let i = 0; i < 20; i++) { await Promise.resolve(); await nextTick() } }
const settle = async () => { await flush(); await vi.advanceTimersByTimeAsync(50); await flush() }
const panel = () => document.body.querySelector<HTMLElement>('[role="dialog"][aria-label="编辑目录说明"]')!
const confirmation = () => [...document.body.querySelectorAll<HTMLElement>('[role="dialog"]')].at(-1)!
const field = () => panel().querySelector<HTMLTextAreaElement>('[aria-label="目录说明 Markdown"]')!
const click = async (label: string, target: ParentNode = panel()) => {
  const button = [...target.querySelectorAll<HTMLButtonElement>('button')].find(item => item.textContent?.trim() === label)!
  expect(button).toBeTruthy(); button.click(); await settle()
}
const changeDraft = async (value: string) => { field().value = value; field().dispatchEvent(new Event('input')); await settle() }
async function mount(routed = false) {
  const page = { render: () => h(ResourceReadmeEditor, { ref: editor, path: currentPath.value, onSessionExpired: expired, onChanged: changed }) }
  if (routed) {
    router = createRouter({ history: createMemoryHistory(), routes: [
      { path: '/manage/:section', component: page }, { path: '/other', component: { render: () => h('p', '其他页面') } },
    ] })
    await router.push('/manage/reports'); await router.push('/manage/files'); await router.isReady()
    app = createApp({ render: () => h(RouterView) }).use(router)
  } else app = createApp(page)
  app.mount(host); await settle()
}
beforeEach(() => {
  vi.resetAllMocks(); vi.useFakeTimers(); currentPath.value = '/'; router = undefined; editor.value = undefined
  host = document.createElement('div'); document.body.append(host)
  vi.mocked(api.get).mockImplementation(async ({ query }) => ({ status: 200, content: { path: (query as unknown as { path: string }).path, content: '# 原说明', version: 'v1', warning: '' } }) as never)
})
afterEach(() => { app?.unmount(); host.remove(); vi.clearAllTimers(); vi.useRealTimers() })

describe('README edit dialog', () => {
  it('loads only when opened, sanitizes preview, and saves an existing draft with its original directory and version', async () => {
    await mount()
    expect(api.get).not.toHaveBeenCalled()
    expect(document.body.querySelector('[role="dialog"]')).toBeNull()
    await editor.value!.open(); await settle()
    await changeDraft('# 新说明\n<script>alert(1)</script>')
    expect(panel().querySelector('[aria-label="目录说明预览"] h1')?.textContent).toBe('新说明')
    expect(panel().querySelector('[aria-label="目录说明预览"] script')).toBeNull()
    currentPath.value = '/其他'; await settle()
    expect(panel().textContent).toContain('当前保留的是 / 的草稿')
    const content = field().value
    vi.mocked(api.post).mockResolvedValueOnce({ status: 200, content: { path: '/', content, version: 'v2', warning: '' } } as never)
    await click('保存目录说明')
    expect(api.post).toHaveBeenCalledWith({ url: '/api/management/resources/readme/', query: { path: '/', version: 'v1', content } })
    expect(changed).toHaveBeenCalledOnce()
    expect(panel().querySelector('[role="status"]')?.textContent).toContain('目录说明已保存')
  })
  it('preserves a conflicting draft and its beforeunload protection instead of overwriting it', async () => {
    await mount(); await editor.value!.open(); await settle(); await changeDraft('草稿')
    vi.mocked(api.post).mockResolvedValueOnce({ status: 409, errors: [{ err_msg: '说明已被修改' }] } as never)
    await click('保存目录说明')
    expect(field().value).toBe('草稿')
    expect(panel().querySelector('[role="alert"]')?.textContent).toContain('说明已被修改')
    const leaving = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(leaving)
    expect(leaving.defaultPrevented).toBe(true)
    expect(changed).not.toHaveBeenCalled()
  })
  it('prevents editing or saving a README that was not safely loaded', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ status: 200, content: { path: '/', content: '', version: '', warning: '目录说明过大，未加载原文件' } } as never)
    await mount(); await editor.value!.open(); await settle()
    expect(field().disabled).toBe(true)
    const save = [...panel().querySelectorAll<HTMLButtonElement>('button')].find(item => item.textContent?.trim() === '保存目录说明')!
    expect(save.disabled).toBe(true); save.click(); await settle()
    expect(api.post).not.toHaveBeenCalled()
    expect(panel().textContent).toContain('避免覆盖未加载的内容')
  })
  it('asks before discarding on close, retains a cancelled draft, then closes and clears protection after confirmation', async () => {
    await mount(); await editor.value!.open(); await settle(); await changeDraft('未保存的内容')
    panel().querySelector<HTMLButtonElement>('[aria-label="关闭目录说明编辑器"]')!.click(); await settle()
    expect(confirmation().textContent).toContain('放弃目录说明草稿？')
    await click('保留草稿', confirmation())
    expect(document.body.querySelectorAll('[role="dialog"]')).toHaveLength(1)
    expect(field().value).toBe('未保存的内容')
    panel().querySelector<HTMLButtonElement>('[aria-label="关闭目录说明编辑器"]')!.click(); await settle()
    await click('放弃并关闭', confirmation())
    expect(document.body.querySelector('[role="dialog"]')).toBeNull()
    const leaving = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(leaving)
    expect(leaving.defaultPrevented).toBe(false)
    expect(api.post).not.toHaveBeenCalled()
  })
  it('blocks closing by Escape, mask, or close button while saving', async () => {
    await mount(); await editor.value!.open(); await settle(); await changeDraft('保存中')
    let finish!: (value: never) => void
    vi.mocked(api.post).mockReturnValueOnce(new Promise(resolve => { finish = resolve }))
    await click('保存目录说明')
    expect(panel().querySelector<HTMLButtonElement>('[aria-label="关闭目录说明编辑器"]')!.disabled).toBe(true)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })); await settle()
    document.body.querySelector<HTMLElement>('[data-shadcn-modal-overlay]')!.click(); await settle()
    expect(panel()).not.toBeNull()
    finish({ status: 200, content: { path: '/', content: '保存中', version: 'v2', warning: '' } } as never); await settle()
    panel().querySelector<HTMLButtonElement>('[aria-label="关闭目录说明编辑器"]')!.click(); await settle()
    expect(document.body.querySelector('[role="dialog"]')).toBeNull()
  })
  it('keeps the discard confirmation open while a confirmed reload is pending', async () => {
    await mount(); await editor.value!.open(); await settle(); await changeDraft('草稿')
    await click('放弃草稿并重新加载')
    let finish!: (value: never) => void
    vi.mocked(api.get).mockReturnValueOnce(new Promise(resolve => { finish = resolve }))
    await click('放弃并重新加载', confirmation())
    const keep = [...confirmation().querySelectorAll<HTMLButtonElement>('button')].find(item => item.textContent?.trim() === '保留草稿')!
    expect(keep.disabled).toBe(true)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })); await settle()
    ;[...document.body.querySelectorAll<HTMLElement>('[data-shadcn-modal-overlay]')].at(-1)!.click(); await settle()
    expect(document.body.querySelectorAll('[role="dialog"]')).toHaveLength(2)
    finish({ status: 200, content: { path: '/', content: '# 最新说明', version: 'v2', warning: '' } } as never); await settle()
    expect(document.body.querySelectorAll('[role="dialog"]')).toHaveLength(1)
    expect(field().value).toBe('# 最新说明')
  })
  it('requests management authorization again and offers reload when README access expires', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ status: 403, errors: [{ err_msg: '请验证 Passkey' }] } as never)
    await mount(); await editor.value!.open(); await settle()
    expect(expired).toHaveBeenCalledOnce()
    expect(panel().querySelector('[role="alert"]')?.textContent).toContain('请验证 Passkey')
    await click('重新加载')
    expect(field().value).toBe('# 原说明')
  })
  it('protects unsaved edits when switching management routes and resumes navigation only after confirmation', async () => {
    await mount(true); await editor.value!.open(); await settle(); await changeDraft('导航中的草稿')
    const navigation = router!.push('/manage/reports'); await settle()
    expect(router!.currentRoute.value.path).toBe('/manage/files')
    expect(confirmation().textContent).toContain('离开当前页面')
    await click('保留草稿', confirmation()); await navigation
    expect(router!.currentRoute.value.path).toBe('/manage/files')
    expect(field().value).toBe('导航中的草稿')
    const leaving = router!.push('/other'); await settle()
    await click('放弃并离开', confirmation()); await leaving; await settle()
    expect(router!.currentRoute.value.path).toBe('/other')
    expect(document.body.querySelector('[role="dialog"]')).toBeNull()
    expect(api.post).not.toHaveBeenCalled()
  })
  it('guards browser history while dirty and prevents leaving during an in-flight save', async () => {
    await mount(true); await editor.value!.open(); await settle(); await changeDraft('后退中的草稿')
    router!.back(); await settle()
    expect(router!.currentRoute.value.path).toBe('/manage/files')
    await click('保留草稿', confirmation()); await settle()
    expect(router!.currentRoute.value.path).toBe('/manage/files')
    let finish!: (value: never) => void
    vi.mocked(api.post).mockReturnValueOnce(new Promise(resolve => { finish = resolve }))
    await click('保存目录说明')
    await router!.push('/other'); await settle()
    expect(router!.currentRoute.value.path).toBe('/manage/files')
    expect(document.body.querySelectorAll('[role="dialog"]')).toHaveLength(1)
    finish({ status: 200, content: { path: '/', content: '后退中的草稿', version: 'v2', warning: '' } } as never); await settle()
    await router!.push('/other'); await settle()
    expect(router!.currentRoute.value.path).toBe('/other')
  })
})
