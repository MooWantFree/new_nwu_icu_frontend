import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref, type App } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import AddCourseModal from './AddCourseModal.vue'

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), checkLoginStatus: vi.fn(), error: vi.fn(), success: vi.fn() }))
vi.mock('@/lib/requests', () => ({ api: { get: mocks.get, post: mocks.post } }))
vi.mock('@/lib/logins', () => ({ checkLoginStatus: mocks.checkLoginStatus }))
vi.mock('@/lib/useShadcnToast', () => ({ useShadcnToast: () => ({ error: mocks.error, success: mocks.success }) }))

let app: App | undefined
let host: HTMLDivElement
const flush = async () => {
  for (let index = 0; index < 15; index++) { await Promise.resolve(); await nextTick() }
}
const settle = async () => { await flush(); await vi.advanceTimersByTimeAsync(350); await flush() }
const dialog = (title: string) => [...document.body.querySelectorAll<HTMLElement>('[role="dialog"]')]
  .find(candidate => candidate.querySelector('h2')?.textContent === title && candidate.style.display !== 'none')!
const button = (target: HTMLElement, label: string) => [...target.querySelectorAll<HTMLButtonElement>('button')]
  .find(candidate => candidate.textContent?.trim() === label || candidate.getAttribute('aria-label') === label)!
