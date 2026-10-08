import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref, type App } from 'vue'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import Course from './Course.vue'
import type { CourseData } from '@/types/courseReview'

const mocks = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('@/lib/requests', () => ({ api: { get: mocks.get } }))
vi.mock('@/lib/useShadcnToast', () => ({ useShadcnToast: () => ({ error: vi.fn() }) }))
vi.mock('@/lib/useUser', () => ({ useUser: () => ({
  isLoggedIn: ref(true), userInfo: ref({ id: 2 }),
}) }))
vi.mock('@/components/courseReview/course/CourseMeta.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/courseReview/course/CourseTeachers.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/courseReview/course/CourseAlike.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/courseReview/course/CourseSkeleton.vue', () => ({ default: { render: () => h('div', 'course loading') } }))
vi.mock('@/components/courseReview/course/courseReviews/CourseReviewItem.vue', () => ({ default: defineComponent({
  props: ['review'], setup: props => () => h('p', { 'data-review': props.review.id }, props.review.content),
}) }))
vi.mock('@/components/courseReview/course/courseReviews/ReviewEditorModal.vue', () => ({ default: { render: () => h('textarea') } }))
vi.mock('@/components/layout/AppPageLayout.vue', () => ({ default: defineComponent({
  props: ['title'], setup: (props, { slots }) => () => h('main', [h('h1', props.title), slots.default?.()]),
}) }))
vi.mock('@/components/infoNErrors/404.vue', () => ({ default: { render: () => h('div', 'course missing') } }))
vi.mock('@/components/infoNErrors/500.vue', () => ({ default: { render: () => h('div', 'course failed') } }))

