import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, type App, type Component } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import HomeReviewPreview from '@/components/courseReview/HomeReviewPreview.vue'
import GuestbookPreview from '@/components/guestbook/GuestbookPreview.vue'
import { api } from '@/lib/requests'
import type { GuestbookEntry } from '@/types/api/guestbook'
import type { APILatestReviews } from '@/types/api/courseReview/review'

vi.mock('@/lib/requests', () => ({ api: { get: vi.fn() } }))
vi.mock('@/components/common/UserAvatar.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/tinyComponents/Time.vue', async () => {
  const { h } = await import('vue')
  return {
    default: {
      props: ['time'],
      setup: (props: { time: string }) => () => h('time', props.time),
    },
  }
})

const flush = async () => {
  for (let index = 0; index < 10; index += 1) {
    await Promise.resolve()
    await nextTick()
  }
}

const review: APILatestReviews['response']['results'][number] = {
  id: 7,
  author: {
    id: 3,
    nickname: '测试同学',
    avatar_uuid: '',
    is_student: true,
  },
  datetime: '2026-09-04T08:00:00Z',
  course: { id: 42, name: '数据结构与算法', semester: '2026-2027-1' },
  content: '<p>讲解清晰，作业反馈及时。</p>',
  teachers: [{ id: 8, name: '张老师' }],
  edited: false,
}

const guestbookEntry: GuestbookEntry = {
  id: 11,
  root_id: null,
  parent_id: null,
  content: '<p>图书馆自习区近期是否调整？</p>',
  anonymous: false,
  is_deleted: false,
  created_at: '2026-09-04T09:00:00Z',
  like_count: 12,
  reply_count: 3,
  children_count: 3,
  author: { id: 5, nickname: '西大路人', avatar: null },
  is_me: false,
  liked_by_me: false,
}

let app: App | undefined
let container: HTMLDivElement

const mount = async (component: Component) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { render: () => null } },
      { path: '/review/timeline', component: { render: () => null } },
      { path: '/review/course/:id', name: 'courseReviewItem', component: { render: () => null } },
      { path: '/review/teacher/:id', component: { render: () => null } },
      { path: '/user/:id', component: { render: () => null } },
      { path: '/guestbook/:id', component: { render: () => null } },
    ],
  })
  await router.push('/')
  app = createApp({ render: () => h(component) }).use(router)
  app.mount(container)
  await flush()
}

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

describe('homepage previews', () => {
  it('renders recent reviews and links the course title to the exact review', async () => {
    vi.mocked(api.get).mockResolvedValue({
      status: 200,
      content: { results: [review] },
    } as never)

    await mount(HomeReviewPreview)

    expect(api.get).toHaveBeenCalledWith({
      url: '/api/assessment/latest-review/',
      query: { page: 1, pageSize: 3, desc: 1 },
    })
    expect(container.textContent).toContain('数据结构与算法')
    expect(container.textContent).toContain('讲解清晰，作业反馈及时。')
    expect(container.querySelector('a[href="/review/course/42#review-7"]')).not.toBeNull()
  })

  it('shows the review error state and retries into the empty state', async () => {
    vi.mocked(api.get)
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({ status: 200, content: { results: [] } } as never)

    await mount(HomeReviewPreview)
    expect(container.textContent).toContain('最近评价加载失败')

    ;(container.querySelector('button') as HTMLButtonElement).click()
    await flush()

    expect(api.get).toHaveBeenCalledTimes(2)
    expect(container.textContent).toContain('暂时还没有课程评价')
  })

  it('renders the guestbook preview with message metadata and detail link', async () => {
    vi.mocked(api.get).mockResolvedValue({
      status: 200,
      content: { results: [guestbookEntry] },
    } as never)

    await mount(GuestbookPreview)

    expect(api.get).toHaveBeenCalledWith({
      url: '/api/guestbook/',
      query: { page: 1, pageSize: 3 },
    })
    expect(container.textContent).toContain('图书馆自习区近期是否调整？')
    expect(container.textContent).toContain('12')
    expect(container.textContent).toContain('3')
    expect(container.querySelector('a[href="/guestbook/11"]')).not.toBeNull()
  })

  it('shows guestbook error and empty states without hiding retry', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ status: 404, content: {} } as never)
      .mockResolvedValueOnce({ status: 200, content: { results: [] } } as never)

    await mount(GuestbookPreview)
    expect(container.textContent).toContain('留言加载失败')

    ;(container.querySelector('button') as HTMLButtonElement).click()
    await flush()

    expect(api.get).toHaveBeenCalledTimes(2)
    expect(container.textContent).toContain('还没有留言')
  })
})
