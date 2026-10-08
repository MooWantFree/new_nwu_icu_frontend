import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, reactive, ref, type App } from 'vue'
import ReviewBottom from './ReviewBottom.vue'
import type { Review } from '@/types/courseReview'

const mocks = vi.hoisted(() => ({ post: vi.fn(), error: vi.fn() }))
const loggedIn = ref(true)
vi.mock('@/lib/requests', () => ({ api: { post: mocks.post } }))
vi.mock('@/lib/useUser', () => ({ useUser: () => ({ isLoggedIn: loggedIn }) }))
vi.mock('@/lib/useShadcnToast', () => ({ useShadcnToast: () => ({ error: mocks.error }) }))

let app: App | undefined
let host: HTMLDivElement
let review: Review
const flush = async () => { for (let i = 0; i < 15; i++) { await Promise.resolve(); await nextTick() } }
const settle = async () => { await flush(); await vi.advanceTimersByTimeAsync(50); await flush() }
const button = (label: string) => host.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!
const press = async (target: HTMLElement, key: string) => {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
  await settle()
}
const mount = async (isAuthor = false) => {
  const expanded = ref(false)
  const edit = vi.fn()
  const remove = vi.fn()
  app = createApp({ render: () => h(ReviewBottom, {
    review, isAuthor, replyExpanded: expanded.value,
    onToggleReplies: () => { expanded.value = !expanded.value },
    onReviewEdit: edit, onReviewDelete: remove,
  }) })
  app.mount(host)
  await settle()
  return { expanded, edit, remove }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
  loggedIn.value = true
  host = document.createElement('div')
  document.body.append(host)
  review = reactive({
    id: 119, is_deleted: false, content: '主评价', rating: 4, semester: '2026-春',
    created_time: '', modified_time: '', edited: false, difficulty: 3, homework: 3, grade: 3, reward: 3,
    author: { id: 2, nickname: '同学', avatar: '', anonymous: false, is_student: false },
    like: { like: 0, dislike: 0, user_option: 0 }, reply_count: 1, reply_next_cursor: null, reply: [],
  })
})
afterEach(() => {
  app?.unmount(); app = undefined; host.remove()
  vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals()
})

describe('compact review actions', () => {
  it('keeps reply expansion controlled and associates the button with its discussion', async () => {
    const { expanded } = await mount()
    const open = button('展开评价回复')
    expect(open.getAttribute('aria-controls')).toBe('review-replies-119')
    expect(open.getAttribute('aria-expanded')).toBe('false')
    open.click(); await settle()
    expect(expanded.value).toBe(true)
    expect(button('收起评价回复').getAttribute('aria-expanded')).toBe('true')
    button('收起评价回复').click(); await settle()
    expect(expanded.value).toBe(false)
    expect(button('打开评价操作菜单')).toBeNull()
  })

  it('requires login before voting without sending a request', async () => {
    loggedIn.value = false
    await mount()
    button('认同评价').click(); await settle()
    expect(mocks.post).not.toHaveBeenCalled()
    expect(mocks.error).toHaveBeenCalledWith('请先登录')
  })

  it('updates vote counts and clears the option when the same vote is toggled again', async () => {
    mocks.post.mockResolvedValueOnce({ status: 200, content: { like: { like: 1, dislike: 0 } } })
      .mockResolvedValueOnce({ status: 200, content: { like: { like: 0, dislike: 0 } } })
    await mount()
    button('认同评价').click(); await settle()
    expect(mocks.post).toHaveBeenCalledWith({
      url: '/api/assessment/reply/like/', query: { review_id: 119, reply_id: 0, like_or_dislike: '1' },
    })
    expect(review.like).toEqual({ like: 1, dislike: 0, user_option: 1 })
    expect(button('认同评价').getAttribute('aria-pressed')).toBe('true')
    button('认同评价').click(); await settle()
    expect(review.like).toEqual({ like: 0, dislike: 0, user_option: 0 })
    expect(button('认同评价').getAttribute('aria-pressed')).toBe('false')
  })

  it('restores the voting controls after a failed request and allows retry', async () => {
    mocks.post.mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ status: 200, content: { like: { like: 0, dislike: 1 } } })
    await mount()
    button('不认同评价').click(); await settle()
    expect(mocks.error).toHaveBeenCalledWith('不认同失败，请稍后再试')
    expect(button('不认同评价').disabled).toBe(false)
    button('不认同评价').click(); await settle()
    expect(review.like.user_option).toBe(-1)
  })

  it('keeps deleted reviews available for reading replies without vote or author actions', async () => {
    review.is_deleted = true
    await mount(true)
    expect(button('认同评价')).toBeNull()
    expect(button('不认同评价')).toBeNull()
    expect(button('打开评价操作菜单')).toBeNull()
    expect(button('展开评价回复')).not.toBeNull()
  })

  it('opens the relocated author menu with the keyboard and forwards edit and delete actions', async () => {
    const { edit, remove } = await mount(true)
    const trigger = button('打开评价操作菜单')
    const item = (text: string) => [...document.querySelectorAll<HTMLElement>('[role="menuitem"]')]
      .find(element => element.textContent?.trim() === text)!
    trigger.focus()
    await press(trigger, 'Enter')
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    item('编辑评价').click(); await settle()
    expect(edit).toHaveBeenCalledTimes(1)
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    await press(trigger, 'Enter')
    item('删除评价').click(); await settle()
    expect(remove).toHaveBeenCalledTimes(1)
    await press(trigger, 'Enter')
    await press(item('编辑评价'), 'Escape')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(trigger)
  })
})