const response = (id = 42, page = 1, name = `Course ${id}`) => {
  const content: CourseData = {
    id, name, code: 'TEST', category: 'general', school: 'School', teachers: [], semester: [],
    like: { like: 0, dislike: 0, user_option: 0 }, rating_avg: '4', normalized_rating_avg: '4',
    request_user_review_id: null, request_user_review: null, total_review_count: 20, other_dup_name_course: [],
    reviews: { page, max_page: 2, count: 20, results: [{
      id: 9, is_deleted: false, content: 'existing review', rating: 4, modified_time: '', created_time: '', edited: false,
      like: { like: 0, dislike: 0, user_option: 0 }, difficulty: 3, grade: 3, homework: 3, reward: 3, semester: '2026 秋',
      author: { id: 2, nickname: 'Author', avatar: '', anonymous: false, is_student: false }, reply_count: 0, reply_next_cursor: null, reply: [],
    }], facets: {
      semesters: [{ semester_id: 7, semester__name: '2026 秋', count: 10 }], ratings: [{ rating: 5, count: 10 }],
    } },
  }
  return { status: 200, content }
}
const deferred = () => {
  let resolve!: (result: ReturnType<typeof response>) => void
  const promise = new Promise<ReturnType<typeof response>>(res => { resolve = res })
  return { resolve, promise }
}
const flush = async () => {
  await new Promise(resolve => setTimeout(resolve, 0))
  for (let i = 0; i < 8; i++) { await Promise.resolve(); await nextTick() }
}
let app: App | undefined
let container: HTMLDivElement
const originalScroll = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollIntoView')
const mount = async (path = '/review/course/42') => {
  const router = createRouter({ history: createMemoryHistory(), routes: [
    { path: '/review/course', component: { render: () => h('p', 'course directory') } },
    { path: '/review/course/:id', component: Course },
    { path: '/review/teacher/:id', component: { render: () => h('p', 'teacher detail') } },
  ] })
  await router.push(path)
  app = createApp(RouterView).use(router)
  app.mount(container)
  await flush()
  return router
}
const sortTrigger = () => container.querySelector<HTMLButtonElement>('button[aria-label^="排序: "]')!
const filterTrigger = (label: '学期' | '评分') => container.querySelector<HTMLElement>(`[role="combobox"][aria-label="${label}"]`)!
const key = async (element: HTMLElement, value: string) => {
  element.dispatchEvent(new KeyboardEvent('keydown', { key: value, code: value, bubbles: true, cancelable: true }))
  await flush()
}
const sortMenu = () => document.body.querySelector<HTMLElement>('[role="menu"]')!
const waitOptions = { timeout: 2_000, interval: 10 }
const waitForSortMenu = async () => {
  await vi.waitFor(() => expect(sortMenu()?.querySelector('[role="menuitemradio"]')).toBeTruthy(), waitOptions)
  return sortMenu()
}
const waitForFocus = async (element: HTMLElement) => {
  await vi.waitFor(() => expect(document.activeElement).toBe(element), waitOptions)
}
const waitForSortClosed = async (trigger: HTMLElement) => {
  // Reka returns focus in a timer after its portal unmounts. Wait for both
  // observable states instead of assuming that a fixed delay has completed it.
  await vi.waitFor(() => {
    expect(sortMenu()).toBeNull()
    expect(document.activeElement).toBe(trigger)
  }, waitOptions)
}
const selectSort = async (label: string) => {
  const trigger = sortTrigger()
  trigger.focus()
  await key(trigger, 'ArrowDown')
  const menu = await waitForSortMenu()
  const option = [...menu.querySelectorAll<HTMLElement>('[role="menuitemradio"]')]
    .find(item => item.textContent?.trim() === label)!
  option.focus()
  await waitForFocus(option)
  await key(option, 'Enter')
  await waitForSortClosed(trigger)
}
const selectFilter = async (label: '学期' | '评分', optionLabel: string) => {
  const trigger = filterTrigger(label)
  trigger.focus()
  await key(trigger, 'ArrowDown')
  let option: HTMLElement | undefined
  await vi.waitFor(() => {
    option = [...document.body.querySelectorAll<HTMLElement>('[data-shadcn-select-menu] [role="option"]')]
      .find(item => item.textContent?.trim() === optionLabel)
    expect(option).toBeDefined()
  }, waitOptions)
  if (!option) throw new Error(`Missing filter option: ${optionLabel}`)
  option.focus()
  await waitForFocus(option)
  await key(option, 'Enter')
  await vi.waitFor(() => expect(document.body.querySelector('[data-shadcn-select-menu]')).toBeNull(), waitOptions)
  await waitForFocus(trigger)
}
const expectControls = (sort: string, semester: string, rating: string) => {
  expect(sortTrigger().getAttribute('aria-label')).toBe(`排序: ${sort}`)
  expect(filterTrigger('学期').textContent).toContain(semester)
  expect(filterTrigger('评分').textContent).toContain(rating)
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
  Element.prototype.scrollIntoView = vi.fn()
  mocks.get.mockReset().mockResolvedValue(response())
  container = document.createElement('div')
  document.body.append(container)
})
afterEach(() => {
  app?.unmount()
  app = undefined
  container.remove()
  if (originalScroll) Object.defineProperty(Element.prototype, 'scrollIntoView', originalScroll)
  else Reflect.deleteProperty(Element.prototype, 'scrollIntoView')
  vi.unstubAllGlobals()
})

