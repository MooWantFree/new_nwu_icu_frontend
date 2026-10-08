import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, type App } from 'vue'
import ReviewEditorModal from './ReviewEditorModal.vue'
import type { CourseData, ReviewDataBase } from '@/types/courseReview'
import { loadCourseReviewDraft, saveCourseReviewDraft } from '@/lib/courseReviewDraft'

const mocks = vi.hoisted(() => ({ get: vi.fn(), confirm: vi.fn(), close: vi.fn() }))
vi.mock('@/lib/requests', () => ({ api: { get: mocks.get } }))
vi.mock('@/lib/useShadcnDialog', () => ({ useShadcnDialog: () => ({ confirm: mocks.confirm }) }))
vi.mock('@/components/tiptap/editor/Editor.vue', () => ({ default: defineComponent({
  props: ['modelValue'], emits: ['update:modelValue'],
  setup: (props, { emit }) => () => h('textarea', {
    value: props.modelValue,
    onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLTextAreaElement).value),
  }),
}) }))

vi.mock('@/components/common/ShadcnSelect.vue', () => ({ default: defineComponent({
  props: ['value', 'options'], emits: ['update:value'],
  setup: (props, { emit }) => () => h('select', {
    value: props.value ?? '',
    onChange: (event: Event) => emit('update:value', Number((event.target as HTMLSelectElement).value)),
  }, [h('option', { value: '' }, '选择学期'), ...props.options.map((option: { value: number; label: string }) =>
    h('option', { value: option.value }, option.label))]),
}) }))
const review = (semester: number): ReviewDataBase => ({
  course: 42, semester, content: '<p>existing review</p>', anonymous: false,
  rating: 4, difficulty: 3, grade: 3, homework: 3, reward: 3,
})
const flush = async () => {
  for (let i = 0; i < 5; i++) { await Promise.resolve(); await nextTick() }
}
let app: App | undefined
let container: HTMLDivElement
const submit = vi.fn()
const button = (text: string) => [...container.querySelectorAll<HTMLButtonElement>('button')]
  .find(item => item.textContent?.trim() === text)!
const mount = async (initContent: ReviewDataBase | null) => {
  app = createApp({ render: () => h(ReviewEditorModal, {
    courseData: { id: 42 } as CourseData, initContent, modelValue: true, submitting: false, userId: 1,
    reviewId: initContent ? 9 : null, onSubmit: submit,
    'onUpdate:modelValue': mocks.close,
  }) })
  app.mount(container)
  await flush()
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  mocks.get.mockResolvedValue({ status: 200, content: { 7: '2026-2027 秋', 9: '2026-2027 春' } })
  mocks.confirm.mockResolvedValue(true)
  container = document.createElement('div')
  document.body.append(container)
})
afterEach(() => {
  app?.unmount()
  container.remove()
})

describe('review semester initialization', () => {
  it('publishes the selected overall star rating while preserving the other course metrics', async () => {
    await mount(null)
    const editor = container.querySelector('textarea')!
    editor.value = '值得推荐的课程'
    editor.dispatchEvent(new Event('input', { bubbles: true }))
    await flush()
    button('继续').click()
    await flush()
    const group = container.querySelector<HTMLElement>('[role="radiogroup"][aria-label="总体评分"]')!
    expect(group.querySelector<HTMLInputElement>('input:checked')?.value).toBe('3')
    group.querySelector<HTMLInputElement>('[aria-label="5 星"]')!.click()
    await flush()
    expect(group.querySelector<HTMLInputElement>('input:checked')?.value).toBe('5')
    expect(container.textContent).toContain('强烈推荐')
    button('发布评价').click()
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({
      rating: 5, semester: 9, difficulty: 3, homework: 3, grade: 3, reward: 3,
    }))
  })

  it('restores existing review stars and saves a changed score with the editing draft', async () => {
    await mount(review(7))
    button('继续').click()
    await flush()
    const group = container.querySelector<HTMLElement>('[role="radiogroup"][aria-label="总体评分"]')!
    expect(group.querySelector<HTMLInputElement>('input:checked')?.value).toBe('4')
    group.querySelector<HTMLInputElement>('[aria-label="2 星"]')!.click()
    await flush()
    expect(container.textContent).toContain('不太推荐')
    button('上一步').click()
    await flush()
    button('取消').click()
    await flush()
    expect(loadCourseReviewDraft(1, 42, 9)?.rating).toBe(2)
    expect(mocks.close).toHaveBeenCalledWith(false)
  })

  it('keeps the edited draft when Shadcn close confirmation is canceled and closes only after acceptance', async () => {
    await mount(null)
    const editor = container.querySelector('textarea')!
    editor.value = '尚未发布的评价'
    editor.dispatchEvent(new Event('input', { bubbles: true }))
    await flush()

    mocks.confirm.mockResolvedValueOnce(false)
    button('取消').click()
    await flush()
    expect(mocks.confirm).toHaveBeenCalledWith(expect.objectContaining({ title: '关闭评价编辑器', cancelText: '继续编辑' }))
    expect(mocks.close).not.toHaveBeenCalled()
    expect(loadCourseReviewDraft(1, 42, null)?.content).toBe('尚未发布的评价')
    expect(editor.value).toBe('尚未发布的评价')

    button('取消').click()
    await flush()
    expect(mocks.close).toHaveBeenCalledWith(false)
    expect(loadCourseReviewDraft(1, 42, null)?.content).toBe('尚未发布的评价')
  })

  it('restores and submits the semester ID independently of its year-based label', async () => {
    await mount(review(7))
    button('继续').click()
    await flush()
    expect(container.querySelector('select')?.value).toBe('7')
    expect(button('发布评价').disabled).toBe(false)
    button('发布评价').click()
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({ semester: 7 }))
  })

  it('requires selection when the previous semester is no longer available', async () => {
    await mount(review(6))
    button('继续').click()
    await flush()
    expect(container.querySelector('select')?.value).toBe('')
    expect(button('发布评价').disabled).toBe(true)
  })

  it('continues to default a new review to the newest available semester', async () => {
    await mount(null)
    const editor = container.querySelector('textarea')!
    editor.value = 'new review'
    editor.dispatchEvent(new Event('input', { bubbles: true }))
    await flush()
    button('继续').click()
    await flush()
    expect(container.querySelector('select')?.value).toBe('9')
    button('发布评价').click()
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({ semester: 9 }))
  })

  it('restores an automatic draft and only clears it after explicit confirmation', async () => {
    saveCourseReviewDraft(1, 42, null, {
      content: '<p>自动保存的评价</p>', anonymous: true, rating: 5, semester: 7,
      difficulty: 4, grade: 4, homework: 2, reward: 5, updatedAt: '',
    })
    await mount(null)
    expect(container.querySelector('textarea')?.value).toBe('<p>自动保存的评价</p>')
    expect(container.textContent).toContain('草稿已自动保存在当前浏览器')

    button('清空草稿').click()
    await flush()
    expect(container.querySelector('textarea')?.value).toBe('<p>自动保存的评价</p>')
    expect(loadCourseReviewDraft(1, 42, null)).not.toBeNull()

    button('确认清空').click()
    await flush()
    expect(container.querySelector('textarea')?.value).toBe('')
    expect(loadCourseReviewDraft(1, 42, null)).toBeNull()
  })
})
