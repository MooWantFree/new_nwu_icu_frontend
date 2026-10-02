import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, type App } from 'vue'
import { createMemoryHistory, createRouter, RouterView, type Router } from 'vue-router'
import type { APISystemNotificationList } from '@/types/api/messages/messages'
import SystemNotifications from './SystemNotifications.vue'

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), error: vi.fn(), fetchUnreadCount: vi.fn() }))
vi.mock('@/lib/requests', () => ({ api: { get: mocks.get, post: mocks.post } }))
vi.mock('naive-ui', () => ({ useMessage: () => ({ error: mocks.error }) }))
vi.mock('@/lib/useUser', () => ({ useUser: () => ({ fetchUnreadCount: mocks.fetchUnreadCount }) }))
vi.mock('@/components/tinyComponents/Time.vue', () => ({ default: { render: () => null } }))

type Notice = APISystemNotificationList['response']['results'][number]
const notice = (page: number): Notice => ({
  id: page, title: `第${page}页标题`, content: `第${page}页通知`, datetime: '2026-09-21T00:00:00Z',
})
const response = (page: number, results: Notice[] = [notice(page)]) => ({
  status: 200,
  content: { page, count: results.length ? 20 : 0, max_page: results.length ? 2 : 0, results },
})
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
  mocks.get.mockReset().mockImplementation(({ query }) => Promise.resolve(response(query.page)))
  mocks.post.mockReset().mockResolvedValue({ status: 200, content: { updated: 1 } })
  mocks.error.mockReset()
  mocks.fetchUnreadCount.mockReset().mockResolvedValue(undefined)
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  container = document.createElement('div')
  document.body.append(container)
})
afterEach(() => {
  app?.unmount()
  app = undefined
  container.remove()
  vi.restoreAllMocks()
})

const mount = async (path = '/message/system') => {
  const router = createRouter({ history: createMemoryHistory(), routes: [
    { path: '/message/system', component: SystemNotifications },
    { path: '/announcements/:id', component: { render: () => h('p', 'announcement detail') } },
  ] })
  await router.push(path)
  app = createApp(RouterView).use(router)
  app.component('NPagination', defineComponent({
    props: ['page'], emits: ['update:page'],
    setup: (props, { emit }) => () => h('nav', [
      h('span', { 'data-page': '' }, String(props.page)),
      h('button', { 'data-next': '', onClick: () => emit('update:page', 2) }, 'page 2'),
    ]),
  }))
  app.mount(container)
  await flush()
  return router
}
const nextPage = async () => {
  container.querySelector<HTMLButtonElement>('[data-next]')!.click()
  await flush()
}
const refresh = async () => {
  container.querySelector<HTMLButtonElement>('button[aria-label="刷新系统通知"]')!.click()
  await flush()
}
const goBack = async (router: Router) => {
  await new Promise<void>(resolve => {
    const stop = router.afterEach(() => { stop(); resolve() })
    router.back()
  })
  await flush()
}

