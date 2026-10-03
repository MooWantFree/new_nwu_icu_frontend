import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, type App } from 'vue'
import { createMemoryHistory, createRouter, RouterView, type Router } from 'vue-router'
import Teacher from './Teacher.vue'
import CourseList from './CourseList.vue'
import ReviewTimeline from './ReviewTimeline.vue'

const mocks = vi.hoisted(() => ({ get: vi.fn(), error: vi.fn() }))
vi.mock('@/lib/requests', () => ({ api: { get: mocks.get } }))
vi.mock('naive-ui', () => ({ useMessage: () => ({ error: mocks.error }) }))
vi.mock('@/lib/logins', () => ({ checkLoginStatus: vi.fn() }))
vi.mock('@/components/courseReview/course/AddCourseModal.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/courseReview/ReviewDirectoryNav.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/courseReview/teacher/TeacherSkeleton.vue', () => ({ default: { render: () => h('p', 'teacher loading') } }))
vi.mock('@/components/infoNErrors/404.vue', () => ({ default: { render: () => h('p', 'teacher missing') } }))
vi.mock('@/components/infoNErrors/500.vue', () => ({ default: { render: () => h('p', 'teacher failed') } }))
vi.mock('@/components/courseReview/timeline/ReviewItemSkeleton.vue', () => ({ default: { render: () => h('p', 'review loading') } }))
vi.mock('@/components/courseReview/timeline/ReviewItem.vue', () => ({ default: defineComponent({
  props: ['review'], setup: props => () => h('p', props.review.content),
}) }))
vi.mock('@/components/layout/AppPageLayout.vue', () => ({ default: defineComponent({
  setup: (_props, { slots }) => () => h('main', [slots.meta?.(), slots.default?.()]),
}) }))

