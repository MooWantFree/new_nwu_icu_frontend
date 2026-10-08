import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, type App, type Component } from 'vue'
import { createMemoryHistory, createRouter, RouterView, type Router } from 'vue-router'
import TeacherList from './courseReview/TeacherList.vue'
import Profile from './user/Profile.vue'
import ReviewList from '@/components/user/profilePage/ReviewList.vue'
import ReplyList from '@/components/user/profilePage/ReplyList.vue'

const mocks = vi.hoisted(() => ({ get: vi.fn(), error: vi.fn() }))
vi.mock('@/lib/requests', () => ({ api: { get: mocks.get } }))
vi.mock('@/lib/useShadcnToast', () => ({ useShadcnToast: () => ({ error: mocks.error }) }))
vi.mock('@/components/common/ShadcnRating.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/common/ShadcnSelect.vue', () => ({ default: defineComponent({
  props: ['value', 'options'], emits: ['update:value'],
  setup: (props, { emit }) => () => h('select', { value: props.value, onChange: (event: Event) => emit('update:value', (event.target as HTMLSelectElement).value) },
    props.options.map((option: { value: string; label: string }) => h('option', { value: option.value }, option.label))),
}) }))
vi.mock('@/components/user/profilePage/UserInfo.vue', () => ({ default: defineComponent({
  props: ['userInfo'], setup: props => () => h('p', { 'data-user': '' }, props.userInfo?.nickname),
}) }))
vi.mock('@/components/user/profilePage/History.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/courseReview/course/AddTeacherModal.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/courseReview/ReviewDirectoryNav.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/courseReview/course/courseReviews/ReviewMetricScale.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/tinyComponents/Time.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/tinyComponents/ReviewPlainText.vue', () => ({ default: defineComponent({
  props: ['content'], setup: props => () => h('p', props.content),
}) }))
vi.mock('@/components/layout/AppPageLayout.vue', () => ({ default: defineComponent({
  setup: (_props, { slots }) => () => h('main', [slots.meta?.(), slots.default?.()]),
}) }))

