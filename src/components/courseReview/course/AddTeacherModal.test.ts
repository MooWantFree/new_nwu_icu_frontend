import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref, type App, type PropType } from 'vue'
import AddTeacherModal from './AddTeacherModal.vue'

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), checkLoginStatus: vi.fn(), error: vi.fn(), success: vi.fn(), add: vi.fn(), close: vi.fn() }))
vi.mock('@/lib/requests', () => ({ api: { get: mocks.get, post: mocks.post } }))
vi.mock('@/lib/logins', () => ({ checkLoginStatus: mocks.checkLoginStatus }))
vi.mock('@/lib/useShadcnToast', () => ({ useShadcnToast: () => ({ error: mocks.error, success: mocks.success }) }))
vi.mock('@/components/common/ShadcnFormDialog.vue', () => ({
  default: defineComponent({
    props: ['show', 'title', 'busy'], emits: ['close'],
    setup: (props, { slots, emit }) => () => props.show ? h('section', { role: 'dialog', 'aria-label': props.title }, [
      h('button', { type: 'button', 'aria-label': '关闭', disabled: props.busy, onClick: () => emit('close') }),
      slots.default?.(), slots.footer?.(),
    ]) : null,
  }),
}))

const schoolResponse = { status: 200, data: { contents: { schools: [{ id: 1, name: '数学学院' }, { id: 2, name: '物理学院' }] } } }
const flush = async () => { for (let index = 0; index < 12; index++) { await Promise.resolve(); await nextTick() } }
const deferred = <T,>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(finish => { resolve = finish })
  return { promise, resolve }
}
let app: App | undefined
let host: HTMLDivElement
const button = (label: string) => [...host.querySelectorAll<HTMLButtonElement>('button')].find(candidate => candidate.textContent?.trim() === label)!
const nameInput = () => host.querySelector<HTMLInputElement>('input')!
const mount = async (initValue?: { name?: string; school?: number }, initiallyOpen = true) => {
  const show = ref(initiallyOpen)
  app = createApp({ render: () => h(AddTeacherModal, {
    modelValue: show.value, initValue,
    'onUpdate:modelValue': (value: boolean) => { mocks.close(value); show.value = value },
    onAdd: mocks.add,
  }) })
  app.component('NSelect', defineComponent({
    props: { value: Number, options: Array as PropType<{ id: number; name: string }[]>, disabled: Boolean },
    emits: ['update:value'],
    setup: (props, { emit }) => () => h('select', {
      value: props.value ?? '', disabled: props.disabled,
      onChange: (event: Event) => emit('update:value', Number((event.target as HTMLSelectElement).value) || null),
    }, [h('option', { value: '' }, '请选择学院'), ...props.options!.map(school => h('option', { value: school.id }, school.name))]),
  }))
  app.mount(host)
  await flush()
  return show
}
const submit = async () => {
  host.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  await flush()
}

beforeEach(() => {
  vi.resetAllMocks()
  mocks.get.mockResolvedValue(schoolResponse)
  mocks.checkLoginStatus.mockResolvedValue(true)
  host = document.createElement('div')
  document.body.append(host)
})
afterEach(() => { app?.unmount(); app = undefined; host.remove() })

