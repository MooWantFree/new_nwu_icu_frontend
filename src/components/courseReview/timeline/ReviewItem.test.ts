import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, type App } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import ReviewItem from './ReviewItem.vue'
import type { ReviewTimeline } from '@/types/courseReview'

vi.mock('@/components/common/UserAvatar.vue', () => ({ default: { render: () => h('span') } }))
vi.mock('@/components/tinyComponents/Time.vue', () => ({ default: { render: () => h('time') } }))
vi.mock('@/components/tinyComponents/ReviewPlainText.vue', () => ({ default: { render: () => h('p') } }))

const review: ReviewTimeline = {
  id: 1,
  author: { id: 2, nickname: '测试用户', avatar_uuid: '', is_student: false },
  datetime: '2026-09-23T00:00:00Z',
  course: { id: 3, name: '测试课程', semester: '2026 秋' },
  content: '评价',
  teachers: [],
  edited: false,
}

let app: App | undefined
let container: HTMLDivElement | undefined

afterEach(() => {
  app?.unmount()
  container?.remove()
  app = undefined
  container = undefined
})

const mount = async (author: ReviewTimeline['author']) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/review/course/:id', name: 'courseReviewItem', component: { render: () => null } },
      { path: '/user/:id', component: { render: () => null } },
    ],
  })
  await router.push('/review/course/3')
  container = document.createElement('div')
  document.body.append(container)
  app = createApp(ReviewItem, { review: { ...review, author } }).use(router)
  app.component('NTooltip', defineComponent({
    setup: (_, { slots }) => () => h('div', [
      slots.trigger?.(),
      h('span', { class: 'tooltip-content' }, slots.default?.()),
    ]),
  }))
  app.component('NAvatar', defineComponent({ setup: () => () => h('span') }))
  app.mount(container)
  return container
}

describe('course review author status', () => {
  it.each([
    { author: { ...review.author, id: -1, is_student: true }, tooltip: '匿名用户', blueRing: false },
    { author: review.author, tooltip: '普通用户', blueRing: false },
    { author: { ...review.author, is_student: true }, tooltip: '认证用户', blueRing: true },
  ])('shows $tooltip for the corresponding author', async ({ author, tooltip, blueRing }) => {
    const element = await mount(author)
    expect(element.querySelector('.tooltip-content')?.textContent).toBe(tooltip)
    expect(element.querySelector('.ring-blue-500') !== null).toBe(blueRing)
    expect(element.textContent).not.toContain('西大邮箱认证')
  })
})
