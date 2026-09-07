import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, type App } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import ReplyList from './ReplyList.vue'
import { api } from '@/lib/requests'

vi.mock('@/lib/requests', () => ({ api: { get: vi.fn() } }))
vi.mock('@/components/tinyComponents/Time.vue', () => ({
  default: { render: () => null },
}))
vi.mock('@/components/tinyComponents/ReviewPlainText.vue', () => ({
  default: { render: () => null },
}))

const flush = async () => {
  for (let index = 0; index < 10; index += 1) {
    await Promise.resolve()
    await nextTick()
  }
}

let app: App | undefined
let container: HTMLDivElement

beforeEach(() => {
  vi.clearAllMocks()
  container = document.createElement('div')
  document.body.append(container)
})

afterEach(() => {
  app?.unmount()
  app = undefined
  container.remove()
})

describe('profile reply list', () => {
  it('links a profile comment to the exact reply on the course page', async () => {
    vi.mocked(api.get).mockResolvedValue({
      status: 200,
      content: {
        page: 1,
        max_page: 1,
        count: 1,
        results: [{
          id: 73,
          review: {
            author: {
              nickname: '同学',
              id: 2,
              avatar_uuid: '',
              is_student: true,
            },
            content: '评价正文',
          },
          datetime: '2026-09-07T08:00:00Z',
          course: { name: '数据结构', id: 42, semester: '2026-2027-1' },
          reply: { id: 73, content: '我的评论' },
          like: { like: 0, dislike: 0 },
        }],
      },
    } as never)

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/user/:id', component: { render: () => null } },
        {
          path: '/review/course/:id',
          name: 'courseReviewItem',
          component: { render: () => null },
        },
      ],
    })
    await router.push('/user/2')
    app = createApp({ render: () => h(ReplyList, { id: '2' }) })
      .use(router)
      .component('n-pagination', { render: () => null })
    app.mount(container)
    await router.isReady()
    await flush()

    expect(container.querySelector('a')?.getAttribute('href')).toBe(
      '/review/course/42#reply-73',
    )

    const viewOriginalButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === '查看原文',
    )
    expect(viewOriginalButton).toBeDefined()
    const pushSpy = vi.spyOn(router, 'push')
    viewOriginalButton?.click()
    await flush()
    expect(pushSpy).toHaveBeenCalledWith({
      name: 'courseReviewItem',
      params: { id: 42 },
      hash: '#reply-73',
    })
  })
})
