import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, type App } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import AddCourseModal from './AddCourseModal.vue'
import AddTeacherModal from './AddTeacherModal.vue'

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), checkLoginStatus: vi.fn(), error: vi.fn(), success: vi.fn() }))
vi.mock('@/lib/requests', () => ({ api: { get: mocks.get, post: mocks.post } }))
vi.mock('@/lib/logins', () => ({ checkLoginStatus: mocks.checkLoginStatus }))
vi.mock('naive-ui', () => ({ useMessage: () => ({ error: mocks.error, success: mocks.success }) }))
vi.mock('./_component/TeacherSelector.vue', () => ({ default: { render: () => null } }))

let app: App | undefined
let container: HTMLDivElement

const flush = async () => {
  await new Promise(resolve => setTimeout(resolve, 0))
  for (let i = 0; i < 10; i++) { await Promise.resolve(); await nextTick() }
}

const mountModal = async (kind: 'course' | 'teacher') => {
  const router = createRouter({ history: createMemoryHistory(), routes: [
    { path: '/review/course', component: { render: () => null } },
    { path: '/review/course/:id', name: 'courseReviewItem', component: { render: () => null } },
  ] })
  await router.push('/review/course')
  const closed: boolean[] = []
  const added: unknown[] = []
  const props = {
    modelValue: true,
    initValue: { name: '测试名称', school: 1, classification: 'required' as const, teacher: { id: 9, name: '测试教师', school: '数学学院' } },
    'onUpdate:modelValue': (value: boolean) => closed.push(value),
    onAdd: (value: unknown) => added.push(value),
  }
  app = createApp({ render: () => kind === 'course' ? h(AddCourseModal, props) : h(AddTeacherModal, props) }).use(router)
  app.component('NSelect', defineComponent({
    props: ['value'], setup: props => () => h('span', { 'data-school': '' }, props.value),
  }))
  app.mount(container)
  await flush()
  return { router, closed, added }
}

const submit = async () => {
  container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  await flush()
}

beforeEach(() => {
  vi.resetAllMocks()
  mocks.get.mockResolvedValue({ status: 200, data: { contents: { schools: [{ id: 1, name: '数学学院' }] } } })
  mocks.checkLoginStatus.mockResolvedValue(true)
  container = document.createElement('div')
  document.body.append(container)
})

afterEach(() => {
  app?.unmount()
  app = undefined
  container.remove()
  document.body.style.overflow = ''
})

describe.each(['course', 'teacher'] as const)('%s creation authentication', kind => {
  const action = kind === 'course' ? '添加课程' : '添加教师'

  it('does not send a creation request when the session has expired', async () => {
    await mountModal(kind)
    mocks.checkLoginStatus.mockResolvedValue(false)
    await submit()
    expect(mocks.post).not.toHaveBeenCalled()
    expect(mocks.error).toHaveBeenCalledWith(`请先登录后再${action}`)
    expect(container.textContent).toContain(`请先登录后再${action}`)
    expect(container.querySelector<HTMLInputElement>('input')?.value).toBe('测试名称')
  })

  it.each([401, 400])('handles a server login rejection (%i) without exposing raw error JSON', async status => {
    await mountModal(kind)
    mocks.post.mockResolvedValue({ status, errors: [{ field: 'login', err_code: 'not_login', err_msg: '尚未登录' }] })
    await submit()
    expect(mocks.post).toHaveBeenCalledTimes(1)
    expect(mocks.error).toHaveBeenCalledWith(`请先登录后再${action}`)
    expect(container.textContent).toContain(`请先登录后再${action}`)
    expect(container.textContent).not.toContain('err_code')
    expect(container.querySelector<HTMLInputElement>('input')?.value).toBe('测试名称')
  })

  it('keeps the successful creation flow for an authenticated session', async () => {
    const { router, closed, added } = await mountModal(kind)
    mocks.post.mockResolvedValue({ status: 200, data: { contents: { course_id: 42, teacher_id: 9 } } })
    await submit()
    expect(mocks.post).toHaveBeenCalledTimes(1)
    expect(mocks.success).toHaveBeenCalledWith(`${action}成功`)
    expect(closed).toEqual([false])
    if (kind === 'course') {
      expect(router.currentRoute.value.path).toBe('/review/course/42')
    } else {
      expect(added).toEqual([{ id: 9, name: '测试名称', school: '数学学院' }])
    }
  })
})
