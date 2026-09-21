import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, type App } from 'vue'
import ReviewEditorModal from './ReviewEditorModal.vue'
import type { CourseData, ReviewDataBase } from '@/types/courseReview'

const mocks = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('@/lib/requests', () => ({ api: { get: mocks.get } }))
vi.mock('@/components/tiptap/editor/Editor.vue', () => ({ default: defineComponent({
  props: ['modelValue'], emits: ['update:modelValue'],
  setup: (props, { emit }) => () => h('textarea', {
    value: props.modelValue,
    onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLTextAreaElement).value),
  }),
}) }))

const SelectStub = defineComponent({
  props: ['value', 'options'], emits: ['update:value'],
  setup: (props, { emit }) => () => h('select', {
    value: props.value ?? '',
    onChange: (event: Event) => emit('update:value', Number((event.target as HTMLSelectElement).value)),
  }, [h('option', { value: '' }, '选择学期'), ...props.options.map((option: { value: number; label: string }) =>
    h('option', { value: option.value }, option.label))]),
})
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
    courseData: { id: 42 } as CourseData, initContent, modelValue: true, submitting: false, onSubmit: submit,
  }) })
  app.component('NSelect', SelectStub)
  app.mount(container)
  await flush()
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.get.mockResolvedValue({ status: 200, content: { 7: '2026-2027 秋', 9: '2026-2027 春' } })
  container = document.createElement('div')
  document.body.append(container)
})
afterEach(() => {
  app?.unmount()
  container.remove()
})

describe('review semester initialization', () => {
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
})
