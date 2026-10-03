import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, type App, type Component } from 'vue'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import CourseList from '@/views/courseReview/CourseList.vue'
import TeacherList from '@/views/courseReview/TeacherList.vue'
import Teacher from '@/views/courseReview/Teacher.vue'
import Search from '@/components/search/Search.vue'
import TeacherSelector from '@/components/courseReview/course/_component/TeacherSelector.vue'

const mocks = vi.hoisted(() => ({
  checkLoginStatus: vi.fn(),
  error: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  close: vi.fn(),
}))

vi.mock('@/lib/logins', () => ({ checkLoginStatus: mocks.checkLoginStatus }))
vi.mock('naive-ui', () => ({ useMessage: () => ({ error: mocks.error }) }))
vi.mock('@/lib/requests', () => ({ api: { get: mocks.get, post: mocks.post } }))
vi.mock('@/components/courseReview/course/AddCourseModal.vue', () => ({
  default: defineComponent({
    props: ['modelValue', 'initValue'],
    setup: props => () => props.modelValue ? h('div', {
      'data-add-course-modal': '',
      'data-teacher-id': props.initValue?.teacher?.id,
      'data-teacher-name': props.initValue?.teacher?.name,
    }, '课程添加表单') : null,
  }),
}))
vi.mock('@/components/courseReview/course/AddTeacherModal.vue', () => ({
  default: defineComponent({
    props: ['modelValue'],
    setup: props => () => props.modelValue ? h('div', { 'data-add-teacher-modal': '' }, '教师添加表单') : null,
  }),
}))
vi.mock('@/components/courseReview/teacher/TeacherSkeleton.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/infoNErrors/404.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/infoNErrors/500.vue', () => ({ default: { render: () => null } }))

type AccessCase = {
  name: string
  component: Component
  path: string
  button: string
  action: '添加课程' | '添加教师'
  modal: '[data-add-course-modal]' | '[data-add-teacher-modal]'
  props?: Record<string, unknown>
  search?: 'course' | 'teacher'
  initialTeacher?: boolean
}

const accessCases: AccessCase[] = [
  { name: 'course directory', component: CourseList, path: '/review/course', button: '添加课程', action: '添加课程', modal: '[data-add-course-modal]' },
  { name: 'teacher directory', component: TeacherList, path: '/review/teacher', button: '添加教师', action: '添加教师', modal: '[data-add-teacher-modal]' },
  { name: 'teacher detail', component: Teacher, path: '/review/teacher/9', button: '添加课程', action: '添加课程', modal: '[data-add-course-modal]', initialTeacher: true },
  { name: 'empty course search', component: Search, path: '/review/course', button: '添加新课程', action: '添加课程', modal: '[data-add-course-modal]', search: 'course' },
  { name: 'teacher selector header', component: TeacherSelector, path: '/review/course', button: '添加教师', action: '添加教师', modal: '[data-add-teacher-modal]', props: { modelValue: true } },
  { name: 'empty teacher search', component: TeacherSelector, path: '/review/course', button: '添加新教师', action: '添加教师', modal: '[data-add-teacher-modal]', props: { modelValue: true }, search: 'teacher' },
]

const emptySearch = {
  search_result: [], total_pages: 0, current_page: 1,
  has_next: false, has_previous: false, total_count: 0,
}
let app: App | undefined
let host: HTMLDivElement

const flush = async () => {
  for (let index = 0; index < 15; index++) { await Promise.resolve(); await nextTick() }
}

const mount = async (entry: AccessCase): Promise<Router> => {
  const router = createRouter({ history: createMemoryHistory(), routes: [
    { path: '/', component: { render: () => null } },
    { path: '/review/timeline', component: { render: () => null } },
    { path: '/review/course', component: { render: () => null } },
    { path: '/review/teacher', component: { render: () => null } },
    { path: '/review/course/:id', name: 'courseReviewItem', component: { render: () => null } },
    { path: '/review/teacher/:id', name: 'teacherReviewItem', component: { render: () => null } },
  ] })
  await router.push(entry.path)
  await router.isReady()
  app = createApp({ render: () => h(entry.component, { ...entry.props, onClose: mocks.close }) }).use(router)
  app.component('NRate', { render: () => null })
  app.component('NSelect', { render: () => null })
  app.mount(host)
  await flush()

  if (entry.search === 'course') {
    const input = host.querySelector<HTMLInputElement>('input')!
    input.value = '不存在的课程'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await flush()
    host.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
    await flush()
    expect(host.textContent).toContain('未找到结果')
  } else if (entry.search === 'teacher') {
    const input = host.querySelector<HTMLInputElement>('input')!
    input.value = '不存在的教师'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await vi.advanceTimersByTimeAsync(300)
    await flush()
    expect(host.textContent).toContain('未找到教师')
  }
  return router
}

