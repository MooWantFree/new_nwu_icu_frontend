import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, type App } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import AddCourseModal from './AddCourseModal.vue'
import AddTeacherModal from './AddTeacherModal.vue'

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), checkLoginStatus: vi.fn(), error: vi.fn(), success: vi.fn() }))
vi.mock('@/lib/requests', () => ({ api: { get: mocks.get, post: mocks.post } }))
vi.mock('@/lib/logins', () => ({ checkLoginStatus: mocks.checkLoginStatus }))
vi.mock('@/lib/useShadcnToast', () => ({ useShadcnToast: () => ({ error: mocks.error, success: mocks.success }) }))
vi.mock('./_component/TeacherSelector.vue', () => ({ default: { render: () => null } }))

vi.mock('@/components/common/ShadcnSelect.vue', () => ({ default: defineComponent({
    props: ['value'], setup: props => () => h('span', { 'data-school': '' }, props.value),
  }) }))

let app: App | undefined
let container: HTMLDivElement

const flush = async () => {
  for (let i = 0; i < 10; i++) { await Promise.resolve(); await nextTick() }
}
const settle = async () => { await flush(); await vi.advanceTimersByTimeAsync(350); await flush() }
const dialog = () => document.body.querySelector<HTMLElement>('[role="dialog"]')!

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
    ...(kind === 'teacher' ? { onAdd: (value: unknown) => added.push(value) } : {}),
  }
  app = createApp({ render: () => kind === 'course' ? h(AddCourseModal, props) : h(AddTeacherModal, props) }).use(router)
  app.mount(container)
  await settle()
  return { router, closed, added }
}

const submit = async () => {
  dialog().querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  await settle()
}

beforeEach(() => {
  vi.useFakeTimers()
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
  vi.clearAllTimers()
  vi.useRealTimers()
})

describe.each(['course', 'teacher'] as const)('%s creation authentication', kind => {
  const action = kind === 'course' ? '添加课程' : '添加教师'

  it('does not send a creation request when the session has expired', async () => {
    await mountModal(kind)
    mocks.checkLoginStatus.mockResolvedValue(false)
    await submit()
    expect(mocks.post).not.toHaveBeenCalled()
    expect(mocks.error).toHaveBeenCalledWith(`请先登录后再${action}`)
    expect(dialog().textContent).toContain(`请先登录后再${action}`)
    expect(dialog().querySelector<HTMLInputElement>('input')?.value).toBe('测试名称')
  })

  it.each([401, 400])('handles a server login rejection (%i) without exposing raw error JSON', async status => {
    await mountModal(kind)
    mocks.post.mockResolvedValue({ status, errors: [{ field: 'login', err_code: 'not_login', err_msg: '尚未登录' }] })
    await submit()
    expect(mocks.post).toHaveBeenCalledTimes(1)
    expect(mocks.error).toHaveBeenCalledWith(`请先登录后再${action}`)
    expect(dialog().textContent).toContain(`请先登录后再${action}`)
    expect(dialog().textContent).not.toContain('err_code')
    expect(dialog().querySelector<HTMLInputElement>('input')?.value).toBe('测试名称')
  })

  it('keeps the successful creation flow for an authenticated session', async () => {
    const { router, closed, added } = await mountModal(kind)
    mocks.post.mockResolvedValue({ status: 200, data: { contents: { course_id: 42, teacher_id: 9 } } })
    await submit()
    expect(mocks.post).toHaveBeenCalledTimes(1)
    expect(mocks.success).toHaveBeenCalledWith(`${action}成功`)
    expect(closed).toEqual([false])
    if (kind === 'course') {
      expect(mocks.post).toHaveBeenCalledWith({ url: '/api/assessment/course/', query: {
        name: '测试名称', school: 1, classification: 'required', teacher_ids: [9],
      } })
      expect(router.currentRoute.value.path).toBe('/review/course/42')
    } else {
      expect(added).toEqual([{ id: 9, name: '测试名称', school: '数学学院' }])
    }
  })

  it('connects the footer submit button to its own form in the teleported dialog', async () => {
    await mountModal(kind)
    const form = dialog().querySelector('form')!
    const submitButton = dialog().querySelector<HTMLButtonElement>('button[type="submit"]')!
    expect(form.id).toBeTruthy()
    expect(submitButton.getAttribute('form')).toBe(form.id)
    expect(submitButton.form).toBe(form)
    expect(dialog().getAttribute('aria-modal')).toBe('true')
    expect(dialog().querySelector('h2')?.textContent).toBe(action)
  })
})

it('requires at least one teacher after removing the last preselected teacher', async () => {
  await mountModal('course')
  dialog().querySelector<HTMLButtonElement>('[aria-label="移除测试教师"]')!.click()
  await flush()
  await submit()
  expect(mocks.post).not.toHaveBeenCalled()
  expect(dialog().textContent).toContain('请至少选择一位授课教师')
  const trigger = dialog().querySelector('[aria-label="选择授课教师"]')!
  expect(trigger.getAttribute('aria-invalid')).toBe('true')
  expect(document.activeElement).toBe(trigger)
})

it('shows server teacher-list validation on the teacher field and retains the selection', async () => {
  await mountModal('course')
  mocks.post.mockResolvedValue({ status: 400, errors: [{ field: 'teacher_ids', err_code: 'invalid', err_msg: '教师信息无效，请重新选择' }] })
  await submit()
  expect(dialog().textContent).toContain('教师信息无效，请重新选择')
  expect(dialog().querySelector('[aria-label="已选授课教师"]')?.textContent).toContain('测试教师')
  const trigger = dialog().querySelector('[aria-label="选择授课教师"]')!
  expect(trigger.getAttribute('aria-invalid')).toBe('true')
  expect(document.activeElement).toBe(trigger)
})
