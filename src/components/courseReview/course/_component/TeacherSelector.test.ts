import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref, type App, type Ref } from 'vue'
import TeacherSelector from './TeacherSelector.vue'
import type { TeacherSearchResult } from '@/types/api/search/search'

const mocks = vi.hoisted(() => ({ post: vi.fn(), error: vi.fn(), requireLogin: vi.fn() }))
vi.mock('@/lib/requests', () => ({ api: { post: mocks.post } }))
vi.mock('@/lib/useShadcnToast', () => ({ useShadcnToast: () => ({ error: mocks.error }) }))
vi.mock('@/lib/useCreationLogin', () => ({ useCreationLogin: () => ({ checkingLogin: ref(false), requireLogin: mocks.requireLogin }) }))
vi.mock('@/components/common/ShadcnFormDialog.vue', () => ({
  default: defineComponent({
    props: ['show', 'title', 'busy', 'suspended'], emits: ['close'],
    setup: (props, { slots, emit }) => () => props.show ? h('section', { 'data-suspended': String(props.suspended) }, [
      h('h2', props.title), slots.default?.(), slots.footer?.(),
      h('button', { 'aria-label': '关闭', disabled: props.busy || props.suspended, onClick: () => emit('close') }, '关闭'),
    ]) : null,
  }),
}))
vi.mock('@/components/courseReview/course/AddTeacherModal.vue', () => ({
  default: defineComponent({
    props: ['modelValue'], emits: ['update:modelValue', 'add'],
    setup: (props, { emit }) => () => props.modelValue ? h('div', { 'data-add-teacher': '' }, [
      h('button', { onClick: () => emit('update:modelValue', false) }, '取消添加'),
      h('button', { onClick: () => emit('add', { id: 99, name: '新教师', school: '数学学院' }) }, '完成添加'),
    ]) : null,
  }),
}))

const teacher: TeacherSearchResult = { id: 1, name: '张老师', school: '数学学院', avatar_uuid: 'avatar-1' }
const secondTeacher: TeacherSearchResult = { id: 2, name: '李老师', school: '文学院' }
const response = (results = [teacher], page = 1, total = 1, alias = true) => {
  const contents = { search_result: results, current_page: page, total_pages: total }
  return { status: 200, ...(alias ? { content: contents } : {}), data: { contents } }
}
const deferred = <T>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(done => { resolve = done })
  return { promise, resolve }
}

