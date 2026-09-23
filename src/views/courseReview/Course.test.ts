import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref, type App } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import Course from './Course.vue'
import type { CourseData } from '@/types/courseReview'

const mocks = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('@/lib/requests', () => ({ api: { get: mocks.get } }))
vi.mock('naive-ui', () => ({ useMessage: () => ({ error: vi.fn() }) }))
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
  for (let i = 0; i < 8; i++) { await Promise.resolve(); await nextTick() }
}
let app: App | undefined
let container: HTMLDivElement
const mount = async () => {
  const router = createRouter({ history: createMemoryHistory(), routes: [
    { path: '/review/course/:id', component: Course },
  ] })
  await router.push('/review/course/42')
  app = createApp(Course).use(router)
  app.component('NPagination', defineComponent({
    props: ['page'], emits: ['update:page'],
    setup: (_props, { emit }) => () => h('button', { 'data-next-page': '', onClick: () => emit('update:page', 2) }, 'page 2'),
  }))
  app.mount(container)
  await flush()
  return router
}
const select = async (index: number, value: string) => {
  const element = container.querySelectorAll('select')[index]
  element.value = value
  element.dispatchEvent(new Event('change', { bubbles: true }))
  await flush()
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.get.mockReset().mockResolvedValue(response())
  container = document.createElement('div')
  document.body.append(container)
})
afterEach(() => {
  app?.unmount()
  app = undefined
  container.remove()
})

describe('course review query state', () => {
  it('preserves controls and the editor during refresh and keeps every filter on the next page', async () => {
    await mount()
    const toolbar = container.querySelector('select')
    const previousReview = container.querySelector('[data-review="9"]')
    const writeReview = [...container.querySelectorAll<HTMLButtonElement>('button')]
      .find(button => button.textContent?.trim() === '写下评价')!
    writeReview.click()
    await flush()
    const editor = container.querySelector('textarea')!
    editor.value = 'unfinished review'
    const pending = [deferred(), deferred(), deferred()]
    mocks.get.mockReturnValueOnce(pending[0].promise).mockReturnValueOnce(pending[1].promise).mockReturnValueOnce(pending[2].promise)
    await select(0, 'newest')
    await select(1, '7')
    await select(2, '5')
    expect(container.querySelector('select')).toBe(toolbar)
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
    expect([...container.querySelectorAll('select')].map(element => element.value)).toEqual(['newest', '7', '5'])
    mocks.get.mockResolvedValueOnce(response(42, 2))
    container.querySelector<HTMLButtonElement>('[data-next-page]')!.click()
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
    await select(0, 'newest')
    await select(2, '5')
    first.resolve(response())
    await flush()
    expect(container.querySelector('section')?.getAttribute('aria-busy')).toBe('true')
    last.resolve(response())
    await flush()
    expect(container.querySelector('section')?.getAttribute('aria-busy')).toBe('false')
  })

  it('keeps filters for hash navigation and resets them when moving to another course', async () => {
    const router = await mount()
    await select(0, 'highest')
    await select(1, '7')
    await router.push('/review/course/42#review-9')
    await flush()
    expect(mocks.get).toHaveBeenLastCalledWith(expect.objectContaining({ query: expect.objectContaining({
      sort: 'highest', semester: 7, focus_review_id: 9,
    }) }))
    const oldCourse = deferred()
    const newCourse = deferred()
    mocks.get.mockReturnValueOnce(oldCourse.promise).mockReturnValueOnce(newCourse.promise)
    await select(2, '5')
    await router.push('/review/course/43')
    await flush()
    expect(container.textContent).toContain('course loading')
    expect(container.querySelector('select')).toBeNull()
    expect(mocks.get).toHaveBeenLastCalledWith(expect.objectContaining({
      params: { id: 43 }, query: { page: 1, pageSize: 10, sort: 'liked', focus_review_id: undefined, focus_reply_id: undefined },
    }))
    newCourse.resolve(response(43))
    oldCourse.resolve(response(42, 1, 'old course'))
    await flush()
    expect(container.textContent).toContain('Course 43')
    expect([...container.querySelectorAll('select')].map(element => element.value)).toEqual(['liked', 'all', '0'])
  })
})
