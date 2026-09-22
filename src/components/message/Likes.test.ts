import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, type App } from 'vue'
import Likes from './Likes.vue'

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), error: vi.fn() }))
vi.mock('@/lib/requests', () => ({ api: { get: mocks.get, post: mocks.post } }))
vi.mock('naive-ui', () => ({ useMessage: () => ({ error: mocks.error }) }))
vi.mock('@/components/tinyComponents/Time.vue', () => ({ default: { render: () => null } }))

let app: App | undefined
let container: HTMLDivElement

const flush = async () => {
  for (let index = 0; index < 5; index += 1) {
    await Promise.resolve()
    await nextTick()
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.get.mockResolvedValue({
    content: {
      page: 1,
      max_page: 1,
      count: 2,
      results: [
        {
          id: 1,
          like: { like: 3, dislike: 0 },
          datetime: '2026-09-22T00:00:00Z',
          raw_info: {
            course: { id: 7, name: '课程 A' },
            raw_post: { classify: 'review', id: 41, content: '评价内容' },
          },
        },
        {
          id: 2,
          like: { like: 2, dislike: 1 },
          datetime: '2026-09-22T00:00:00Z',
          raw_info: {
            course: { id: 8, name: '课程 B' },
            raw_post: { classify: 'reply', id: 52, content: '回复内容' },
          },
        },
      ],
    },
  })
  mocks.post.mockResolvedValue({ status: 200, content: { updated: 2 } })
  container = document.createElement('div')
  document.body.append(container)
})

afterEach(() => {
  app?.unmount()
  app = undefined
  container.remove()
})

describe('like notification targets', () => {
  it('links course likes to the exact review or reply', async () => {
    const RouterLink = defineComponent({
      props: { to: { type: [String, Object], required: true } },
      setup: (props, { slots }) => () => h('a', { 'data-to': String(props.to) }, slots.default?.()),
    })
    app = createApp(Likes)
    app.component('RouterLink', RouterLink)
    app.component('NPagination', defineComponent({ render: () => null }))
    app.mount(container)
    await flush()

    const detailTargets = Array.from(container.querySelectorAll<HTMLAnchorElement>('a'))
      .filter(anchor => anchor.textContent?.includes('查看详情'))
      .map(anchor => anchor.dataset.to)
    expect(detailTargets).toEqual([
      '/review/course/7#review-41',
      '/review/course/8#reply-52',
    ])
  })
})