const flush = async () => {
  await new Promise(resolve => setTimeout(resolve, 0))
  for (let i = 0; i < 12; i++) { await Promise.resolve(); await nextTick() }
}
const deferred = () => {
  let resolve!: (value: unknown) => void
  let reject!: (error: Error) => void
  const promise = new Promise((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}
const teachers = (name = '数学教师') => ({ status: 200, content: {
  page: 1, max_page: 2, count: 20, results: [{ id: 9, name, school: name }],
} })
const activity = (kind: 'review' | 'reply', user: number) => {
  const entry = kind === 'reply'
    ? { id: user, course: { id: 42, name: '课程' }, datetime: '', review: { content: '' }, reply: { id: user, content: `用户${user}的回复` } }
    : { id: user, course: { id: 42, name: '课程' }, datetime: '', content: { current_content: `用户${user}的评价` }, rating: { rating: 4 }, like: { like: 0, dislike: 0 } }
  const content = { page: 1, max_page: 3, count: 30, results: [entry] }
  return { status: 200, content, data: { contents: content } }
}
let app: App | undefined
let container: HTMLDivElement
const mount = async (path: string, component: Component, routePath: string, props = false) => {
  const router = createRouter({ history: createMemoryHistory(), routes: [
    { path: routePath, component, props },
    { path: '/review/teacher/:id', component: { render: () => h('p', 'teacher detail') } },
    { path: '/review/course/:id', name: 'courseReviewItem', component: { render: () => h('p', 'course detail') } },
  ] })
  await router.push(path)
  app = createApp(RouterView).use(router)
  app.mount(container)
  await flush()
  return router
}
const back = async (router: Router) => {
  await new Promise<void>(resolve => { const stop = router.afterEach(() => { stop(); resolve() }); router.back() })
  await flush()
}
const select = async (index: number, value: string) => {
  const el = container.querySelectorAll('select')[index]
  el.value = value
  el.dispatchEvent(new Event('change', { bubbles: true }))
  await flush()
}
beforeEach(() => {
  mocks.get.mockReset(); mocks.error.mockClear()
  container = document.createElement('div'); document.body.append(container)
})
afterEach(() => { app?.unmount(); app = undefined; container.remove() })

describe('teacher directory state', () => {
  const defaults = () => mocks.get.mockImplementation(({ url }) => Promise.resolve(url.endsWith('/school/')
    ? { status: 200, content: { schools: [{ id: 1, name: '数学学院' }, { id: 2, name: '物理学院' }] } } : teachers()))

  it('restores filters and page after returning from a teacher and resets page on filter change', async () => {
    defaults()
    const router = await mount('/review/teacher?source=directory', TeacherList, '/review/teacher')
    await select(0, '数学学院'); await select(1, 'popular')
    container.querySelector<HTMLButtonElement>('button[aria-label="第 2 页"]')!.click(); await flush()
    expect(router.currentRoute.value.query).toEqual({ source: 'directory', school: '数学学院', order: 'popular', page: '2' })
    container.querySelector<HTMLAnchorElement>('a[href="/review/teacher/9"]')!.click(); await flush()
    await back(router)
    expect([...container.querySelectorAll('select')].map(el => el.value)).toEqual(['数学学院', 'popular'])
    expect(container.querySelector('[aria-current="page"]')?.getAttribute('aria-label')).toBe('第 2 页')
    expect(mocks.get).toHaveBeenCalledWith(expect.objectContaining({ query: { page: 2, page_size: 16, school: '数学学院', order: 'popular' } }))
    await select(0, '物理学院')
    expect(router.currentRoute.value.query.page).toBe('1')
    await back(router)
    expect(container.querySelector('[aria-current="page"]')?.getAttribute('aria-label')).toBe('第 2 页')
  })

  it('does not accept stale filter results or end the current loading state', async () => {
    defaults(); await mount('/review/teacher', TeacherList, '/review/teacher')
    const old = deferred(), latest = deferred()
    mocks.get.mockReturnValueOnce(old.promise).mockReturnValueOnce(latest.promise)
    await select(0, '数学学院'); await select(0, '物理学院')
    old.resolve(teachers('旧教师')); await flush()
    expect(container.querySelector('a[href="/review/teacher/9"]')).toBeNull()
    latest.resolve(teachers('物理教师')); await flush()
    expect(container.textContent).toContain('物理教师')
    expect(container.textContent).not.toContain('旧教师')
  })
})

describe('profile identity', () => {
  it('clears the previous profile and rejects old results and errors', async () => {
    mocks.get.mockResolvedValueOnce({ status: 200, content: { id: 1, nickname: '用户1' } })
    const router = await mount('/user/1', Profile, '/user/:id', true)
    const old = deferred(), latest = deferred()
    mocks.get.mockReturnValueOnce(old.promise).mockReturnValueOnce(latest.promise)
    await router.push('/user/2'); await flush()
    expect(container.querySelector('[data-user]')?.textContent).toBe('')
    await router.push('/user/3'); await flush()
    latest.resolve({ status: 200, content: { id: 3, nickname: '用户3' } }); await flush()
    old.resolve({ status: 200, content: { id: 2, nickname: '用户2' } }); await flush()
    expect(container.querySelector('[data-user]')?.textContent).toBe('用户3')
    const failed = deferred()
    mocks.get.mockReturnValueOnce(failed.promise).mockResolvedValueOnce({ status: 200, content: { id: 5, nickname: '用户5' } })
    await router.push('/user/4'); await router.push('/user/5'); await flush()
    failed.reject(new Error('old error')); await flush()
    expect(container.querySelector('[data-user]')?.textContent).toBe('用户5')
    expect(mocks.error).not.toHaveBeenCalled()
  })
})

for (const [name, component] of [['review', ReviewList], ['reply', ReplyList]] as const) {
  describe(`${name} activity navigation`, () => {
    it('resets pagination for another user and ignores the previous user response', async () => {
      mocks.get.mockResolvedValue(activity(name, 1))
      const router = await mount('/user/1?page=2&pageSize=20', component, '/user/:id', true)
      const old = deferred(), latest = deferred()
      mocks.get.mockReturnValueOnce(old.promise).mockReturnValueOnce(latest.promise)
      await router.push('/user/2'); await flush()
      expect(mocks.get).toHaveBeenLastCalledWith(expect.objectContaining({ params: { id: 2 }, query: { page: 1, page_size: 10 } }))
      expect(container.textContent).not.toContain('用户1')
      await router.push('/user/3'); await flush()
      latest.resolve(activity(name, 3)); await flush()
      old.resolve(activity(name, 2)); await flush()
      expect(container.textContent).toContain('用户3')
      expect(container.textContent).not.toContain('用户2')
    })

    it('preserves page and size on return and fetches only once for a page change', async () => {
      mocks.get.mockResolvedValue(activity(name, 1))
      const router = await mount('/user/1?tab=comments', component, '/user/:id', true)
      mocks.get.mockClear()
      const pageSize = container.querySelector<HTMLSelectElement>('select[aria-label="每页条数"]')!
      pageSize.value = '20'
      pageSize.dispatchEvent(new Event('change', { bubbles: true })); await flush()
      container.querySelector<HTMLButtonElement>('button[aria-label="第 2 页"]')!.click(); await flush()
      expect(mocks.get).toHaveBeenCalledTimes(2)
      await router.push('/review/course/42'); await back(router)
      expect(router.currentRoute.value.query).toEqual({ tab: 'comments', page: '2', pageSize: '20' })
      expect(container.querySelector('[aria-current="page"]')?.getAttribute('aria-label')).toBe('第 2 页')
      expect(container.querySelector<HTMLSelectElement>('select[aria-label="每页条数"]')?.value).toBe('20')
      expect(mocks.get).toHaveBeenLastCalledWith(expect.objectContaining({ query: { page: 2, page_size: 20 } }))
    })
  })
}
