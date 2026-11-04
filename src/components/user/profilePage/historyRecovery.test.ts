import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, type App } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import ReviewList from './ReviewList.vue'
import ReplyList from './ReplyList.vue'
const mocks = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('@/lib/requests', () => ({ api: { get: mocks.get } }))
let app: App
let container: HTMLDivElement
const flush = async () => { for (let i = 0; i < 12; i++) { await Promise.resolve(); await nextTick() } }
beforeEach(() => { mocks.get.mockReset(); container = document.createElement('div'); document.body.append(container) })
afterEach(() => { app?.unmount(); container.remove() })
describe('profile activity retry', () => {
  it.each([['reviews', ReviewList], ['replies', ReplyList]] as const)('recovers %s without losing page or page size', async (_name, component) => {
    mocks.get.mockResolvedValueOnce({ status: 503 })
    const content = { results: [], page: 2, max_page: 2, count: 0 }
    mocks.get.mockResolvedValueOnce({ status: 200, content, data: { contents: content } })
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/user/:id', component: { render: () => null } }] })
    await router.push('/user/2?page=2&pageSize=20')
    app = createApp({ render: () => h(component, { id: '2' }) }).use(router); app.mount(container); await flush()
    expect(container.querySelector('[role="alert"]')).not.toBeNull()
    container.querySelector<HTMLButtonElement>('[role="alert"] button')!.click(); await flush()
    expect(container.querySelector('[role="alert"]')).toBeNull()
    expect(container.textContent).toContain('暂无')
    expect(mocks.get).toHaveBeenLastCalledWith(expect.objectContaining({ params: { id: 2 }, query: { page: 2, page_size: 20 } }))
  })
})