describe('unified system notifications', () => {
  it('shows mixed notices in one list, sanitizes announcement HTML, and escapes other content', async () => {
    const imagePath = '/api/download/12345678-1234-1234-1234-123456789abc/'
    mocks.get.mockResolvedValue(response(1, [
      { ...notice(3), title: '资料审核通过', content: '<strong>审核结果</strong>' },
      {
        ...notice(2), title: '新公告', source: 'announcement', target_url: '/announcements/92',
        content: `<p><strong>公告正文</strong></p><script>alert(1)</script>`
          + `<img src="${imagePath}" data-size="75" onerror="alert(1)">`
          + '<img src="https://example.com/tracker.png">'
          + '<a href="javascript:alert(1)">危险链接</a>'
          + '<a href="https://example.com/safe">安全链接</a>',
      },
      { ...notice(1), title: '旧公告', source: 'bulletin', content: '<em>旧公告原文</em>' },
    ]))
    mocks.post.mockImplementation(() => {
      expect(container.querySelectorAll('article')).toHaveLength(3)
      return Promise.resolve({ status: 200, content: { updated: 3 } })
    })
    await mount()

    expect(mocks.get).toHaveBeenCalledExactlyOnceWith({ url: '/api/message/system/', query: { page: 1 } })
    expect([...container.querySelectorAll('article h2')].map(item => item.textContent))
      .toEqual(['资料审核通过', '新公告', '旧公告'])
    expect(container.textContent).not.toContain('个人通知')
    expect(container.querySelector('#bulletins-title')).toBeNull()
    const articles = container.querySelectorAll('article')
    expect(articles[0].textContent).toContain('<strong>审核结果</strong>')
    expect(articles[0].querySelector('strong')).toBeNull()
    expect(articles[2].textContent).toContain('<em>旧公告原文</em>')
    expect(articles[2].querySelector('em')).toBeNull()
    const content = articles[1].querySelector('.system-notification-content')!
    expect(content.querySelector('strong')?.textContent).toBe('公告正文')
    expect(content.querySelector('script')).toBeNull()
    expect(content.querySelectorAll('img')).toHaveLength(1)
    expect(content.querySelector('img')?.getAttribute('src')).toBe(imagePath)
    expect(content.querySelector('img')?.getAttribute('data-size')).toBe('75')
    expect(content.querySelector('[onerror]')).toBeNull()
    expect(content.querySelectorAll('a')).toHaveLength(1)
    expect(content.querySelector('a')?.getAttribute('target')).toBe('_blank')
    expect(content.querySelector('a')?.getAttribute('rel')).toBe('noopener noreferrer')
    expect(articles[1].querySelector('a[href="/announcements/92"]')).not.toBeNull()
    expect(mocks.post).toHaveBeenCalledExactlyOnceWith({
      url: '/api/message/notifications/read/', query: { ids: [3, 2, 1] },
    })
    expect(mocks.fetchUnreadCount).toHaveBeenCalledOnce()
  })

  it('keeps a hidden announcement placeholder without a detail link and marks its notice read', async () => {
    mocks.get.mockResolvedValue(response(1, [{
      ...notice(8), source: 'announcement', title: '公告', content: '[公告已隐藏]',
    }]))
    await mount()
    expect(container.textContent).toContain('[公告已隐藏]')
    expect(container.querySelector('article a')).toBeNull()
    expect(mocks.post).toHaveBeenCalledWith(expect.objectContaining({ query: { ids: [8] } }))
  })

  it('shows one empty state without marking notifications read', async () => {
    mocks.get.mockResolvedValue(response(1, []))
    await mount()
    expect(container.textContent).toContain('暂无系统通知')
    expect(container.querySelector('footer')).toBeNull()
    expect(mocks.post).not.toHaveBeenCalled()
    expect(mocks.fetchUnreadCount).not.toHaveBeenCalled()
  })

  it.each(['rejection', 'non-success status'])('preserves displayed notices when read fails with %s', async failure => {
    if (failure === 'rejection') mocks.post.mockRejectedValue(new Error('read failed'))
    else mocks.post.mockResolvedValue({ status: 500 })
    await mount()
    expect(container.textContent).toContain('第1页通知')
    expect(mocks.error).toHaveBeenCalledExactlyOnceWith('标记系统通知已读失败，请刷新重试')
    expect(mocks.fetchUnreadCount).not.toHaveBeenCalled()
  })

  it('preserves the last successful page after a failed fetch and allows retrying the requested page', async () => {
    await mount()
    mocks.post.mockClear()
    mocks.get.mockRejectedValueOnce(new Error('page failed'))
    await nextPage()
    expect(container.textContent).toContain('第1页通知')
    expect(container.querySelector('[data-page]')?.textContent).toBe('1')
    expect(mocks.post).not.toHaveBeenCalled()
    expect(mocks.error).toHaveBeenCalledExactlyOnceWith('获取系统通知失败')
    await nextPage()
    expect(container.querySelector('[data-page]')?.textContent).toBe('2')
    expect(container.textContent).toContain('第2页通知')
    expect(mocks.post).toHaveBeenCalledWith(expect.objectContaining({ query: { ids: [2] } }))
  })

  it('refreshes the current route page and only marks its notifications read', async () => {
    await mount('/message/system?page=2')
    mocks.get.mockClear()
    mocks.post.mockClear()
    await refresh()
    expect(mocks.get).toHaveBeenCalledExactlyOnceWith({ url: '/api/message/system/', query: { page: 2 } })
    expect(mocks.post).toHaveBeenCalledExactlyOnceWith({
      url: '/api/message/notifications/read/', query: { ids: [2] },
    })
  })

  it.each(['0', '-1', 'invalid', '1.5'])('defaults invalid route page %s to page one', async page => {
    await mount(`/message/system?page=${page}`)
    expect(mocks.get).toHaveBeenCalledWith({ url: '/api/message/system/', query: { page: 1 } })
  })

  it('ignores old page results and does not mark stale notifications read', async () => {
    await mount()
    mocks.post.mockClear()
    mocks.fetchUnreadCount.mockClear()
    const old = deferred(), latest = deferred()
    mocks.get.mockReturnValueOnce(old.promise).mockReturnValueOnce(latest.promise)
    await refresh()
    await nextPage()
    old.resolve(response(1))
    await flush()
    expect(container.querySelector('article')).toBeNull()
    expect(mocks.post).not.toHaveBeenCalled()
    latest.resolve(response(2))
    await flush()
    expect(container.querySelector('[data-page]')?.textContent).toBe('2')
    expect(container.textContent).toContain('第2页通知')
    expect(mocks.post).toHaveBeenCalledExactlyOnceWith({
      url: '/api/message/notifications/read/', query: { ids: [2] },
    })
    expect(mocks.fetchUnreadCount).toHaveBeenCalledOnce()
  })

  it('keeps the latest results when an earlier refresh fails', async () => {
    await mount()
    const old = deferred(), latest = deferred()
    mocks.get.mockReturnValueOnce(old.promise).mockReturnValueOnce(latest.promise)
    await refresh()
    await nextPage()
    latest.resolve(response(2))
    await flush()
    old.reject(new Error('old request'))
    await flush()
    expect(container.textContent).toContain('第2页通知')
    expect(mocks.error).not.toHaveBeenCalled()
  })

  it('ignores a pending response after navigating away', async () => {
    const router = await mount()
    mocks.post.mockClear()
    mocks.fetchUnreadCount.mockClear()
    const pending = deferred()
    mocks.get.mockReturnValueOnce(pending.promise)
    await refresh()
    await router.push('/announcements/92')
    pending.resolve(response(1))
    await flush()
    expect(container.textContent).toContain('announcement detail')
    expect(mocks.post).not.toHaveBeenCalled()
    expect(mocks.fetchUnreadCount).not.toHaveBeenCalled()
    expect(mocks.error).not.toHaveBeenCalled()
  })

  it('ignores an earlier read failure after a newer page has displayed', async () => {
    await mount()
    const pending = deferred()
    mocks.post.mockReturnValueOnce(pending.promise)
    await refresh()
    await nextPage()
    pending.reject(new Error('old read request'))
    await flush()
    expect(container.textContent).toContain('第2页通知')
    expect(mocks.error).not.toHaveBeenCalled()
  })

  it('restores pagination on back from an announcement and reloads page one on another back', async () => {
    mocks.get.mockImplementation(({ query }) => Promise.resolve(response(query.page, [{
      ...notice(query.page), source: 'announcement', target_url: '/announcements/92',
    }])))
    const router = await mount()
    await nextPage()
    container.querySelector<HTMLAnchorElement>('article a')!.click()
    await flush()
    expect(router.currentRoute.value.path).toBe('/announcements/92')
    await goBack(router)
    expect(container.querySelector('[data-page]')?.textContent).toBe('2')
    expect(container.textContent).toContain('第2页通知')
    await goBack(router)
    expect(container.querySelector('[data-page]')?.textContent).toBe('1')
    expect(container.textContent).toContain('第1页通知')
  })
})