let app: App | undefined
let host: HTMLDivElement
let shown: Ref<boolean>
let selectedTeachers: Ref<TeacherSearchResult[]>
const selected: TeacherSearchResult[][] = []
const flush = async () => {
  for (let index = 0; index < 10; index++) { await Promise.resolve(); await nextTick() }
}
const mount = async (show = true, initial: TeacherSearchResult[] = []) => {
  shown = ref(show)
  selectedTeachers = ref(initial)
  app = createApp({ render: () => h(TeacherSelector, {
    modelValue: shown.value,
    selectedTeachers: selectedTeachers.value,
    'onUpdate:modelValue': (value: boolean) => { shown.value = value },
    onSelect: (value: TeacherSearchResult[]) => { selected.push(value); selectedTeachers.value = value },
  }) })
  app.mount(host)
  await flush()
}
const button = (text: string) => [...host.querySelectorAll<HTMLButtonElement>('button')].find(item => item.textContent?.includes(text))!
const row = (name: string) => [...host.querySelectorAll<HTMLButtonElement>('[aria-pressed]')].find(item => item.textContent?.includes(name))!
const remove = (name: string) => host.querySelector<HTMLButtonElement>(`[aria-label="取消选择${name}"]`)!
const query = async (value: string) => {
  const input = host.querySelector<HTMLInputElement>('input')!
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
  await flush()
}
const search = async (value = '张') => {
  await query(value)
  await vi.advanceTimersByTimeAsync(300)
  await flush()
}
const pressEnter = async () => {
  host.querySelector('input')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
  await flush()
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.resetAllMocks()
  mocks.post.mockImplementation(({ query: request }) => Promise.resolve(request.keyword?.trim()
    ? response()
    : { status: 400, data: { errors: [{ field: 'keyword', err_msg: '该字段不能为空。' }] } }))
  mocks.requireLogin.mockResolvedValue(true)
  selected.length = 0
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

describe('teacher selection', () => {
  it('waits for a teacher name and reloads the retained query on reopening', async () => {
    await mount(false)
    expect(mocks.post).not.toHaveBeenCalled()
    shown.value = true
    await flush()
    expect(mocks.post).not.toHaveBeenCalled()
    expect(host.textContent).toContain('输入教师姓名开始搜索')
    expect(host.textContent).not.toContain('未找到教师')
    expect(host.textContent).not.toContain('搜索教师失败')
    await search(' 张 ')
    expect(mocks.post).toHaveBeenCalledWith({ url: '/api/search/', query: { keyword: '张', type: 'teacher', current_page: 1, page_size: 10 } })
    expect(row('张老师').getAttribute('aria-pressed')).toBe('false')
    row('张老师').click()
    await flush()
    expect(row('张老师').getAttribute('aria-pressed')).toBe('true')
    expect(selected).toEqual([])
    expect(shown.value).toBe(true)
    button('确认选择').click()
    await flush()
    expect(selected).toEqual([[teacher]])
    expect(shown.value).toBe(false)
    shown.value = true
    await flush()
    expect(mocks.post).toHaveBeenCalledTimes(2)
    expect(row('张老师').getAttribute('aria-pressed')).toBe('true')
  })

  it('never searches an empty or whitespace query, including Enter and reopening', async () => {
    await mount()
    await pressEnter()
    await query('   ')
    await pressEnter()
    await vi.advanceTimersByTimeAsync(300)
    expect(mocks.post).not.toHaveBeenCalled()
    expect(mocks.error).not.toHaveBeenCalled()
    expect(host.textContent).toContain('输入教师姓名开始搜索')
    expect(host.textContent).not.toContain('未找到教师')
    expect(button('添加教师').disabled).toBe(false)
    shown.value = false
    await flush()
    shown.value = true
    await flush()
    expect(mocks.post).not.toHaveBeenCalled()
    expect(host.textContent).toContain('输入教师姓名开始搜索')
  })

  it('keeps multiple selections across searches and removes a choice from its chip', async () => {
    await mount()
    await search()
    row('张老师').click()
    await flush()
    mocks.post.mockResolvedValueOnce(response([secondTeacher]))
    await search('李')
    expect(remove('张老师')).not.toBeNull()
    row('李老师').click()
    await flush()
    expect(host.textContent).toContain('已选择 2 位教师')
    expect(row('李老师').getAttribute('aria-pressed')).toBe('true')
    expect(selected).toEqual([])
    await query('')
    expect(host.textContent).toContain('已选择 2 位教师')
    remove('张老师').click()
    await flush()
    expect(remove('张老师')).toBeNull()
    expect(remove('李老师')).not.toBeNull()
    expect(host.textContent).toContain('已选择 1 位教师')
    button('确认选择').click()
    await flush()
    expect(selected).toEqual([[secondTeacher]])
    expect(shown.value).toBe(false)
  })

  it('toggles result choices without closing and can confirm an empty selection', async () => {
    await mount()
    await search()
    row('张老师').click()
    await flush()
    row('张老师').click()
    await flush()
    expect(row('张老师').getAttribute('aria-pressed')).toBe('false')
    expect(remove('张老师')).toBeNull()
    expect(shown.value).toBe(true)
    expect(selected).toEqual([])
    button('确认选择').click()
    await flush()
    expect(selected).toEqual([[]])
    expect(shown.value).toBe(false)
  })

  it('discards cancelled changes and reloads the confirmed teachers on every opening', async () => {
    await mount(true, [teacher])
    mocks.post.mockResolvedValueOnce(response([secondTeacher]))
    await search('李')
    row('李老师').click()
    remove('张老师').click()
    await flush()
    button('取消').click()
    await flush()
    expect(selected).toEqual([])
    expect(selectedTeachers.value).toEqual([teacher])
    shown.value = true
    await flush()
    expect(remove('张老师')).not.toBeNull()
    expect(remove('李老师')).toBeNull()
    remove('张老师').click()
    await flush()
    button('关闭').click()
    await flush()
    expect(selected).toEqual([])
    selectedTeachers.value = [secondTeacher, secondTeacher]
    shown.value = true
    await flush()
    expect(remove('张老师')).toBeNull()
    expect(remove('李老师')).not.toBeNull()
    expect(host.textContent).toContain('已选择 1 位教师')
    button('确认选择').click()
    await flush()
    expect(selected).toEqual([[secondTeacher]])
  })

  it('cancels a pending search when the query is cleared', async () => {
    await mount()
    await query('张')
    await query('')
    await vi.advanceTimersByTimeAsync(300)
    await flush()
    expect(mocks.post).not.toHaveBeenCalled()
    expect(host.textContent).toContain('输入教师姓名开始搜索')
    expect(host.textContent).not.toContain('搜索中')
  })

  it('clears results and ignores a late failure after clearing and reopening', async () => {
    await mount()
    await search()
    expect(host.textContent).toContain('张老师')
    const late = deferred<ReturnType<typeof response>>()
    mocks.post.mockReturnValueOnce(late.promise)
    await search('李')
    expect(host.textContent).toContain('搜索中')
    await query('   ')
    expect(host.textContent).toContain('输入教师姓名开始搜索')
    expect(host.textContent).not.toContain('搜索中')
    expect(host.textContent).not.toContain('张老师')
    shown.value = false
    await flush()
    shown.value = true
    await flush()
    late.resolve({ ...response(), status: 500 })
    await flush()
    expect(mocks.post).toHaveBeenCalledTimes(2)
    expect(mocks.error).not.toHaveBeenCalled()
    expect(host.textContent).not.toContain('搜索教师失败')
    expect(host.textContent).toContain('输入教师姓名开始搜索')
  })

  it('ignores older responses as soon as a new search is typed', async () => {
    const first = deferred<ReturnType<typeof response>>()
    mocks.post.mockReturnValueOnce(first.promise)
    await mount()
    await search()
    await query('李')
    first.resolve(response())
    await flush()
    expect(host.textContent).not.toContain('张老师')
    mocks.post.mockResolvedValueOnce(response([{ ...teacher, id: 2, name: '李老师' }]))
    await vi.advanceTimersByTimeAsync(300)
    await flush()
    expect(host.textContent).toContain('李老师')
    expect(host.textContent).not.toContain('张老师')
  })

  it('cancels debounce on close and does not display a late failure after unmount', async () => {
    await mount()
    await search()
    await query('李')
    shown.value = false
    await flush()
    await vi.advanceTimersByTimeAsync(300)
    expect(mocks.post).toHaveBeenCalledOnce()
    const late = deferred<ReturnType<typeof response>>()
    mocks.post.mockReturnValueOnce(late.promise)
    shown.value = true
    await flush()
    app!.unmount()
    app = undefined
    late.resolve({ ...response(), status: 500 })
    await flush()
    expect(mocks.error).not.toHaveBeenCalled()
  })

  it('loads subsequent pages from the response contents with the dynamic scroll handler', async () => {
    mocks.post.mockResolvedValueOnce(response([teacher], 1, 2, false))
    mocks.post.mockResolvedValueOnce(response([{ ...teacher, id: 2, name: '李老师' }], 2, 2, false))
    await mount()
    await search()
    row('张老师').click()
    await flush()
    const region = host.querySelector('[aria-label="教师搜索结果"]')!
    region.dispatchEvent(new Event('scroll'))
    region.dispatchEvent(new Event('scroll'))
    await flush()
    expect(mocks.post).toHaveBeenCalledTimes(2)
    expect(mocks.post.mock.calls[1][0].query.current_page).toBe(2)
    expect(host.textContent).toContain('张老师')
    expect(host.textContent).toContain('李老师')
    expect(row('张老师').getAttribute('aria-pressed')).toBe('true')
    row('李老师').click()
    await flush()
    expect(host.textContent).toContain('已选择 2 位教师')
    region.dispatchEvent(new Event('scroll'))
    await flush()
    expect(mocks.post).toHaveBeenCalledTimes(2)
    button('确认选择').click()
    await flush()
    expect(selected).toEqual([[teacher, { ...teacher, id: 2, name: '李老师' }]])
  })

  it('keeps the same next page available when loading more fails', async () => {
    mocks.post.mockResolvedValueOnce(response([teacher], 1, 2))
    mocks.post.mockResolvedValueOnce({ ...response(), status: 500 })
    await mount()
    await search()
    host.querySelector('[aria-label="教师搜索结果"]')!.dispatchEvent(new Event('scroll'))
    await flush()
    expect(host.textContent).toContain('张老师')
    expect(host.textContent).toContain('加载更多教师失败')
    expect(mocks.error).toHaveBeenCalledWith('加载更多教师失败')
    mocks.post.mockResolvedValueOnce(response([{ ...teacher, id: 2, name: '李老师' }], 2, 2))
    button('重试').click()
    await flush()
    expect(mocks.post.mock.calls[2][0].query.current_page).toBe(2)
    expect(host.textContent).toContain('李老师')
  })

  it('offers a retry when the initial search fails', async () => {
    mocks.post.mockResolvedValueOnce({ ...response(), status: 500 })
    await mount()
    await search()
    expect(host.textContent).toContain('搜索教师失败，请稍后重试')
    expect(mocks.error).toHaveBeenCalledWith('搜索教师失败，请稍后重试')
    button('重新加载').click()
    await flush()
    expect(host.textContent).toContain('张老师')
  })

  it('switches a broken avatar to a reactive initial fallback', async () => {
    await mount()
    await search()
    const teacherRow = row('张老师')
    teacherRow.querySelector('img')!.dispatchEvent(new Event('error'))
    await flush()
    expect(teacherRow.querySelector('img')).toBeNull()
    expect(teacherRow.textContent).toContain('张')
    teacherRow.click()
    await flush()
    button('确认选择').click()
    await flush()
    expect(selected).toEqual([[teacher]])
  })

  it('keeps previous selections when cancelling a nested add and adds new teachers to the draft once', async () => {
    await mount(true, [teacher])
    button('添加教师').click()
    await flush()
    expect(host.querySelector('[data-add-teacher]')).not.toBeNull()
    expect(host.querySelector('section')!.getAttribute('data-suspended')).toBe('true')
    button('取消添加').click()
    await flush()
    expect(shown.value).toBe(true)
    expect(host.textContent).toContain('输入教师姓名开始搜索')
    expect(mocks.post).not.toHaveBeenCalled()
    expect(host.querySelector('[data-add-teacher]')).toBeNull()
    button('添加教师').click()
    await flush()
    button('完成添加').click()
    await flush()
    expect(selected).toEqual([])
    expect(shown.value).toBe(true)
    expect(host.querySelector('[data-add-teacher]')).toBeNull()
    expect(host.textContent).toContain('已选择 2 位教师')
    expect(remove('张老师')).not.toBeNull()
    expect(remove('新教师')).not.toBeNull()
    button('添加教师').click()
    await flush()
    button('完成添加').click()
    await flush()
    expect(host.textContent).toContain('已选择 2 位教师')
    button('确认选择').click()
    await flush()
    expect(selected).toEqual([[teacher, { id: 99, name: '新教师', school: '数学学院' }]])
    expect(shown.value).toBe(false)
  })

  it('does not reopen the nested add after its selector was closed during login verification', async () => {
    const login = deferred<boolean>()
    mocks.requireLogin.mockReturnValueOnce(login.promise)
    await mount()
    button('添加教师').click()
    shown.value = false
    await flush()
    login.resolve(true)
    await flush()
    shown.value = true
    await flush()
    expect(host.querySelector('[data-add-teacher]')).toBeNull()
  })

  it('performs an Enter search once and cancels its pending debounce', async () => {
    await mount()
    await query('李')
    await pressEnter()
    await vi.advanceTimersByTimeAsync(300)
    expect(mocks.post).toHaveBeenCalledOnce()
    expect(mocks.post.mock.calls[0][0].query.keyword).toBe('李')
  })
})
