import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, reactive, ref, type App } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import CourseReviewItem from '../CourseReviewItem.vue'
import { api } from '@/lib/requests'
import type { Review } from '@/types/courseReview'
import { loadCourseReviewReplyDraft, saveCourseReviewReplyDraft } from '@/lib/courseReviewDraft'

const mocks = vi.hoisted(() => ({ confirm: vi.fn(), error: vi.fn() }))
const loggedIn = ref(true)
const currentUser = ref({ id: 2, nickname: '同学', username: 'student', avatar: '' })
vi.mock('@/lib/requests', () => ({ api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }))
vi.mock('@/lib/useUser', () => ({ useUser: () => ({
  userInfo: currentUser, isLoggedIn: loggedIn,
}) }))
vi.mock('@/lib/useShadcnToast', () => ({ useShadcnToast: () => ({ success: vi.fn(), error: mocks.error, warning: vi.fn() }) }))
vi.mock('@/lib/useShadcnDialog', () => ({ useShadcnDialog: () => ({ confirm: mocks.confirm }) }))
vi.mock('./ReviewHeader.vue', () => ({ default: {
  render: () => h('header', '主评价作者'),
} }))
vi.mock('./ReviewContent.vue', () => ({ default: { render: () => h('p', { 'data-main-review': '' }, '主评价正文') } }))
vi.mock('./ReviewBottom.vue', () => ({ default: {
  props: { replyExpanded: Boolean },
  emits: ['reviewDelete', 'toggleReplies'],
  setup: (props: { replyExpanded: boolean }, { emit }: { emit: (event: string) => void }) => () => h('div', [
    '主评价操作',
    h('button', { 'aria-label': '删除主评价', onClick: () => emit('reviewDelete') }, '删除主评价'),
    h('button', { 'aria-expanded': props.replyExpanded, onClick: () => emit('toggleReplies') }, props.replyExpanded ? '收起回复' : '显示回复'),
  ]),
} }))
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
const section = () => container.querySelector<HTMLElement>('#review-replies-119')!
const expandReplies = async () => {
  if (section().style.display === 'none') button('button', '显示回复').click()
  await flush()
}
const visibleReplyIds = () => [...container.querySelectorAll<HTMLElement>('[data-reply-card]')]
  .filter(card => {
    let element: HTMLElement | null = card
    while (element && element !== container) {
      if (element.style.display === 'none') return false
      element = element.parentElement
    }
    return true
  }).map(card => Number(card.dataset.replyCard))
