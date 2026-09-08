import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, reactive, ref, type App } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import CourseReviewItem from '../CourseReviewItem.vue'
import { api } from '@/lib/requests'
import type { Review } from '@/types/courseReview'

vi.mock('@/lib/requests', () => ({ api: { post: vi.fn(), delete: vi.fn() } }))
vi.mock('@/lib/useUser', () => ({ useUser: () => ({
  userInfo: ref({ id: 2, nickname: '同学', username: 'student', avatar: '' }), isLoggedIn: ref(true),
}) }))
vi.mock('naive-ui', () => ({ useMessage: () => ({ success: vi.fn(), error: vi.fn() }), useDialog: () => ({ warning: vi.fn() }) }))
vi.mock('./ReviewHeader.vue', () => ({ default: { render: () => h('header', '主评价作者') } }))
vi.mock('./ReviewContent.vue', () => ({ default: { render: () => h('p', { 'data-main-review': '' }, '主评价正文') } }))
vi.mock('./ReviewBottom.vue', () => ({ default: { render: () => h('div', '主评价操作') } }))
vi.mock('@/components/tinyComponents/Time.vue', () => ({ default: { render: () => null } }))

let app: App | undefined
let container: HTMLDivElement
let review: Review
const scroll = vi.fn()
const originalScroll = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollIntoView')
const flush = async () => {
  for (let i = 0; i < 5; i++) { await Promise.resolve(); await nextTick() }
}
const makeReply = (id: number, parent = 0): Review['reply'][number] => ({
  id, parent, content: `回复内容${id}`, floor_number: id, created_time: `2026-09-08T00:00:0${id}Z`,
  created_by: { id: 2, name: '同学', avatar: '' }, like: { like: 0, dislike: 0, user_option: 0 }, is_deleted: false,
})
const mount = async (hash = '') => {
  const router = createRouter({ history: createMemoryHistory(), routes: [
    { path: '/review/course/:id', component: { render: () => null } },
    { path: '/user/:id', component: { render: () => null } },
  ] })
  await router.push(`/review/course/42${hash}`)
  app = createApp({ render: () => h(CourseReviewItem, { review }) }).use(router)
  app.mount(container)
  await flush()
  return router
}
const button = (selector: string, text?: string) => {
  const candidates = [...container.querySelectorAll<HTMLButtonElement>(selector)]
  const result = text ? candidates.find((item) => item.textContent?.trim() === text) : candidates[0]
  if (!result) throw new Error(`Missing button: ${selector} ${text ?? ''}`)
  return result
}
const branch = (id: number) => container.querySelector<HTMLElement>(`[data-reply-branch="${id}"]`)!

beforeEach(() => {
  vi.clearAllMocks()
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: scroll })
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  container = document.createElement('div')
  document.body.append(container)
  review = reactive({
    id: 119, is_deleted: false, content: '主评价正文', rating: 4, created_time: '', modified_time: '', edited: false,
    difficulty: 3, homework: 3, grade: 3, reward: 3, semester: '2026-秋',
    author: { id: 2, nickname: '同学', avatar: '', anonymous: false },
    like: { like: 0, dislike: 0, user_option: 0 }, reply: [makeReply(3, 2), makeReply(1), makeReply(2, 1), makeReply(4)],
  })
})
afterEach(() => {
  app?.unmount()
  app = undefined
  container?.remove()
  if (originalScroll) Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', originalScroll)
  else Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView')
  vi.restoreAllMocks()
})

describe('course review reply conversations', () => {
  it('shows a deleted-review tombstone while preserving the reply tree', async () => {
    review.is_deleted = true
    review.content = '内容已被删除'
    await mount()

    expect(container.textContent).toContain('内容已被删除')
    expect(container.textContent).not.toContain('主评价作者')
    expect(container.querySelector('[data-main-review]')).toBeNull()
    expect(branch(1)).toBeTruthy()
    expect(branch(3)).toBeTruthy()
    expect([...container.querySelectorAll('button')].some(
      (item) => item.textContent?.trim() === '回复评价'
    )).toBe(false)
  })

  it('collapses only the selected reply branch while keeping the review and other conversations visible', async () => {
    await mount()
    expect(branch(1).contains(branch(2))).toBe(true)
    expect(branch(2).contains(branch(3))).toBe(true)
    button('button[aria-label="折叠第1楼回复"]').click()
    await flush()
    expect(branch(1).style.display).toBe('none')
    expect(branch(4).style.display).not.toBe('none')
    expect(container.querySelector('[data-main-review]')?.closest('[data-reply-branch]')).toBeNull()
    expect(container.textContent).toContain('主评价正文')
    button('button[aria-label="展开第1楼回复"]').click()
    await flush()
    expect(branch(1).style.display).not.toBe('none')
    expect(scroll).not.toHaveBeenCalled()
    expect([...container.querySelectorAll('button')].some((item) => /^#\d+$/.test(item.textContent?.trim() || ''))).toBe(false)
  })

  it('submits to the chosen parent and inserts the new reply inline without scrolling', async () => {
    vi.mocked(api.post).mockResolvedValue({ status: 201, data: { message: '成功创建课程评价回复', contents: { reply_id: 5 } } } as never)
    await mount()
    button('[data-reply-card="2"] button', '回复').click()
    await flush()
    const textarea = container.querySelector('textarea')!
    textarea.value = '新的楼中楼回复'
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
    await flush()
    button('button', '发表回复').click()
    await flush()
    expect(api.post).toHaveBeenCalledWith({ url: '/api/assessment/reply/', query: { content: '新的楼中楼回复', review_id: 119, parent_id: 2 } })
    expect(branch(2).contains(branch(5))).toBe(true)
    expect(container.querySelector('textarea')).toBeNull()
    expect(scroll).not.toHaveBeenCalled()
  })

  it('preserves a draft when its branch is collapsed and keeps descendants after deleting the parent', async () => {
    vi.mocked(api.delete).mockResolvedValue({ status: 200 } as never)
    await mount()
    button('[data-reply-card="2"] button', '回复').click()
    await flush()
    const textarea = container.querySelector('textarea')!
    textarea.value = '尚未发表的草稿'
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
    button('button[aria-label="折叠第1楼回复"]').click()
    await flush()
    button('button[aria-label="展开第1楼回复"]').click()
    await flush()
    expect(container.querySelector('textarea')?.value).toBe('尚未发表的草稿')
    button('[data-reply-card="1"] button', '删除').click()
    await flush()
    expect(container.querySelector('[data-reply-card="1"]')?.textContent).toContain('回复已删除')
    expect(branch(1).contains(branch(3))).toBe(true)
    expect(container.querySelector('[data-main-review]')).not.toBeNull()
  })

  it('reopens ancestors for incoming notification links without introducing reply-to-reply jump controls', async () => {
    const router = await mount()
    button('button[aria-label="折叠第1楼回复"]').click()
    await flush()
    await router.push('/review/course/42#reply-3')
    await flush()
    expect(branch(1).style.display).not.toBe('none')
    expect(scroll).toHaveBeenCalledTimes(1)
  })
})