const findButton = (label: string): HTMLButtonElement => {
  const button = [...host.querySelectorAll<HTMLButtonElement>('button')]
    .find(element => element.textContent?.trim() === label)
  expect(button).toBeDefined()
  return button!
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  mocks.checkLoginStatus.mockReset()
  mocks.get.mockImplementation(({ url }) => {
    if (url === '/api/assessment/school/') return Promise.resolve({ status: 200, content: { schools: [{ id: 1, name: '数学学院' }] } })
    if (url === '/api/assessment/courselist/' || url === '/api/assessment/teacher/') {
      return Promise.resolve({ status: 200, content: { count: 0, max_page: 1, page: 1, results: [] } })
    }
    if (url === '/api/assessment/teacher/:id/') {
      return Promise.resolve({ status: 200, content: { teacher_info: { id: 9, name: '测试教师', school: '数学学院' }, course_list: [] } })
    }
    throw new Error(`Unexpected GET ${url}`)
  })
  mocks.post.mockResolvedValue({ status: 200, content: emptySearch, data: { contents: emptySearch } })
  host = document.createElement('div')
  document.body.append(host)
})

afterEach(() => {
  app?.unmount()
  app = undefined
  host.remove()
  vi.clearAllTimers()
  vi.useRealTimers()
})

describe('course and teacher creation access', () => {
  it.each(accessCases)('$name requires login before opening the form', async (entry) => {
    mocks.checkLoginStatus.mockResolvedValue(false)
    const router = await mount(entry)
    const path = router.currentRoute.value.fullPath
    expect(host.querySelector(entry.modal)).toBeNull()
    findButton(entry.button).click()
    await flush()
    expect(mocks.checkLoginStatus).toHaveBeenCalledOnce()
    expect(host.querySelector(entry.modal)).toBeNull()
    expect(mocks.error).toHaveBeenCalledWith(expect.stringContaining('请先登录'))
    expect(mocks.error).toHaveBeenCalledWith(expect.stringContaining(entry.action))
    expect(router.currentRoute.value.fullPath).toBe(path)
    expect(mocks.close).not.toHaveBeenCalled()
  })

  it.each(accessCases)('$name opens the form after verifying login', async (entry) => {
    mocks.checkLoginStatus.mockResolvedValue(true)
    await mount(entry)
    expect(host.querySelector(entry.modal)).toBeNull()
    findButton(entry.button).click()
    await flush()
    expect(mocks.checkLoginStatus).toHaveBeenCalledOnce()
    const modal = host.querySelector(entry.modal)
    expect(modal).not.toBeNull()
    expect(mocks.error).not.toHaveBeenCalled()
    if (entry.initialTeacher) {
      expect(modal?.getAttribute('data-teacher-id')).toBe('9')
      expect(modal?.getAttribute('data-teacher-name')).toBe('测试教师')
    }
  })

  it('disables the creation button while its login check is pending', async () => {
    let finishCheck!: (value: boolean) => void
    mocks.checkLoginStatus.mockImplementation(() => new Promise<boolean>(resolve => { finishCheck = resolve }))
    await mount(accessCases[0])
    const button = findButton('添加课程')
    button.click()
    await nextTick()
    expect(button.disabled).toBe(true)
    expect(host.querySelector('[data-add-course-modal]')).toBeNull()
    button.click()
    expect(mocks.checkLoginStatus).toHaveBeenCalledOnce()
    finishCheck(false)
    await flush()
    expect(button.disabled).toBe(false)
    expect(host.querySelector('[data-add-course-modal]')).toBeNull()
  })
})
