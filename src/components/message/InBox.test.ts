import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, type App } from 'vue'
import InBox from './InBox.vue'
import type { APIUserMessageList } from '@/types/api/messages/inbox'
import { createMemoryHistory, createRouter } from 'vue-router'

const mocks = vi.hoisted(() => ({ get: vi.fn(), error: vi.fn() }))
vi.mock('@/lib/requests', () => ({ api: { get: mocks.get } }))
vi.mock('@/lib/useShadcnToast', () => ({ useShadcnToast: () => ({ error: mocks.error }) }))
vi.mock('@/components/common/UserAvatar.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/tinyComponents/Time.vue', () => ({ default: { render: () => null } }))
vi.mock('./ChatView.vue', () => ({ default: defineComponent({
  props: ['chatTarget'], emits: ['read', 'close'],
  setup: (props, { emit }) => () => h('div', { 'data-chat': props.chatTarget.chatter.id }, [
    h('span', props.chatTarget.chatter.nickname),
    h('button', { 'data-read-a': '', onClick: () => emit('read', 2) }, 'read A'),
    h('button', { 'data-close': '', onClick: () => emit('close') }, 'close'),
  ]),
}) }))

const list = (suffix = '') => {
  const contents: APIUserMessageList['response'] = { page: 1, max_page: 1, count: 2, results: [2, 3].map(id => ({
    conversation_id: id, chatter: { id, nickname: `User ${id}${suffix}`, avatar: '', uuid: String(id), has_avatar: false },
    last_message: { id, content: `preview ${id}`, datetime: '2026-09-21T00:00:00Z' }, unread_count: id,
  })) }
  return { status: 200, data: { contents } }
}
const flush = async () => {
  for (let i = 0; i < 40; i++) { await Promise.resolve(); await nextTick() }
}
let app: App | undefined
let container: HTMLDivElement
const mount = async (query = '') => {
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/message/inbox', component: InBox }] })
  await router.push(`/message/inbox${query}`)
  app = createApp(InBox).use(router)
  app.mount(container)
  await flush()
  return router
}
const rows = () => container.querySelectorAll<HTMLButtonElement>('button[aria-label^="与"][aria-label$="的对话"]')

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  mocks.get.mockReset().mockResolvedValue(list())
  container = document.createElement('div')
  document.body.append(container)
})
afterEach(() => {
  app?.unmount()
  app = undefined
  container.remove()
  vi.useRealTimers()
})