describe('course review query state', () => {
  it('selects sorting by keyboard, preserves both filters and restores focus after Escape', async () => {
    mocks.get.mockResolvedValue(response(42, 2))
    const router = await mount('/review/course/42?source=directory&page=2&semester=7&rating=5')
    const trigger = sortTrigger()
    trigger.focus()
    await key(trigger, 'Enter')
    const menu = await waitForSortMenu()
    const options = [...menu.querySelectorAll<HTMLElement>('[role="menuitemradio"]')]
    expect(options.map(option => option.textContent?.trim())).toEqual([
      '最多点赞', '最新点评', '最旧点评', '评分: 高-低', '评分: 低-高',
    ])
    expect(options[0].getAttribute('aria-checked')).toBe('true')
    await waitForFocus(options[0])
    await key(options[0], 'ArrowDown')
    await waitForFocus(options[1])
    await key(options[1], 'Enter')
    await waitForSortClosed(trigger)
    expect(router.currentRoute.value.query).toEqual({ source: 'directory', page: '1', semester: '7', rating: '5', sort: 'newest' })
    expect(mocks.get).toHaveBeenLastCalledWith(expect.objectContaining({ query: expect.objectContaining({
      page: 1, pageSize: 10, sort: 'newest', semester: 7, rating: 5,
    }) }))
    expectControls('最新点评', '2026 秋 (10)', '5 星 (10)')
    mocks.get.mockClear()
    await key(trigger, 'ArrowDown')
    const reopenedMenu = await waitForSortMenu()
    expect(reopenedMenu.querySelector('[aria-checked="true"]')?.textContent?.trim()).toBe('最新点评')
    await waitForFocus(reopenedMenu.querySelector<HTMLElement>('[role="menuitemradio"]')!)
    await key(document.activeElement as HTMLElement, 'End')
    const lastOption = [...reopenedMenu.querySelectorAll<HTMLElement>('[role="menuitemradio"]')].at(-1)!
    await waitForFocus(lastOption)
    expect(lastOption.textContent?.trim()).toBe('评分: 低-高')
    await key(document.activeElement as HTMLElement, 'Escape')
    await waitForSortClosed(trigger)
    expectControls('最新点评', '2026 秋 (10)', '5 星 (10)')
    expect(router.currentRoute.value.query.sort).toBe('newest')
    expect(mocks.get).not.toHaveBeenCalled()
  })

  it('clears either Shadcn filter independently while preserving sorting and unrelated URL state', async () => {
    const router = await mount('/review/course/42?source=directory&page=2&sort=highest&semester=7&rating=5')
    await selectFilter('学期', '全部学期')
    expect(router.currentRoute.value.query).toEqual({ source: 'directory', page: '1', sort: 'highest', rating: '5' })
    expectControls('评分: 高-低', '全部学期', '5 星 (10)')
    expect(mocks.get).toHaveBeenLastCalledWith(expect.objectContaining({ query: expect.objectContaining({
      page: 1, sort: 'highest', rating: 5,
    }) }))
    expect(mocks.get.mock.lastCall?.[0].query).not.toHaveProperty('semester')

    await router.push({ query: { ...router.currentRoute.value.query, semester: '7', page: '2' } })
    await flush()
    await selectFilter('评分', '全部评分')
    expect(router.currentRoute.value.query).toEqual({ source: 'directory', page: '1', sort: 'highest', semester: '7' })
    expectControls('评分: 高-低', '2026 秋 (10)', '全部评分')
    expect(mocks.get).toHaveBeenLastCalledWith(expect.objectContaining({ query: expect.objectContaining({
      page: 1, sort: 'highest', semester: 7,
    }) }))
    expect(mocks.get.mock.lastCall?.[0].query).not.toHaveProperty('rating')
  })

  it('preserves controls and the editor during refresh and keeps every filter on the next page', async () => {
    await mount()
    const toolbar = sortTrigger()
    const previousReview = container.querySelector('[data-review="9"]')
    const writeReview = [...container.querySelectorAll<HTMLButtonElement>('button')]
      .find(button => button.textContent?.trim() === '写下评价')!
    writeReview.click()
    await flush()
    const editor = container.querySelector('textarea')!
    editor.value = 'unfinished review'
    const pending = [deferred(), deferred(), deferred()]
    mocks.get.mockReturnValueOnce(pending[0].promise).mockReturnValueOnce(pending[1].promise).mockReturnValueOnce(pending[2].promise)
    await selectSort('最新点评')
    await selectFilter('学期', '2026 秋 (10)')
    await selectFilter('评分', '5 星 (10)')
    expect(sortTrigger()).toBe(toolbar)
    expect(container.querySelector('[data-review="9"]')).toBe(previousReview)
    expect(container.querySelector('textarea')).toBe(editor)
    expect(editor.value).toBe('unfinished review')
    expect(container.querySelector('section')?.getAttribute('aria-busy')).toBe('true')
    expect(mocks.get).toHaveBeenLastCalledWith(expect.objectContaining({ query: expect.objectContaining({
      page: 1, pageSize: 10, sort: 'newest', semester: 7, rating: 5,
    }) }))
    pending[2].resolve(response(42, 1, 'Newest result'))
    await flush()
    expect(container.querySelector('[data-review="9"]')).not.toBe(previousReview)
    expect(container.querySelector('textarea')).toBe(editor)
    pending[0].resolve({ ...response(42, 1, 'Obsolete result'), status: 404 })
    pending[1].resolve(response(42, 1, 'Obsolete result'))
    await flush()
    expect(container.textContent).toContain('Newest result')
    expect(document.title).toContain('Newest result')
    expect(container.textContent).not.toContain('course missing')
    expectControls('最新点评', '2026 秋 (10)', '5 星 (10)')
    mocks.get.mockResolvedValueOnce(response(42, 2))
    container.querySelector<HTMLButtonElement>('button[aria-label="下一页"]')!.click()
    await flush()
    expect(mocks.get).toHaveBeenLastCalledWith(expect.objectContaining({ query: expect.objectContaining({
      page: 2, pageSize: 10, sort: 'newest', semester: 7, rating: 5,
    }) }))
  })

  it('does not stop the latest loading state when an earlier filter request completes', async () => {
    await mount()
    const first = deferred()
    const last = deferred()
    mocks.get.mockReturnValueOnce(first.promise).mockReturnValueOnce(last.promise)
    await selectSort('最新点评')
    await selectFilter('评分', '5 星 (10)')
    first.resolve(response())
    await flush()
    expect(container.querySelector('section')?.getAttribute('aria-busy')).toBe('true')
    last.resolve(response())
    await flush()
    expect(container.querySelector('section')?.getAttribute('aria-busy')).toBe('false')
  })

  it('keeps filters for hash navigation and resets them when moving to another course', async () => {
    const router = await mount()
    await selectSort('评分: 高-低')
    await selectFilter('学期', '2026 秋 (10)')
    await router.push({ path: '/review/course/42', query: router.currentRoute.value.query, hash: '#review-9' })
    await flush()
    expect(mocks.get).toHaveBeenLastCalledWith(expect.objectContaining({ query: expect.objectContaining({
      sort: 'highest', semester: 7, focus_review_id: 9,
    }) }))
    const oldCourse = deferred()
    const newCourse = deferred()
    mocks.get.mockReturnValueOnce(oldCourse.promise).mockReturnValueOnce(newCourse.promise)
    await selectFilter('评分', '5 星 (10)')
    await router.push('/review/course/43')
    await flush()
    expect(container.textContent).toContain('course loading')
    expect(sortTrigger()).toBeNull()
    expect(container.querySelector('[role="combobox"]')).toBeNull()
    expect(mocks.get).toHaveBeenLastCalledWith(expect.objectContaining({
      params: { id: 43 }, query: { page: 1, pageSize: 10, sort: 'liked', focus_review_id: undefined, focus_reply_id: undefined },
    }))
    newCourse.resolve(response(43))
    oldCourse.resolve(response(42, 1, 'old course'))
    await flush()
    expect(container.textContent).toContain('Course 43')
    expectControls('最多点赞', '全部学期', '全部评分')
  })

  it('restores review filters and pagination after returning from a teacher page', async () => {
    const router = await mount()
    await selectSort('评分: 高-低')
    await selectFilter('学期', '2026 秋 (10)')
    await selectFilter('评分', '5 星 (10)')
    mocks.get.mockResolvedValue(response(42, 2))
    container.querySelector<HTMLButtonElement>('button[aria-label="下一页"]')!.click()
    await flush()
    expect(router.currentRoute.value.query).toEqual({ sort: 'highest', semester: '7', rating: '5', page: '2' })
    await router.push('/review/teacher/9')
    await new Promise<void>(resolve => { const stop = router.afterEach(() => { stop(); resolve() }); router.back() })
    await flush()
    expectControls('评分: 高-低', '2026 秋 (10)', '5 星 (10)')
    expect(mocks.get).toHaveBeenLastCalledWith(expect.objectContaining({ query: expect.objectContaining({
      page: 2, sort: 'highest', semester: 7, rating: 5,
    }) }))
    await new Promise<void>(resolve => { const stop = router.afterEach(() => { stop(); resolve() }); router.back() })
    await flush()
    expect(mocks.get).toHaveBeenLastCalledWith(expect.objectContaining({ query: expect.objectContaining({ page: 1 }) }))
  })
})