const teacherResponse = (id: number, name: string) => ({ status: 200, content: {
  teacher_info: { id, name, school: 'School' },
  course_list: [{ course: { id, name: `${name}的课程`, semester: '', code: '' },
    rating_avg: 4, normalized_rating_avg: 4, review_count: 1 }],
} })
const courseResponse = (name = '英美诗歌选读', count = 4) => ({ status: 200, content: {
  count, max_page: 2, page: 1, results: [{ id: 42, name, classification: 'english',
    teacher: 'Teacher', semester: '', review_count: 1, average_rating: 4, normalized_rating: 4 }],
} })
const reviewResponse = (page: number, size = 8) => ({ status: 200, content: {
  count: 100, results: [{ id: page, content: `评价第${page}页，每页${size}条` }],
} })
const deferred = () => {
  let resolve!: (value: unknown) => void
  let reject!: (error: Error) => void
  const promise = new Promise((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}
const flush = async () => {
  await new Promise(resolve => setTimeout(resolve, 0))
  for (let i = 0; i < 12; i++) { await Promise.resolve(); await nextTick() }
}
let app: App | undefined
let container: HTMLDivElement
const mount = async (path: string) => {
  const router = createRouter({ history: createMemoryHistory(), routes: [
    { path: '/review/teacher/:id', component: Teacher },
    { path: '/review/course', component: CourseList },
    { path: '/review/teacher', component: { render: () => null } },
    { path: '/review/course/:id', component: { render: () => h('p', 'course detail') } },
    { path: '/review/timeline', component: ReviewTimeline },
  ] })
  await router.push(path)
  app = createApp(RouterView).use(router)
  app.component('NRate', { render: () => null })
  app.component('NPagination', defineComponent({
    props: ['page', 'pageSize'], emits: ['update:page', 'update:page-size'],
    setup: (props, { emit }) => () => h('nav', [
      h('span', { 'data-page': '' }, `${props.page}/${props.pageSize}`),
      h('button', { 'data-page-two': '', onClick: () => emit('update:page', 2) }, '第2页'),
      h('button', { 'data-size-twenty': '', onClick: () => emit('update:page-size', 20) }, '每页20条'),
    ]),
  }))
  app.mount(container)
  await flush()
  return router
}
const travel = async (router: Router, direction: number) => {
  await new Promise<void>(resolve => {
    const remove = router.afterEach(() => { remove(); resolve() })
    router.go(direction)
  })
  await flush()
}
const select = async (index: number, value: string) => {
  const element = container.querySelectorAll('select')[index]
  element.value = value
  element.dispatchEvent(new Event('change', { bubbles: true }))
  await flush()
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.get.mockReset()
  container = document.createElement('div')
  document.body.append(container)
})
afterEach(() => { app?.unmount(); app = undefined; container.remove() })

describe('review navigation', () => {
  it('loads a new teacher in the reused view and restores the previous teacher on back', async () => {
    mocks.get.mockImplementation(({ params }) => Promise.resolve(teacherResponse(params.id, params.id === 172 ? '许永峰' : '马珂琦')))
    const router = await mount('/review/teacher/172')
    expect(container.textContent).toContain('许永峰的课程')
    await router.push('/review/teacher/1501')
    await flush()
    expect(container.textContent).toContain('马珂琦的课程')
    expect(container.textContent).not.toContain('许永峰')
    await travel(router, -1)
    expect(container.textContent).toContain('许永峰的课程')
    expect(mocks.get).toHaveBeenCalledTimes(3)
  })

  it('clears teacher errors on navigation and ignores responses for older teacher IDs', async () => {
    mocks.get.mockResolvedValueOnce({ status: 404 })
    const router = await mount('/review/teacher/172')
    expect(container.textContent).toContain('teacher missing')
    const old = deferred()
    const latest = deferred()
    mocks.get.mockReturnValueOnce(old.promise).mockReturnValueOnce(latest.promise)
    await router.push('/review/teacher/1501')
    await router.push('/review/teacher/1502')
    await flush()
    old.resolve(teacherResponse(1501, '旧教师'))
    await flush()
    expect(container.textContent).toContain('teacher loading')
    expect(container.textContent).not.toContain('旧教师')
    latest.resolve(teacherResponse(1502, '新教师'))
    await flush()
    expect(container.textContent).toContain('新教师的课程')
    expect(container.textContent).not.toContain('teacher missing')
  })

  it('restores course type, sorting, page and results after returning from a course', async () => {
    mocks.get.mockResolvedValue(courseResponse())
    const router = await mount('/review/course?source=directory')
    await select(0, 'english')
    await select(1, 'popular')
    container.querySelector<HTMLButtonElement>('[data-page-two]')!.click()
    await flush()
    expect(router.currentRoute.value.query).toEqual({ source: 'directory', course_type: 'english', order_by: 'popular', page: '2' })
    container.querySelector<HTMLAnchorElement>('a[href="/review/course/42"]')!.click()
    await flush()
    expect(container.textContent).toContain('course detail')
    await travel(router, -1)
    expect([...container.querySelectorAll('select')].map(el => el.value)).toEqual(['english', 'popular'])
    expect(container.querySelector('[data-page]')?.textContent).toContain('2/')
    expect(container.textContent).toContain('共 4 门课程')
    expect(container.textContent).toContain('英美诗歌选读')
    expect(mocks.get).toHaveBeenLastCalledWith(expect.objectContaining({ query: { course_type: 'english', order_by: 'popular', page: 2, pageSize: 12 } }))
    await select(0, 'pe')
    expect(router.currentRoute.value.query.page).toBe('1')
    await travel(router, -1)
    expect(container.querySelector('select')?.value).toBe('english')
    expect(container.querySelector('[data-page]')?.textContent).toContain('2/')
  })

  it('ignores stale course results and errors after changing filters', async () => {
    mocks.get.mockResolvedValueOnce(courseResponse())
    await mount('/review/course')
    const old = deferred()
    const latest = deferred()
    mocks.get.mockReturnValueOnce(old.promise).mockReturnValueOnce(latest.promise)
    await select(0, 'english')
    await select(0, 'pe')
    latest.resolve(courseResponse('体育课程', 8))
    await flush()
    old.reject(new Error('old request failed'))
    await flush()
    expect(container.textContent).toContain('体育课程')
    expect(container.textContent).toContain('共 8 门课程')
    expect(mocks.error).not.toHaveBeenCalled()
  })

  it('reloads timeline content and page size on browser back and forward without duplicate requests', async () => {
    mocks.get.mockImplementation(({ query }) => Promise.resolve(reviewResponse(query.page, query.pageSize)))
    const router = await mount('/review/timeline')
    container.querySelector<HTMLButtonElement>('[data-page-two]')!.click()
    await flush()
    expect(container.textContent).toContain('评价第2页，每页8条')
    await travel(router, -1)
    expect(container.querySelector('[data-page]')?.textContent).toBe('1/8')
    expect(container.textContent).toContain('评价第1页，每页8条')
    await travel(router, 1)
    expect(container.textContent).toContain('评价第2页，每页8条')
    container.querySelector<HTMLButtonElement>('[data-size-twenty]')!.click()
    await flush()
    expect(container.querySelector('[data-page]')?.textContent).toBe('1/20')
    expect(container.textContent).toContain('评价第1页，每页20条')
    await travel(router, -1)
    expect(container.querySelector('[data-page]')?.textContent).toBe('2/8')
    expect(container.textContent).toContain('评价第2页，每页8条')
    expect(mocks.get).toHaveBeenCalledTimes(6)
  })

  it('prevents a slow timeline page from replacing the page restored by back', async () => {
    mocks.get.mockResolvedValueOnce(reviewResponse(1))
    const router = await mount('/review/timeline')
    const old = deferred()
    const latest = deferred()
    mocks.get.mockReturnValueOnce(old.promise).mockReturnValueOnce(latest.promise)
    container.querySelector<HTMLButtonElement>('[data-page-two]')!.click()
    await flush()
    await travel(router, -1)
    old.resolve(reviewResponse(2))
    await flush()
    expect(container.textContent).toContain('review loading')
    expect(container.textContent).not.toContain('评价第2页')
    latest.resolve(reviewResponse(1))
    await flush()
    expect(container.textContent).toContain('评价第1页')
  })

  it('uses valid defaults for invalid URL filters and pagination', async () => {
    mocks.get.mockResolvedValue(courseResponse())
    const router = await mount('/review/course?course_type=unknown&order_by=unknown&page=-1')
    expect(mocks.get).toHaveBeenLastCalledWith(expect.objectContaining({ query: { course_type: 'all', order_by: 'rating', page: 1, pageSize: 12 } }))
    mocks.get.mockResolvedValue(reviewResponse(1))
    await router.push('/review/timeline?page=2x&pageSize=13')
    await flush()
    expect(mocks.get).toHaveBeenLastCalledWith(expect.objectContaining({ query: { page: 1, pageSize: 8, desc: 1 } }))
  })
})
