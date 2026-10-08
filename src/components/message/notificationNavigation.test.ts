import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, type App } from 'vue'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import Likes from './Likes.vue'
import Replies from './Replies.vue'

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), error: vi.fn() }))
vi.mock('@/lib/requests', () => ({ api: { get: mocks.get, post: mocks.post } }))
vi.mock('@/lib/useShadcnToast', () => ({ useShadcnToast: () => ({ error: mocks.error }) }))
vi.mock('@/components/common/UserAvatar.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/tinyComponents/Time.vue', () => ({ default: { render: () => null } }))
const response = (page: number) => ({ status: 200, content: { page, count: 20, max_page: 2, results: [{
  id: page, source: 'course', datetime: '', created_by: { id: 9, nickname: '回复人', avatar: '' },
  course: { id: 42, name: `第${page}页课程` }, reply: { content: `第${page}页回复` }, raw_post: { id: page, classify: 'review', content: '' },
  raw_info: { course: { id: 42, name: `第${page}页课程` }, raw_post: { id: page, classify: 'review', content: `第${page}页点赞` } }, like: { like: 1, dislike: 0 },
}] } })
const deferred = () => {
  let resolve!: (value: unknown) => void
  let reject!: (error: Error) => void
  const promise = new Promise((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}
const flush = async () => {
  await new Promise(resolve => setTimeout(resolve, 0))
  for (let i = 0; i < 10; i++) { await Promise.resolve(); await nextTick() }
}
let app: App | undefined
let container: HTMLDivElement
beforeEach(() => {
  mocks.get.mockReset().mockResolvedValue(response(1))
  mocks.post.mockReset().mockResolvedValue({ status: 200 })
  mocks.error.mockClear()
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  container = document.createElement('div'); document.body.append(container)
})
afterEach(() => { app?.unmount(); app = undefined; container.remove(); vi.restoreAllMocks() })

for (const [name, component] of [['likes', Likes], ['replies', Replies]] as const) {
  describe(`${name} notification navigation`, () => {
    const mount = async () => {
      const router = createRouter({ history: createMemoryHistory(), routes: [
        { path: `/message/${name}`, component },
        { path: '/user/:id', component: { render: () => null } },
        { path: '/review/course/:id', component: { render: () => h('p', 'course detail') } },
      ] })
      await router.push(`/message/${name}`)
      app = createApp(RouterView).use(router)
      app.mount(container); await flush()
      return router
    }

    it('shows a retryable load error instead of the empty state', async () => {
      mocks.get.mockRejectedValueOnce(new Error('network unavailable'))
      await mount()
      const alert = container.querySelector('[role="alert"]')
      expect(alert?.textContent).toContain(name === 'likes' ? '获取赞列表失败' : '获取回复列表失败')
      expect(container.textContent).not.toContain(name === 'likes' ? '暂无收到的赞' : '暂无收到的回复')
      expect(mocks.post).not.toHaveBeenCalled()
      alert!.querySelector<HTMLButtonElement>('button')!.click()
      await flush()
      expect(container.querySelector('[role="alert"]')).toBeNull()
      expect(container.textContent).toContain(name === 'likes' ? '第1页点赞' : '第1页回复')
      expect(mocks.get).toHaveBeenCalledTimes(2)
      expect(mocks.post).toHaveBeenCalledWith(expect.objectContaining({ query: { ids: [1] } }))
    })

    it('ignores old page results and does not mark stale notifications as read', async () => {
      await mount()
      mocks.post.mockClear()
      const old = deferred(), latest = deferred()
      mocks.get.mockReturnValueOnce(old.promise).mockReturnValueOnce(latest.promise)
      container.querySelector<HTMLButtonElement>('button[aria-label^="刷新"]')!.click(); await flush()
      container.querySelector<HTMLButtonElement>('button[aria-label="下一页"]')!.click(); await flush()
      old.resolve(response(1)); await flush()
      expect(container.querySelector('article')).toBeNull()
      expect(mocks.post).not.toHaveBeenCalled()
      latest.resolve(response(2)); await flush()
      expect(container.querySelector('[aria-current="page"]')?.textContent).toBe('2')
      expect(container.textContent).toContain(name === 'likes' ? '第2页点赞' : '第2页回复')
      expect(mocks.post).toHaveBeenCalledWith(expect.objectContaining({ query: { ids: [2] } }))
    })

    it('keeps the latest results when an earlier refresh fails', async () => {
      await mount()
      const old = deferred(), latest = deferred()
      mocks.get.mockReturnValueOnce(old.promise).mockReturnValueOnce(latest.promise)
      container.querySelector<HTMLButtonElement>('button[aria-label^="刷新"]')!.click(); await flush()
      container.querySelector<HTMLButtonElement>('button[aria-label="下一页"]')!.click(); await flush()
      latest.resolve(response(2)); await flush()
      old.reject(new Error('old request')); await flush()
      expect(container.textContent).toContain(name === 'likes' ? '第2页点赞' : '第2页回复')
      expect(mocks.error).not.toHaveBeenCalled()
    })

    it('restores pagination on back from a course and reloads page one on another back', async () => {
      const router = await mount()
      mocks.get.mockImplementation(({ query }) => Promise.resolve(response(query.page)))
      container.querySelector<HTMLButtonElement>('button[aria-label="下一页"]')!.click(); await flush()
      await router.push('/review/course/42')
      await new Promise<void>(resolve => { const stop = router.afterEach(() => { stop(); resolve() }); router.back() })
      await flush()
      expect(container.querySelector('[aria-current="page"]')?.textContent).toBe('2')
      expect(container.textContent).toContain(name === 'likes' ? '第2页点赞' : '第2页回复')
      await new Promise<void>(resolve => { const stop = router.afterEach(() => { stop(); resolve() }); router.back() })
      await flush()
      expect(container.querySelector('[aria-current="page"]')?.textContent).toBe('1')
      expect(container.textContent).toContain(name === 'likes' ? '第1页点赞' : '第1页回复')
    })
  })
}