const changeInput = async (input: HTMLInputElement, value: string) => {
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
  await flush()
}
const expectSuspended = (target: HTMLElement) => {
  expect(target.getAttribute('aria-hidden')).toBe('true')
  expect(target.hasAttribute('inert')).toBe(true)
}
const expectActive = (target: HTMLElement) => {
  expect(target.getAttribute('aria-hidden')).not.toBe('true')
  expect(target.hasAttribute('inert')).toBe(false)
}
const mount = async () => {
  const open = ref(false)
  const router = createRouter({ history: createMemoryHistory(), routes: [
    { path: '/review/course', component: { render: () => null } },
    { path: '/review/course/:id', name: 'courseReviewItem', component: { render: () => null } },
  ] })
  await router.push('/review/course')
  app = createApp({ render: () => h(AddCourseModal, {
    modelValue: open.value,
    'onUpdate:modelValue': (value: boolean) => { open.value = value },
    initValue: { name: '数学分析', school: 1, classification: 'required', teacher: { id: 9, name: '原教师', school: '数学学院' } },
  }) }).use(router)
  app.component('NSelect', defineComponent({
    props: ['value', 'options', 'disabled'],
    emits: ['update:value'],
    setup: (props, { emit, attrs }) => () => h('select', {
      ...attrs, value: props.value ?? '', disabled: props.disabled,
      onChange: (event: Event) => emit('update:value', Number((event.target as HTMLSelectElement).value)),
    }, [h('option', { value: '' }, '请选择学院'), ...props.options.map((school: { id: number; name: string }) => h('option', { value: school.id }, school.name))]),
  }))
  app.mount(host)
  await flush()
  open.value = true
  await settle()
  return { open, router }
}
const openSelector = async () => {
  const teacherButton = button(dialog('添加课程'), '选择授课教师')
  teacherButton.focus()
  teacherButton.click()
  await settle()
  return teacherButton
}
const openTeacherForm = async () => {
  const addButton = button(dialog('选择教师'), '添加教师')
  addButton.focus()
  addButton.click()
  await settle()
  return addButton
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.resetAllMocks()
  mocks.checkLoginStatus.mockResolvedValue(true)
  mocks.get.mockResolvedValue({ status: 200, data: { contents: { schools: [{ id: 1, name: '数学学院' }] } } })
  mocks.post.mockImplementation(({ url, query }) => {
    if (url === '/api/search/' && !query.keyword?.trim()) return Promise.resolve({
      status: 400, data: { errors: [{ field: 'keyword', err_msg: '该字段不能为空。' }] },
    })
    if (url === '/api/search/') return Promise.resolve({ status: 200, data: { contents: {
      search_result: [{ id: 9, name: '原教师', school: '数学学院' }], total_pages: 1,
      current_page: 1, has_next: false, has_previous: false, total_count: 1,
    } } })
    if (url === '/api/assessment/teacher/') return Promise.resolve({ status: 200, data: { contents: { teacher_id: 21 } } })
    if (url === '/api/assessment/course/') return Promise.resolve({ status: 200, data: { contents: { course_id: 42 } } })
    throw new Error(`Unexpected POST ${url}`)
  })
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

describe('nested course creation dialogs with the real modal shell', () => {
  it('restores each parent dialog and its focus without losing the course draft', async () => {
    await mount()
    expect(document.activeElement).toBe(dialog('添加课程').querySelector('input'))
    const teacherButton = await openSelector()
    expectSuspended(dialog('添加课程'))
    expectActive(dialog('选择教师'))
    expect(dialog('选择教师').textContent).toContain('输入教师姓名开始搜索')
    expect(dialog('选择教师').textContent).not.toContain('未找到教师')
    expect(mocks.post).not.toHaveBeenCalled()
    expect(mocks.error).not.toHaveBeenCalled()
    await openTeacherForm()
    expectSuspended(dialog('添加课程'))
    expectSuspended(dialog('选择教师'))
    expectActive(dialog('添加教师'))
    expect(document.activeElement).toBe(dialog('添加教师').querySelector('input'))
    const forms = [...document.body.querySelectorAll<HTMLFormElement>('form')]
    expect(forms.length).toBeGreaterThanOrEqual(2)
    expect(new Set(forms.map(form => form.id)).size).toBe(forms.length)

    button(dialog('添加教师'), '取消').click()
    await settle()
    expect(dialog('添加教师')).toBeUndefined()
    expectActive(dialog('选择教师'))
    expectSuspended(dialog('添加课程'))
    expect(document.activeElement).toBe(button(dialog('选择教师'), '添加教师'))
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }))
    await settle()
    expect(dialog('选择教师')).toBeUndefined()
    const course = dialog('添加课程')
    expectActive(course)
    expect(document.activeElement).toBe(document.getElementById(teacherButton.id))
    expect(course.querySelector<HTMLInputElement>('input')?.value).toBe('数学分析')
    expect(mocks.post).not.toHaveBeenCalled()
    expect(mocks.error).not.toHaveBeenCalled()
  })

  it('keeps a newly added teacher in the selection draft and submits both teachers after confirmation', async () => {
    const { open, router } = await mount()
    await openSelector()
    expect(dialog('选择教师').textContent).toContain('输入教师姓名开始搜索')
    expect(mocks.post).not.toHaveBeenCalled()
    await openTeacherForm()
    const teacher = dialog('添加教师')
    await changeInput(teacher.querySelector<HTMLInputElement>('input')!, '新教师')
    const school = teacher.querySelector<HTMLSelectElement>('select')!
    school.value = '1'
    school.dispatchEvent(new Event('change', { bubbles: true }))
    await flush()
    teacher.querySelector<HTMLButtonElement>('button[type="submit"]')!.click()
    await settle()
    expect(mocks.post).toHaveBeenCalledWith({ url: '/api/assessment/teacher/', query: { name: '新教师', school: 1 } })
    expect(dialog('添加教师')).toBeUndefined()
    expectActive(dialog('选择教师'))
    expectSuspended(dialog('添加课程'))
    expect(dialog('选择教师').textContent).toContain('新教师')
    expect(dialog('添加课程').textContent).not.toContain('新教师')
    button(dialog('选择教师'), '确认选择').click()
    await settle()
    expect(dialog('选择教师')).toBeUndefined()
    const course = dialog('添加课程')
    expectActive(course)
    expect(course.textContent).toContain('新教师')
    expect(course.querySelector<HTMLInputElement>('input')?.value).toBe('数学分析')
    course.querySelector<HTMLButtonElement>('button[type="submit"]')!.click()
    await settle()
    expect(mocks.post).toHaveBeenCalledWith({ url: '/api/assessment/course/', query: {
      name: '数学分析', school: 1, classification: 'required', teacher_ids: [9, 21],
    } })
    expect(open.value).toBe(false)
    expect(router.currentRoute.value.path).toBe('/review/course/42')
    expect(mocks.error).not.toHaveBeenCalled()
  })

  it('preserves confirmed teachers across searches and reopening while discarding a canceled draft', async () => {
    const results = {
      原: { id: 9, name: '原教师', school: '数学学院' },
      李: { id: 31, name: '李老师', school: '数学学院' },
      王: { id: 32, name: '王老师', school: '数学学院' },
    }
    mocks.post.mockImplementation(({ url, query }) => {
      if (url === '/api/search/') return Promise.resolve({ status: 200, data: { contents: {
        search_result: [results[query.keyword as keyof typeof results]], total_pages: 1,
        current_page: 1, has_next: false, has_previous: false, total_count: 1,
      } } })
      if (url === '/api/assessment/course/') return Promise.resolve({ status: 200, data: { contents: { course_id: 42 } } })
      throw new Error(`Unexpected POST ${url}`)
    })
    const search = async (keyword: string) => {
      await changeInput(dialog('选择教师').querySelector<HTMLInputElement>('input[type="search"]')!, keyword)
      await settle()
    }
    const teacherRow = (name: string) => [...dialog('选择教师').querySelectorAll<HTMLButtonElement>('button[aria-pressed]')]
      .find(candidate => candidate.textContent?.includes(name))!
    const { open, router } = await mount()
    await openSelector()
    await search('李')
    teacherRow('李老师').click()
    await flush()
    expect(teacherRow('李老师').getAttribute('aria-pressed')).toBe('true')
    expect(dialog('选择教师')).toBeDefined()
    button(dialog('选择教师'), '取消').click()
    await settle()
    expect(dialog('添加课程').textContent).toContain('原教师')
    expect(dialog('添加课程').textContent).not.toContain('李老师')

    await openSelector()
    expect(teacherRow('李老师').getAttribute('aria-pressed')).toBe('false')
    teacherRow('李老师').click()
    await flush()
    await search('王')
    teacherRow('王老师').click()
    await flush()
    await search('李')
    expect(teacherRow('李老师').getAttribute('aria-pressed')).toBe('true')
    await search('')
    expect(dialog('选择教师').textContent).toContain('输入教师姓名开始搜索')
    button(dialog('选择教师'), '确认选择').click()
    await settle()
    const course = dialog('添加课程')
    expect(course.textContent).toContain('原教师')
    expect(course.textContent).toContain('李老师')
    expect(course.textContent).toContain('王老师')
    button(course, '移除原教师').click()
    await flush()
    expect(course.textContent).not.toContain('原教师')

    await openSelector()
    await search('原')
    expect(teacherRow('原教师').getAttribute('aria-pressed')).toBe('false')
    await search('王')
    expect(teacherRow('王老师').getAttribute('aria-pressed')).toBe('true')
    button(dialog('选择教师'), '取消').click()
    await settle()
    course.querySelector<HTMLButtonElement>('button[type="submit"]')!.click()
    await settle()
    expect(mocks.post).toHaveBeenCalledWith({ url: '/api/assessment/course/', query: {
      name: '数学分析', school: 1, classification: 'required', teacher_ids: [31, 32],
    } })
    expect(open.value).toBe(false)
    expect(router.currentRoute.value.path).toBe('/review/course/42')
    expect(mocks.error).not.toHaveBeenCalled()
  })
})