describe('add teacher dialog', () => {
  it('loads schools only when opened and preserves supplied name and school', async () => {
    const show = await mount({ name: '测试教师', school: 2 }, false)
    expect(mocks.get).not.toHaveBeenCalled()
    show.value = true
    await flush()
    expect(mocks.get).toHaveBeenCalledWith({ url: '/api/assessment/school/' })
    expect(nameInput().value).toBe('测试教师')
    expect(host.querySelector('select')!.value).toBe('2')
    expect(button('添加教师').getAttribute('form')).toBe(host.querySelector('form')!.id)
  })

  it('shows accessible required-field errors and clears each error on editing', async () => {
    await mount()
    await submit()
    expect(mocks.post).not.toHaveBeenCalled()
    expect(nameInput().getAttribute('aria-invalid')).toBe('true')
    expect(host.querySelector('select')!.getAttribute('aria-invalid')).toBe('true')
    const errorId = nameInput().getAttribute('aria-describedby')!
    expect(document.getElementById(errorId)?.textContent).toContain('教师姓名不能为空')
    nameInput().value = '李老师'
    nameInput().dispatchEvent(new Event('input', { bubbles: true }))
    const school = host.querySelector('select')!
    school.value = '1'
    school.dispatchEvent(new Event('change', { bubbles: true }))
    await flush()
    expect(nameInput().getAttribute('aria-invalid')).toBe('false')
    expect(school.getAttribute('aria-invalid')).toBe('false')
    expect(host.textContent).not.toContain('请选择所属学院')
  })

  it('submits the existing API payload and emits the teacher once while blocking duplicate submission and dismissal', async () => {
    const pending = deferred<{ status: number; data: { contents: { teacher_id: number } } }>()
    mocks.post.mockReturnValue(pending.promise)
    await mount({ name: ' 测试教师 ', school: 2 })
    await submit()
    await submit()
    button('取消').click()
    expect(mocks.close).not.toHaveBeenCalled()
    expect(button('取消').disabled).toBe(true)
    expect(nameInput().disabled).toBe(true)
    expect(mocks.post).toHaveBeenCalledOnce()
    expect(mocks.post).toHaveBeenCalledWith({ url: '/api/assessment/teacher/', query: { name: '测试教师', school: 2 } })
    pending.resolve({ status: 200, data: { contents: { teacher_id: 42 } } })
    await flush()
    expect(mocks.add).toHaveBeenCalledExactlyOnceWith({ id: 42, name: '测试教师', school: '物理学院' })
    expect(mocks.close).toHaveBeenCalledExactlyOnceWith(false)
    expect(mocks.success).toHaveBeenCalledWith('添加教师成功')
    expect(host.querySelector('[role="dialog"]')).toBeNull()
  })

  it('keeps the draft and asks for login when authentication has expired', async () => {
    mocks.checkLoginStatus.mockResolvedValue(false)
    await mount({ name: '测试教师', school: 1 })
    await submit()
    expect(mocks.post).not.toHaveBeenCalled()
    expect(mocks.error).toHaveBeenCalledWith('请先登录后再添加教师')
    expect(host.textContent).toContain('请先登录后再添加教师')
    expect(nameInput().value).toBe('测试教师')
  })

  it.each([401, 400])('handles a server login rejection (%i) without raw error JSON', async status => {
    mocks.post.mockResolvedValue({ status, errors: [{ field: 'login', err_code: 'not_login', err_msg: '尚未登录' }] })
    await mount({ name: '测试教师', school: 1 })
    await submit()
    expect(host.textContent).toContain('请先登录后再添加教师')
    expect(mocks.error).toHaveBeenCalledWith('请先登录后再添加教师')
    expect(host.textContent).not.toContain('err_code')
    expect(mocks.close).not.toHaveBeenCalled()
  })

  it('uses a readable error and allows retry when loading schools fails', async () => {
    mocks.get.mockResolvedValueOnce({ status: 500, data: { contents: {} } })
    await mount()
    expect(host.textContent).toContain('加载学院失败，请稍后重试')
    expect(button('添加教师').disabled).toBe(true)
    button('重新加载').click()
    await flush()
    expect(host.querySelector('select')).not.toBeNull()
    expect(button('添加教师').disabled).toBe(false)
    expect(mocks.get).toHaveBeenCalledTimes(2)
  })

  it('keeps the form open and displays throttling errors as a friendly alert', async () => {
    mocks.post.mockResolvedValue({ status: 429, errors: [] })
    const show = await mount({ name: '测试教师', school: 1 })
    await submit()
    expect(host.querySelector('[role="alert"]')!.textContent).toContain('操作过于频繁，请稍后再试')
    expect(mocks.error).toHaveBeenCalledWith('操作过于频繁，请稍后再试')
    expect(button('添加教师').disabled).toBe(false)
    expect(mocks.close).not.toHaveBeenCalled()
    button('取消').click()
    await flush()
    show.value = true
    await flush()
    expect(host.querySelector('[role="alert"]')).toBeNull()
    expect(nameInput().value).toBe('测试教师')
  })

  it('ignores a pending login result when the dialog closes before validation completes', async () => {
    const pending = deferred<boolean>()
    mocks.checkLoginStatus.mockReturnValue(pending.promise)
    const show = await mount({ name: '测试教师', school: 1 })
    await submit()
    show.value = false
    await flush()
    pending.resolve(true)
    await flush()
    expect(mocks.post).not.toHaveBeenCalled()
    expect(mocks.add).not.toHaveBeenCalled()
  })

  it('does not emit a stale teacher or unlock the new submission after reopening', async () => {
    const pending = deferred<{ status: number; data: { contents: { teacher_id: number } } }>()
    const newPending = deferred<{ status: number; data: { contents: { teacher_id: number } } }>()
    mocks.post.mockReturnValueOnce(pending.promise).mockReturnValueOnce(newPending.promise)
    const show = await mount({ name: '测试教师', school: 1 })
    await submit()
    show.value = false
    await flush()
    show.value = true
    await flush()
    await submit()
    expect(mocks.post).toHaveBeenCalledTimes(2)
    expect(button('添加中…').disabled).toBe(true)
    pending.resolve({ status: 200, data: { contents: { teacher_id: 42 } } })
    await flush()
    expect(mocks.add).not.toHaveBeenCalled()
    expect(mocks.close).not.toHaveBeenCalled()
    expect(mocks.success).not.toHaveBeenCalled()
    expect(host.querySelector('[role="dialog"]')).not.toBeNull()
    expect(button('添加中…').disabled).toBe(true)
    expect(button('取消').disabled).toBe(true)
    newPending.resolve({ status: 200, data: { contents: { teacher_id: 43 } } })
    await flush()
    expect(mocks.add).toHaveBeenCalledExactlyOnceWith({ id: 43, name: '测试教师', school: '数学学院' })
    expect(mocks.close).toHaveBeenCalledExactlyOnceWith(false)
  })
})
