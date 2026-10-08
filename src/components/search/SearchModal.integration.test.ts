import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, ref, type App } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import SearchModal from './SearchModal.vue'

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), checkLoginStatus: vi.fn(), error: vi.fn(), success: vi.fn() }))
vi.mock('@/lib/requests', () => ({ api: { get: mocks.get, post: mocks.post } }))
vi.mock('@/lib/logins', () => ({ checkLoginStatus: mocks.checkLoginStatus }))
vi.mock('@/lib/useShadcnToast', () => ({ useShadcnToast: () => ({ error: mocks.error, success: mocks.success }) }))

let app: App | undefined
let host: HTMLDivElement
let originalBodyStyle: string | null
let originalHtmlStyle: string | null
const flush = async () => {
  for (let index = 0; index < 15; index++) { await Promise.resolve(); await nextTick() }
}
const settle = async () => { await flush(); await vi.advanceTimersByTimeAsync(350); await flush() }
const dialog = (title: string) => [...document.body.querySelectorAll<HTMLElement>('[role="dialog"]')]
  .find(candidate => (candidate.getAttribute('aria-label') === title || candidate.querySelector('h2')?.textContent === title) && candidate.style.display !== 'none')!
const button = (target: HTMLElement, label: string) => [...target.querySelectorAll<HTMLButtonElement>('button')]
  .find(candidate => candidate.textContent?.trim() === label || candidate.getAttribute('aria-label') === label)!
const searchInput = () => dialog('全局搜索').querySelector<HTMLInputElement>('[aria-label="搜索关键词"]')!
const mount = async () => {
  const open = ref(false)
  const close = vi.fn(() => { open.value = false })
  const router = createRouter({ history: createMemoryHistory(), routes: [
    { path: '/', component: { render: () => null } },
    { path: '/review/course/:id', name: 'courseReviewItem', component: { render: () => null } },
  ] })
  await router.push('/')
  app = createApp({ render: () => h('div', [
    h('button', { id: 'open-search', onClick: () => { open.value = true } }, '打开全局搜索'),
    open.value ? h(SearchModal, { onClose: close }) : null,
  ]) }).use(router)
  app.mount(host)
  await flush()
  const trigger = host.querySelector<HTMLButtonElement>('#open-search')!
  trigger.focus()
  trigger.click()
  await settle()
  return { open, close, trigger }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.resetAllMocks()
  mocks.checkLoginStatus.mockResolvedValue(true)
  mocks.get.mockResolvedValue({ status: 200, data: { contents: { schools: [{ id: 1, name: '数学学院' }] } } })
  mocks.post.mockResolvedValue({ status: 200, content: {
    search_result: [], total_pages: 0, current_page: 1, has_next: false, has_previous: false, total_count: 0,
  } })
  originalBodyStyle = document.body.getAttribute('style')
  originalHtmlStyle = document.documentElement.getAttribute('style')
  document.body.style.overflow = 'auto'
  document.documentElement.style.overflow = 'scroll'
  host = document.createElement('div')
  document.body.append(host)
})
afterEach(() => {
  app?.unmount()
  app = undefined
  host.remove()
  if (originalBodyStyle === null) document.body.removeAttribute('style')
  else document.body.setAttribute('style', originalBodyStyle)
  if (originalHtmlStyle === null) document.documentElement.removeAttribute('style')
  else document.documentElement.setAttribute('style', originalHtmlStyle)
  vi.clearAllTimers()
  vi.useRealTimers()
})

describe('global search with the real modal and nested course dialog', () => {
  it('focuses the search field, traps focus, and restores the trigger and scroll lock on Escape', async () => {
    const { close, trigger } = await mount()
    expect(document.activeElement).toBe(searchInput())
    expect(document.documentElement.style.overflow).toBe('scroll')
    expect(document.body.style.overflow).toBe('hidden')
    trigger.focus()
    expect(dialog('全局搜索').contains(document.activeElement)).toBe(true)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }))
    await settle()
    expect(close).toHaveBeenCalledOnce()
    expect(dialog('全局搜索')).toBeUndefined()
    expect(document.activeElement).toBe(trigger)
    expect(document.documentElement.style.overflow).toBe('scroll')
    expect(document.body.style.overflow).toBe('auto')
  })

  it.each(['关闭搜索', '背景遮罩'])('closes through %s and restores focus', async (action) => {
    const { close, trigger } = await mount()
    if (action === '关闭搜索') button(dialog('全局搜索'), action).click()
    else document.body.querySelector<HTMLElement>('[data-shadcn-modal-overlay]')!.click()
    await settle()
    expect(close).toHaveBeenCalledOnce()
    expect(dialog('全局搜索')).toBeUndefined()
    expect(document.activeElement).toBe(trigger)
  })

  it('keeps the search query and parent focus when Escape closes only the nested course form', async () => {
    const { close, trigger } = await mount()
    const field = searchInput()
    field.value = '没有这个课程'
    field.dispatchEvent(new Event('input', { bubbles: true }))
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
    await settle()
    const addCourse = button(dialog('全局搜索'), '添加新课程')
    addCourse.focus()
    addCourse.click()
    await settle()
    expect(mocks.checkLoginStatus).toHaveBeenCalledOnce()
    const search = dialog('全局搜索')
    expect(search.getAttribute('aria-hidden')).toBe('true')
    expect(search.hasAttribute('inert')).toBe(true)
    const course = dialog('添加课程')
    expect(course).toBeDefined()
    expect(document.activeElement).toBe(course.querySelector('input'))
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }))
    await settle()
    expect(dialog('添加课程')).toBeUndefined()
    expect(close).not.toHaveBeenCalled()
    expect(searchInput().value).toBe('没有这个课程')
    expect(search.getAttribute('aria-hidden')).not.toBe('true')
    expect(search.hasAttribute('inert')).toBe(false)
    expect(document.activeElement).toBe(addCourse)
    expect(document.body.style.overflow).toBe('hidden')
    expect(mocks.post).toHaveBeenCalledOnce()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }))
    await settle()
    expect(close).toHaveBeenCalledOnce()
    expect(document.activeElement).toBe(trigger)
    expect(document.documentElement.style.overflow).toBe('scroll')
  })
})