describe('inbox conversation refresh', () => {
  it('updates the target on query navigation, ignores old profile responses and handles close/back', async () => {
    const router = await mount()
    let finishOld!: (value: unknown) => void
    let finishLatest!: (value: unknown) => void
    mocks.get.mockReturnValueOnce(new Promise(resolve => { finishOld = resolve }))
      .mockReturnValueOnce(new Promise(resolve => { finishLatest = resolve }))
    await router.push('/message/inbox?talkTo=4')
    await router.push('/message/inbox?talkTo=5')
    await flush()
    expect(container.querySelector('[data-chat]')).toBeNull()
    finishOld({ status: 200, content: { id: 4, nickname: 'User 4', avatar: '', uuid: '4', has_avatar: false } })
    await flush()
    expect(container.querySelector('[data-chat]')).toBeNull()
    finishLatest({ status: 200, content: { id: 5, nickname: 'User 5', avatar: '', uuid: '5', has_avatar: false } })
    await flush()
    expect(container.querySelector('[data-chat="5"]')).not.toBeNull()
    const userTwo = [...rows()].find(row => row.textContent?.includes('User 2'))!
    userTwo.click()
    await flush()
    expect(router.currentRoute.value.query.talkTo).toBe('2')
    container.querySelector<HTMLButtonElement>('[data-close]')!.click()
    await flush()
    expect(router.currentRoute.value.query.talkTo).toBeUndefined()
    expect(container.querySelector('[data-chat]')).toBeNull()
    await new Promise<void>(resolve => { const stop = router.afterEach(() => { stop(); resolve() }); router.back() })
    await flush()
    expect(container.querySelector('[data-chat="2"]')).not.toBeNull()
  })

  it('clears the previous target on an invalid query', async () => {
    const router = await mount()
    rows()[0].click(); await flush()
    await router.push('/message/inbox?talkTo=bad')
    await flush()
    expect(container.querySelector('[data-chat]')).toBeNull()
    expect(mocks.error).toHaveBeenCalledWith('无效的对话对象')
  })
  it('keeps a conversation selected while an earlier list request refreshes its metadata', async () => {
    await mount()
    rows()[0].click()
    await flush()
    let finish!: (result: ReturnType<typeof list>) => void
    mocks.get.mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
    await vi.advanceTimersByTimeAsync(5000)
    rows()[1].click()
    await flush()
    finish(list(' refreshed'))
    await flush()
    expect(container.querySelector('[data-chat="3"]')?.textContent).toContain('User 3 refreshed')
    expect(container.querySelector('[data-chat="2"]')).toBeNull()
  })

  it('applies read events to their own conversation instead of whichever conversation is selected', async () => {
    await mount()
    rows()[1].click()
    await flush()
    container.querySelector<HTMLButtonElement>('[data-read-a]')!.click()
    await flush()
    expect(rows()[0].querySelector('[data-unread-badge]')).toBeNull()
    expect(rows()[1].querySelector('[data-unread-badge]')?.textContent).toBe('3')
  })

  it('offers focusable conversation buttons and exposes the selected conversation', async () => {
    await mount()
    const first = rows()[0]
    expect(first.type).toBe('button')
    expect(first.getAttribute('aria-label')).toBe('与User 2的对话')
    expect(first.getAttribute('aria-pressed')).toBe('false')
    first.focus()
    expect(document.activeElement).toBe(first)
    first.click()
    await flush()
    expect(rows()[0].getAttribute('aria-pressed')).toBe('true')
    expect(rows()[1].getAttribute('aria-pressed')).toBe('false')
    expect(container.querySelector('[data-chat="2"]')).not.toBeNull()
  })

  it('allows retrying an initial list failure without mounting a stale conversation', async () => {
    mocks.get.mockRejectedValueOnce(new Error('connection unavailable'))
    await mount()
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('获取消息失败')
    expect(rows()).toHaveLength(0)
    const retry = [...container.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent?.includes('重新加载'))!
    retry.click()
    await flush()
    expect(rows()).toHaveLength(2)
    expect(container.querySelector('[role="alert"]')).toBeNull()
    expect(container.querySelector('[data-chat]')).toBeNull()
  })

  it('keeps pagination requests bounded while loading the next conversation page', async () => {
    const firstPage = list()
    firstPage.data.contents.max_page = 3
    mocks.get.mockResolvedValueOnce(firstPage)
    await mount()
    expect(container.querySelector<HTMLButtonElement>('[aria-label="上一页"]')?.disabled).toBe(true)
    let finishPage!: (result: ReturnType<typeof list>) => void
    mocks.get.mockReturnValueOnce(new Promise(resolve => { finishPage = resolve }))
    const nextPage = container.querySelector<HTMLButtonElement>('[aria-label="下一页"]')!
    nextPage.click()
    await flush()
    nextPage.click()
    await flush()
    expect(mocks.get).toHaveBeenCalledTimes(2)
    expect(mocks.get).toHaveBeenLastCalledWith({ url: '/api/message/user/', query: { page: 2 } })
    const secondPage = list(' page two')
    secondPage.data.contents.max_page = 3
    secondPage.data.contents.page = 2
    finishPage(secondPage)
    await flush()
    expect(rows()[0].textContent).toContain('User 2 page two')
    expect(container.querySelector<HTMLButtonElement>('[aria-label="上一页"]')?.disabled).toBe(false)
  })

  it('clips the two-pane layout instead of creating a page-level horizontal scrollbar', async () => {
    await mount()
    const root = container.firstElementChild
    const panes = root?.querySelector('[aria-label="会话列表"]')?.parentElement
    expect(root?.classList.contains('min-w-0')).toBe(true)
    expect(root?.classList.contains('overflow-hidden')).toBe(true)
    expect(panes?.classList.contains('min-w-0')).toBe(true)
    expect(panes?.classList.contains('overflow-hidden')).toBe(true)
  })
})
