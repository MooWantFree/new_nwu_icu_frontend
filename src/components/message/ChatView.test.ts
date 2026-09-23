import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, ref, type App, type Ref } from 'vue'
import ChatView from './ChatView.vue'
import type { APIUserMessageDetail, APIUserMessageList } from '@/types/api/messages/inbox'

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), error: vi.fn() }))
vi.mock('@/lib/requests', () => ({ api: { get: mocks.get, post: mocks.post } }))
vi.mock('naive-ui', () => ({ useMessage: () => ({ error: mocks.error }) }))
vi.mock('@/lib/useUser', () => ({ useUser: () => ({ userInfo: ref({
  id: 1, nickname: 'Me', avatar: '', uuid: 'me', has_avatar: false,
}) }) }))
vi.mock('@/components/common/UserAvatar.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/tinyComponents/Time.vue', () => ({ default: { render: () => null } }))

type ChatTarget = APIUserMessageList['response']['results'][number]
const target = (id: number): ChatTarget => ({
  conversation_id: id, chatter: { id, nickname: `User ${id}`, avatar: '', uuid: String(id), has_avatar: false },
  last_message: { id: null, content: '', datetime: null }, unread_count: 2,
})
const item = (id: number, chatterId = 2, content = `message ${id}`): APIUserMessageDetail['response']['results'][number] => ({
  id, chatter: target(chatterId).chatter, content, datetime: `2026-09-21T00:00:${String(id).padStart(2, '0')}Z`,
})
const detail = (results = [item(10)], hasMore = false) => ({ status: 200, content: {
  conversation_id: 1, count: results.length, results, has_more: hasMore,
  before_id: results[0]?.id ?? null, after_id: results.at(-1)?.id ?? null,
  snapshot_latest_message_id: results.at(-1)?.id ?? 0,
} })
const deferred = <T,>() => {
  let resolve!: (result: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}
const flush = async () => {
  for (let i = 0; i < 10; i++) { await Promise.resolve(); await nextTick() }
}

let app: App | undefined
let container: HTMLDivElement
let selected: Ref<ChatTarget>
const read = vi.fn()
const mount = async () => {
  selected = ref(target(2))
  app = createApp({ render: () => h(ChatView, { chatTarget: selected.value, onRead: read }) })
  app.mount(container)
  await flush()
}
const switchTo = async (id: number) => { selected.value = target(id); await flush() }
const scroller = () => container.querySelector<HTMLDivElement>('.overflow-y-auto')!
const input = () => container.querySelector<HTMLInputElement>('input')!
const draft = async (content: string) => {
  input().value = content
  input().dispatchEvent(new Event('input', { bubbles: true }))
  await flush()
}
const send = async () => {
  input().dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }))
  await flush()
}
const loadOlder = async () => {
  scroller().scrollTop = 0
  scroller().dispatchEvent(new Event('scroll'))
  await vi.advanceTimersByTimeAsync(200)
  await flush()
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  mocks.get.mockReset().mockResolvedValue(detail())
  mocks.post.mockReset().mockResolvedValue({ status: 200, content: {} })
  container = document.createElement('div')
  document.body.append(container)
})
afterEach(() => {
  app?.unmount()
  app = undefined
  container.remove()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('conversation identity and asynchronous requests', () => {
  it('opens a first conversation without an error and allows the first message', async () => {
    const missingConversation = { status: 404, errors: [{ field: 'chat', err_code: 'chat_not_exist', err_msg: '站内信不存在' }] }
    mocks.get.mockResolvedValueOnce(missingConversation).mockResolvedValueOnce(missingConversation)
      .mockResolvedValueOnce(detail([item(1, 1, 'hello')]))
    mocks.post.mockResolvedValueOnce({ status: 201, content: { message: 1, datetime: '2026-09-21T00:00:01Z' } })

    await mount()
    expect(container.textContent).toContain('没有更多消息了')
    expect(mocks.error).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(5000)
    expect(mocks.error).not.toHaveBeenCalled()

    await draft('hello')
    await send()
    expect(mocks.post).toHaveBeenCalledWith({ url: '/api/message/', query: { receiver: 2, content: 'hello' } })
    expect(container.textContent).toContain('hello')
    await vi.advanceTimersByTimeAsync(5000)
    expect(container.textContent?.match(/hello/g)).toHaveLength(1)
    expect(mocks.error).not.toHaveBeenCalled()
  })

  it('preserves loaded history, draft and scroll when the same conversation object refreshes', async () => {
    mocks.get.mockResolvedValueOnce(detail([item(10)], true)).mockResolvedValueOnce(detail([item(5)]))
    await mount()
    await loadOlder()
    await draft('unfinished')
    scroller().scrollTop = 175
    selected.value = { ...target(2), unread_count: 0 }
    await flush()
    expect(mocks.get).toHaveBeenCalledTimes(2)
    expect(container.textContent).toContain('message 5')
    expect(container.textContent).toContain('message 10')
    expect(input().value).toBe('unfinished')
    expect(scroller().scrollTop).toBe(175)
  })

  it('wraps long unbroken message content inside its bubble', async () => {
    const longContent = `https://nwu.icu/disk/${'%E3%80%91'.repeat(40)}`
    mocks.get.mockResolvedValueOnce(detail([item(10, 2, longContent)]))
    await mount()

    const content = Array.from(container.querySelectorAll('p'))
      .find(element => element.textContent === longContent)
    expect(content?.classList.contains('break-words')).toBe(true)
    expect(content?.classList.contains('[overflow-wrap:anywhere]')).toBe(true)
  })

  it('ignores an obsolete initialization even after switching back to its conversation', async () => {
    const first = deferred<ReturnType<typeof detail>>()
    mocks.get.mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce(detail([item(20, 3, 'B current')]))
      .mockResolvedValueOnce(detail([item(30, 2, 'A current')]))
    await mount()
    await switchTo(3)
    await switchTo(2)
    first.resolve(detail([item(10, 2, 'A obsolete')]))
    await flush()
    expect(container.textContent).toContain('A current')
    expect(container.textContent).not.toContain('A obsolete')
    expect(mocks.post).not.toHaveBeenCalledWith(expect.objectContaining({ query: { through_message_id: 10 } }))
  })

  it('keeps the current initialization loading when an older request fails', async () => {
    const first = deferred<ReturnType<typeof detail>>()
    const second = deferred<ReturnType<typeof detail>>()
    mocks.get.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    await mount()
    await switchTo(3)
    first.reject(new Error('old failed'))
    await flush()
    expect(container.querySelector('.animate-spin')).not.toBeNull()
    expect(mocks.error).not.toHaveBeenCalled()
    second.resolve(detail([item(20, 3, 'B current')]))
    await flush()
    expect(container.textContent).toContain('B current')
  })

  it('does not merge an old history response or release the current history request', async () => {
    const oldA = deferred<ReturnType<typeof detail>>()
    const oldB = deferred<ReturnType<typeof detail>>()
    mocks.get.mockResolvedValueOnce(detail([item(10)], true)).mockReturnValueOnce(oldA.promise)
      .mockResolvedValueOnce(detail([item(20, 3, 'B current')], true)).mockReturnValueOnce(oldB.promise)
    await mount()
    await loadOlder()
    await switchTo(3)
    await loadOlder()
    oldA.resolve(detail([item(5, 2, 'A old')]))
    await flush()
    expect(container.textContent).not.toContain('A old')
    expect(container.textContent).toContain('加载更多消息')
    await loadOlder()
    expect(mocks.get).toHaveBeenCalledTimes(4)
    oldB.resolve(detail([item(15, 3, 'B old')]))
    await flush()
    expect(container.textContent).toContain('B old')
  })

  it('stops draining an obsolete new-message page and retains the new conversation polling state', async () => {
    const oldPoll = deferred<ReturnType<typeof detail>>()
    const newPoll = deferred<ReturnType<typeof detail>>()
    mocks.get.mockResolvedValueOnce(detail()).mockReturnValueOnce(oldPoll.promise)
      .mockResolvedValueOnce(detail([item(20, 3, 'B current')])).mockReturnValueOnce(newPoll.promise)
    await mount()
    await vi.advanceTimersByTimeAsync(5000)
    await switchTo(3)
    await vi.advanceTimersByTimeAsync(5000)
    oldPoll.resolve(detail([item(11, 2, 'A new')], true))
    await flush()
    expect(container.textContent).not.toContain('A new')
    expect(mocks.get).toHaveBeenCalledTimes(4)
    await vi.advanceTimersByTimeAsync(5000)
    expect(mocks.get).toHaveBeenCalledTimes(4)
    newPoll.resolve(detail([item(21, 3, 'B new')]))
    await flush()
    expect(container.textContent).toContain('B new')
    expect(mocks.post).toHaveBeenLastCalledWith({ url: '/api/message/user/:id/read/', params: { id: 3 }, query: { through_message_id: 21 } })
  })

  it('drains all new-message pages using one captured conversation and preserves a history reader position', async () => {
    mocks.get.mockResolvedValueOnce(detail()).mockResolvedValueOnce(detail([item(11)], true))
      .mockResolvedValueOnce(detail([item(12)]))
    await mount()
    Object.defineProperties(scroller(), { scrollHeight: { value: 1000 }, clientHeight: { value: 100 } })
    scroller().scrollTop = 123
    await vi.advanceTimersByTimeAsync(5000)
    await flush()
    expect(container.textContent).toContain('message 11')
    expect(container.textContent).toContain('message 12')
    expect(scroller().scrollTop).toBe(123)
    expect(mocks.get).toHaveBeenNthCalledWith(3, { url: '/api/message/user/:id', params: { id: 2 }, query: { after_id: 11 } })
  })

  it('does not emit an old read acknowledgment for the newly selected conversation', async () => {
    const oldRead = deferred<{ status: number; content: object }>()
    mocks.post.mockReturnValueOnce(oldRead.promise)
    mocks.get.mockResolvedValueOnce(detail()).mockResolvedValueOnce(detail([item(20, 3)]))
    await mount()
    await switchTo(3)
    read.mockClear()
    oldRead.resolve({ status: 200, content: {} })
    await flush()
    expect(read).not.toHaveBeenCalled()
    expect(mocks.post.mock.calls.map(([request]) => request.params.id)).toEqual([2, 3])
  })

  it('polls an empty conversation for its first incoming message without an invalid zero cursor', async () => {
    mocks.get.mockResolvedValueOnce(detail([])).mockResolvedValueOnce(detail([item(1, 2, 'first incoming')]))
    await mount()
    await vi.advanceTimersByTimeAsync(5000)
    await flush()
    expect(mocks.get).toHaveBeenLastCalledWith({ url: '/api/message/user/:id', params: { id: 2 }, query: {} })
    expect(container.textContent).toContain('first incoming')
    expect(read).toHaveBeenCalledWith(2)
  })

  it('does not let sent messages advance the incoming cursor past unseen messages', async () => {
    mocks.get.mockResolvedValueOnce(detail()).mockResolvedValueOnce(detail([item(11, 2, 'unseen incoming'), item(12, 1, 'outgoing')]))
    mocks.post.mockImplementation((request) => Promise.resolve(request.url === '/api/message/'
      ? { status: 201, content: { message: 12, datetime: '2026-09-21T00:00:12Z' } }
      : { status: 200, content: {} }))
    await mount()
    await draft('outgoing')
    await send()
    await vi.advanceTimersByTimeAsync(5000)
    await flush()
    expect(mocks.get).toHaveBeenLastCalledWith({ url: '/api/message/user/:id', params: { id: 2 }, query: { after_id: 10 } })
    expect(container.textContent).toContain('unseen incoming')
    expect(container.textContent?.match(/outgoing/g)).toHaveLength(1)
  })

  it('keeps per-conversation drafts and sending states while responses arrive out of order', async () => {
    const sendA = deferred<{ status: number; content: { message: number; datetime: string } }>()
    const sendB = deferred<{ status: number; content: { message: number; datetime: string } }>()
    mocks.post.mockImplementation((request) => request.url === '/api/message/'
      ? request.query.receiver === 2 ? sendA.promise : sendB.promise
      : Promise.resolve({ status: 200, content: {} }))
    await mount()
    await draft('A draft')
    await switchTo(3)
    expect(input().value).toBe('')
    await draft('B draft')
    await switchTo(2)
    expect(input().value).toBe('A draft')
    await send()
    await switchTo(3)
    expect(input().value).toBe('B draft')
    expect(input().disabled).toBe(false)
    await send()
    sendA.resolve({ status: 201, content: { message: 11, datetime: '2026-09-21T00:00:11Z' } })
    await flush()
    expect(input().value).toBe('B draft')
    expect(input().disabled).toBe(true)
    expect(container.textContent).not.toContain('A draft')
    sendB.resolve({ status: 201, content: { message: 12, datetime: '2026-09-21T00:00:12Z' } })
    await flush()
    expect(input().value).toBe('')
    expect(input().disabled).toBe(false)
    expect(container.textContent).toContain('B draft')
    await switchTo(2)
    expect(input().value).toBe('')
  })

  it('ignores pending responses and debounced scroll work after unmount', async () => {
    const initial = deferred<ReturnType<typeof detail>>()
    mocks.get.mockReturnValueOnce(initial.promise)
    await mount()
    scroller().dispatchEvent(new Event('scroll'))
    app!.unmount()
    app = undefined
    initial.resolve(detail())
    await vi.advanceTimersByTimeAsync(10000)
    await flush()
    expect(mocks.get).toHaveBeenCalledTimes(1)
    expect(mocks.post).not.toHaveBeenCalled()
    expect(mocks.error).not.toHaveBeenCalled()
  })
})