const makeSevenReplies = () => {
  review.reply = Array.from({ length: 7 }, (_, index) => makeReply(index + 1))
  review.reply_count = 7
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: scroll })
  mocks.confirm.mockResolvedValue(true)
  loggedIn.value = true
  vi.mocked(api.get).mockResolvedValue({ status: 404 } as never)
  container = document.createElement('div')
  document.body.append(container)
  review = reactive({
    id: 119, is_deleted: false, content: '主评价正文', rating: 4, created_time: '', modified_time: '', edited: false,
    difficulty: 3, homework: 3, grade: 3, reward: 3, semester: '2026-秋',
    author: { id: 2, nickname: '同学', avatar: '', anonymous: false, is_student: false },
    like: { like: 0, dislike: 0, user_option: 0 },
    reply_count: 4,
    reply_next_cursor: null,
    reply: [makeReply(3, 2), makeReply(1), makeReply(2, 1), makeReply(4)],
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
  it('shows existing replies by default and preserves their nodes when the footer collapses them', async () => {
    await mount()
    expect(section().style.display).not.toBe('none')
    expect(branch(1)).toBeTruthy()
    expect(scroll).not.toHaveBeenCalled()
    expect(container.textContent).not.toContain('登录以后才能回复')

    await expandReplies()
    expect(section().style.display).not.toBe('none')
    expect(button('button', '收起回复').getAttribute('aria-expanded')).toBe('true')
    button('button', '收起回复').click()
    await flush()
    expect(section().style.display).toBe('none')
    expect(branch(3)).toBeTruthy()
  })

  it('shows only the first five sibling replies and expands the loaded remainder without a request', async () => {
    makeSevenReplies()
    await mount()
    expect(visibleReplyIds()).toEqual([1, 2, 3, 4, 5])
    expect(container.querySelectorAll('[data-reply-card]')).toHaveLength(7)
    const more = button('button', '展开更多回复（另 2 条）')
    expect(more.getAttribute('aria-expanded')).toBe('false')
    expect(more.getAttribute('aria-controls')).toBe('review-reply-list-119')
    more.click()
    await flush()
    expect(visibleReplyIds()).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(api.get).not.toHaveBeenCalled()
    expect(button('button', '收起多余回复').getAttribute('aria-expanded')).toBe('true')
    button('button', '收起多余回复').click()
    await flush()
    expect(visibleReplyIds()).toEqual([1, 2, 3, 4, 5])
  })

  it('counts nested replies toward the five-reply limit rather than limiting only root conversations', async () => {
    makeSevenReplies()
    review.reply = [makeReply(1), ...Array.from({ length: 6 }, (_, index) => makeReply(index + 2, 1))]
    await mount()
    expect(branch(1).contains(branch(7))).toBe(true)
    expect(visibleReplyIds()).toEqual([1, 2, 3, 4, 5])
    button('button', '展开更多回复（另 2 条）').click()
    await flush()
    expect(visibleReplyIds()).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('applies the five-reply limit to the selected reply order', async () => {
    makeSevenReplies()
    await mount()
    button('button', '最早回复').click()
    await flush()
    expect(visibleReplyIds()).toEqual([7, 6, 5, 4, 3])
    expect(button('button', '展开更多回复（另 2 条）')).toBeTruthy()
  })

  it('keeps the five-reply limit while writing a visible reply or a root reply', async () => {
    makeSevenReplies()
    await mount()
    button('[data-reply-card="2"] button', '回复').click()
    await flush()
    expect(visibleReplyIds()).toEqual([1, 2, 3, 4, 5])
    expect(container.querySelector('textarea')?.getAttribute('aria-label')).toBe('回复 同学')
    button('button', '取消').click()
    await flush()
    button('button', '回复评价').click()
    await flush()
    expect(visibleReplyIds()).toEqual([1, 2, 3, 4, 5])
    expect(container.querySelector('textarea')?.getAttribute('aria-label')).toBe('回复评价')
  })

  it('preserves a reply draft beyond the fifth reply when the extra replies are collapsed', async () => {
    makeSevenReplies()
    await mount()
    button('button', '展开更多回复（另 2 条）').click()
    await flush()
    button('[data-reply-card="7"] button', '回复').click()
    await flush()
    const textarea = container.querySelector('textarea')!
    textarea.value = '第七条回复的草稿'
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
    await flush()
    button('button', '收起多余回复').click()
    await flush()
    expect(visibleReplyIds()).toEqual([1, 2, 3, 4, 5])
    expect(container.querySelector('textarea')).toBe(textarea)
    button('button', '展开更多回复（另 2 条）').click()
    await flush()
    expect(visibleReplyIds()).toContain(7)
    expect(container.querySelector('textarea')?.value).toBe('第七条回复的草稿')
  })

  it('opens the first reply input directly and returns to reading after that reply is submitted', async () => {
    review.reply_count = 0
    review.reply = []
    vi.mocked(api.post).mockResolvedValue({ status: 201, data: { message: '成功创建课程评价回复', contents: { reply_id: 5 } } } as never)
    await mount()
    await expandReplies()
    expect(section().style.display).not.toBe('none')
    expect(container.querySelector('textarea')?.getAttribute('aria-label')).toBe('回复评价')
    expect(document.activeElement).toBe(container.querySelector('textarea'))
    const textarea = container.querySelector('textarea')!
    textarea.value = '第一条回复'
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
    await flush()
    button('button', '发表回复').click()
    await flush()
    expect(review.reply_count).toBe(1)
    expect(review.reply.map(reply => reply.id)).toEqual([5])
    expect(container.querySelector('textarea')).toBeNull()
    button('button', '收起回复').click()
    await flush()
    await expandReplies()
    expect(section().style.display).not.toBe('none')
    expect(container.querySelector('textarea')).toBeNull()
    expect(container.querySelector('[data-reply-card="5"]')?.textContent).toContain('第一条回复')
  })

  it('preserves the open reply and draft when the entire conversation is collapsed', async () => {
    await mount()
    await expandReplies()
    button('button', '回复评价').click()
    await flush()
    const textarea = container.querySelector('textarea')!
    textarea.value = '稍后再发表的回复'
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
    await flush()
    button('button', '收起回复').click()
    await flush()
    expect(section().style.display).toBe('none')
    expect(container.querySelector('textarea')).toBe(textarea)
    await expandReplies()
    expect(container.querySelector('textarea')?.value).toBe('稍后再发表的回复')
  })

  it('lets visitors expand the conversation and prompts only when they try to reply', async () => {
    loggedIn.value = false
    await mount()
    await expandReplies()
    expect(section().style.display).not.toBe('none')
    expect(mocks.error).not.toHaveBeenCalled()
    button('button', '回复评价').click()
    await flush()
    expect(mocks.error).toHaveBeenCalledWith('请先登录后再回复')
    expect(container.querySelector('textarea')).toBeNull()
  })

  it('keeps an empty conversation closed when a visitor tries to reply', async () => {
    review.reply_count = 0
    review.reply = []
    loggedIn.value = false
    await mount()
    await expandReplies()
    expect(section().style.display).toBe('none')
    expect(mocks.error).toHaveBeenCalledWith('请先登录后再回复')
    expect(container.querySelector('textarea')).toBeNull()
  })

  it('preserves the main review and replies when either Shadcn delete confirmation is canceled', async () => {
    mocks.confirm.mockResolvedValue(false)
    await mount()
    button('button[aria-label="删除主评价"]').click()
    await flush()
    expect(mocks.confirm).toHaveBeenCalledWith(expect.objectContaining({ title: '删除评价', destructive: true }))
    expect(api.delete).not.toHaveBeenCalled()
    expect(review.is_deleted).toBe(false)

    await expandReplies()
    button('[data-reply-card="1"] button', '删除').click()
    await flush()
    expect(mocks.confirm).toHaveBeenCalledWith(expect.objectContaining({ title: '删除回复', destructive: true }))
    expect(api.delete).not.toHaveBeenCalled()
    expect(review.reply.find(item => item.id === 1)?.is_deleted).toBe(false)
    expect(branch(1).contains(branch(3))).toBe(true)
  })

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
    await expandReplies()
    button('[data-reply-card="2"] button', '回复').click()
    await flush()
    expect(container.querySelector('textarea')?.getAttribute('aria-label')).toBe('回复 同学')
  })

  it('collapses only the selected reply branch while keeping the review and other conversations visible', async () => {
    await mount()
    await expandReplies()
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
    await expandReplies()
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
    expect(review.reply_count).toBe(5)
    expect(container.querySelector('textarea')).toBeNull()
    expect(scroll).not.toHaveBeenCalled()
  })

  it('does not duplicate the reply or increment its count when a submitted id is already loaded', async () => {
    vi.mocked(api.post).mockResolvedValue({ status: 201, data: { message: '成功创建课程评价回复', contents: { reply_id: 4 } } } as never)
    await mount()
    await expandReplies()
    button('button', '回复评价').click()
    await flush()
    const textarea = container.querySelector('textarea')!
    textarea.value = '服务器已经返回过的回复'
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
    await flush()
    button('button', '发表回复').click()
    await flush()
    expect(review.reply_count).toBe(4)
    expect(review.reply.filter(reply => reply.id === 4)).toHaveLength(1)
    expect(review.reply.find(reply => reply.id === 4)?.content).toBe('回复内容4')
    expect(container.querySelector('textarea')).toBeNull()
  })

  it('reveals a newly submitted reply beyond the five-reply limit', async () => {
    makeSevenReplies()
    vi.mocked(api.post).mockResolvedValue({ status: 201, data: { message: '成功创建课程评价回复', contents: { reply_id: 8 } } } as never)
    await mount()
    button('button', '回复评价').click()
    await flush()
    expect(visibleReplyIds()).toHaveLength(5)
    const textarea = container.querySelector('textarea')!
    textarea.value = '新发表的第八条回复'
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
    await flush()
    button('button', '发表回复').click()
    await flush()
    expect(review.reply_count).toBe(8)
    expect(visibleReplyIds()).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(container.querySelector('textarea')).toBeNull()
  })

  it('preserves a draft when its branch is collapsed and keeps descendants after deleting the parent', async () => {
    vi.mocked(api.delete).mockResolvedValue({ status: 200 } as never)
    await mount()
    await expandReplies()
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

  it('restores an automatic reply draft and requires confirmation before clearing it', async () => {
    saveCourseReviewReplyDraft(2, 119, 2, { content: '自动保存的回复', updatedAt: '' })
    await mount()
    await expandReplies()
    button('[data-reply-card="2"] button', '回复').click()
    await flush()
    expect(container.querySelector('textarea')?.value).toBe('自动保存的回复')

    button('button', '清空草稿').click()
    await flush()
    expect(container.querySelector('textarea')?.value).toBe('自动保存的回复')
    expect(loadCourseReviewReplyDraft(2, 119, 2)).not.toBeNull()

    button('button', '确认清空').click()
    await flush()
    expect(container.querySelector('textarea')?.value).toBe('')
    expect(loadCourseReviewReplyDraft(2, 119, 2)).toBeNull()
  })

  it('reopens ancestors for incoming notification links without introducing reply-to-reply jump controls', async () => {
    const router = await mount()
    await expandReplies()
    button('button[aria-label="折叠第1楼回复"]').click()
    await flush()
    button('button', '收起回复').click()
    await flush()
    await router.push('/review/course/42#reply-3')
    await flush()
    expect(section().style.display).not.toBe('none')
    expect(branch(1).style.display).not.toBe('none')
    expect(scroll).toHaveBeenCalledTimes(1)
  })

  it('loads a missing linked reply and expands its own conversation before focusing it', async () => {
    review.reply = [makeReply(1)]
    review.reply_count = 3
    vi.mocked(api.get).mockResolvedValue({ status: 200, content: { results: [makeReply(2, 1), makeReply(3, 2)], count: 3, next_cursor: null } } as never)
    await mount('#reply-3')
    expect(api.get).toHaveBeenCalledWith({ url: '/api/assessment/reply/:id/', params: { id: 119 }, query: { target: 3 } })
    expect(section().style.display).not.toBe('none')
    expect(branch(1).contains(branch(3))).toBe(true)
    expect(scroll).toHaveBeenCalledTimes(1)
  })

  it('reveals a linked reply beyond the fifth node together with its ancestor chain', async () => {
    review.reply = Array.from({ length: 7 }, (_, index) => makeReply(index + 1, index))
    review.reply_count = 7
    await mount('#reply-7')
    expect(visibleReplyIds()).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(branch(1).contains(branch(7))).toBe(true)
    expect(scroll).toHaveBeenCalledTimes(1)
    expect(api.get).not.toHaveBeenCalled()
  })

  it('keeps additional replies hidden when loading does not find the linked reply', async () => {
    makeSevenReplies()
    vi.mocked(api.get).mockResolvedValue({ status: 200, content: { results: [], count: 7, next_cursor: null } } as never)
    await mount('#reply-99')
    expect(visibleReplyIds()).toEqual([1, 2, 3, 4, 5])
    expect(button('button', '展开更多回复（另 2 条）')).toBeTruthy()
    expect(scroll).not.toHaveBeenCalled()
  })

  it('ignores an old linked-reply response after the route hash changes', async () => {
    let resolve!: (response: never) => void
    vi.mocked(api.get).mockReturnValue(new Promise(res => { resolve = res }))
    const router = await mount('#reply-99')
    button('button', '收起回复').click()
    await flush()
    await router.push('/review/course/42')
    await flush()
    resolve({ status: 200, content: { results: [makeReply(99)], count: 5, next_cursor: null } } as never)
    await flush()
    expect(section().style.display).toBe('none')
    expect(scroll).not.toHaveBeenCalled()
  })

  it('appends later reply pages without duplicating existing replies or disturbing the tree', async () => {
    review.reply = [makeReply(1), makeReply(2, 1)]
    review.reply_next_cursor = 2
    vi.mocked(api.get).mockResolvedValue({ status: 200, content: { results: [makeReply(2, 1), makeReply(3, 2), makeReply(4)], count: 4, next_cursor: null } } as never)
    await mount()
    await expandReplies()
    button('button', '加载更多（已显示 2/4）').click()
    await flush()
    expect(api.get).toHaveBeenCalledWith({ url: '/api/assessment/reply/:id/', params: { id: 119 }, query: { after: 2 } })
    expect(review.reply.map(reply => reply.id)).toEqual([1, 2, 3, 4])
    expect(branch(1).contains(branch(3))).toBe(true)
    expect([...container.querySelectorAll('button')].some(item => item.textContent?.includes('加载更多'))).toBe(false)
  })

  it('expands the loaded remainder before requesting just the next server page', async () => {
    makeSevenReplies()
    review.reply_count = 12
    review.reply_next_cursor = 7
    vi.mocked(api.get).mockResolvedValue({ status: 200, content: { results: [makeReply(8), makeReply(9)], count: 12, next_cursor: 9 } } as never)
    await mount()
    expect(visibleReplyIds()).toHaveLength(5)
    expect([...container.querySelectorAll('button')].some(item => item.textContent?.includes('加载更多'))).toBe(false)
    button('button', '展开更多回复（另 2 条）').click()
    await flush()
    expect(api.get).not.toHaveBeenCalled()
    button('button', '加载更多（已显示 7/12）').click()
    await flush()
    expect(api.get).toHaveBeenCalledTimes(1)
    expect(api.get).toHaveBeenCalledWith({ url: '/api/assessment/reply/:id/', params: { id: 119 }, query: { after: 7 } })
    expect(visibleReplyIds()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(button('button', '加载更多（已显示 9/12）')).toBeTruthy()
    button('button', '收起多余回复').click()
    await flush()
    expect(visibleReplyIds()).toHaveLength(5)
  })

  it('keeps extra replies collapsed when a pending next-page request finishes', async () => {
    makeSevenReplies()
    review.reply_count = 12
    review.reply_next_cursor = 7
    let resolve!: (response: never) => void
    vi.mocked(api.get).mockReturnValue(new Promise(res => { resolve = res }))
    await mount()
    button('button', '展开更多回复（另 2 条）').click()
    await flush()
    button('button', '加载更多（已显示 7/12）').click()
    await flush()
    button('button', '收起多余回复').click()
    await flush()
    resolve({ status: 200, content: { results: [makeReply(8), makeReply(9)], count: 12, next_cursor: 9 } } as never)
    await flush()
    expect(visibleReplyIds()).toEqual([1, 2, 3, 4, 5])
    expect(review.reply).toHaveLength(9)
    expect(button('button', '展开更多回复（另 4 条）')).toBeTruthy()
  })
})
