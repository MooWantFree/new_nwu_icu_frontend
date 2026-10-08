import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref, type App } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { DiscussionBoard, GuestbookEntry } from '@/types/api/guestbook'

const dialogs = vi.hoisted(() => ({ confirm: vi.fn() }))
vi.mock('@/lib/useShadcnDialog', () => ({ useShadcnDialog: () => dialogs }))
vi.mock('@/components/common/UserAvatar.vue', () => ({
  default: defineComponent({ setup: () => () => h('span', { 'aria-label': '用户头像' }) }),
}))
vi.mock('@/components/tinyComponents/Time.vue', () => ({
  default: defineComponent({
    props: ['time'],
    setup: props => () => h('time', { datetime: props.time }, props.time),
  }),
}))

import GuestbookEntryCard from './GuestbookEntryCard.vue'

const entry = (overrides: Partial<GuestbookEntry> = {}): GuestbookEntry => ({
  id: 4, parent_id: null, root_id: null, title: '站点更新公告', content: '<p>公告正文</p>',
  author: { id: 2, nickname: '公告作者', avatar: null }, anonymous: false, is_deleted: false,
  children_count: 0, reply_count: 0, like_count: 3, created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-10-08T00:00:00Z', priority: 0, is_visible: true, is_me: true,
  liked_by_me: false, ...overrides,
})
const deferred = <T>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(done => { resolve = done })
  return { promise, resolve }
}
const flush = async () => {
  for (let index = 0; index < 5; index += 1) { await Promise.resolve(); await nextTick() }
}

let app: App | undefined
let container: HTMLDivElement

const mountCard = async (initialEntry: GuestbookEntry, initialBoard: DiscussionBoard = 'announcements', initialLinkTitle = false) => {
  const currentEntry = ref(initialEntry)
  const board = ref(initialBoard)
  const linkTitle = ref(initialLinkTitle)
  const likePending = ref(false)
  const events = { like: vi.fn(), reply: vi.fn(), delete: vi.fn(), report: vi.fn() }
  const router = createRouter({ history: createMemoryHistory(), routes: [
    { path: '/:pathMatch(.*)*', component: { render: () => null } },
  ] })
  await router.push('/announcements')
  app = createApp({ setup: () => () => h(GuestbookEntryCard, {
    entry: currentEntry.value, board: board.value, linkTitle: linkTitle.value,
    likePending: likePending.value, onLike: events.like, onReply: events.reply,
    onDelete: events.delete, onReport: events.report,
  }) }).use(router)
  app.mount(container)
  await flush()
  return { currentEntry, board, linkTitle, likePending, events }
}
const button = (text: string) => [...container.querySelectorAll('button')]
  .find(item => (item.getAttribute('aria-label') || item.textContent?.trim()) === text) as HTMLButtonElement

beforeEach(() => {
  dialogs.confirm.mockReset()
  container = document.createElement('div')
  document.body.append(container)
})
afterEach(() => { app?.unmount(); app = undefined; container.remove(); vi.restoreAllMocks() })

describe('GuestbookEntryCard announcement actions', () => {
  it('links a list title to the announcement while keeping the detail title plain and showing its update time', async () => {
    const { linkTitle } = await mountCard(entry(), 'announcements', true)
    const title = container.querySelector('h2')!
    expect(title.querySelector('a')?.getAttribute('href')).toBe('/announcements/4')
    expect(title.textContent?.trim()).toBe('站点更新公告')
    expect(container.querySelector('time')?.getAttribute('datetime')).toBe('2026-10-08T00:00:00Z')
    expect(container.querySelector('[aria-label="用户头像"]')).toBeNull()
    expect(button('举报')).toBeUndefined()
    expect(button('删除')).toBeUndefined()

    linkTitle.value = false
    await nextTick()
    expect(title.querySelector('a')).toBeNull()
    expect(title.textContent?.trim()).toBe('站点更新公告')
  })

  it('preserves safe announcement links and image sizes, but uses the restricted sanitizer for replies', async () => {
    const content = '<p><strong>更新</strong><a href="/announcements/8">站内链接</a><a href="https://example.com/info">外部链接</a><a href="javascript:alert(1)">危险链接</a></p><img src="/api/download/00000000-0000-4000-8000-000000000001/" data-size="50" onerror="alert(1)"><img src="https://example.com/image.png"><script>alert(1)</script>'
    const { currentEntry } = await mountCard(entry({ content }))
    const body = container.querySelector('.guestbook-content')!
    expect(body.querySelector('a[href="/announcements/8"]')?.hasAttribute('target')).toBe(false)
    expect(body.querySelector('a[href="https://example.com/info"]')?.getAttribute('rel')).toBe('noopener noreferrer')
    expect(body.querySelector('a[href="https://example.com/info"]')?.getAttribute('target')).toBe('_blank')
    expect(body.querySelectorAll('img')).toHaveLength(1)
    expect(body.querySelector('img')?.getAttribute('data-size')).toBe('50')
    expect(body.querySelector('[onerror], script, a[href^="javascript:"]')).toBeNull()

    currentEntry.value = entry({ content, parent_id: 1, root_id: 1 })
    await nextTick()
    expect(body.querySelector('a, img, script')).toBeNull()
    expect(body.querySelector('strong')?.textContent).toBe('更新')
    expect(container.querySelector('time')?.getAttribute('datetime')).toBe('2026-09-01T00:00:00Z')
    expect(container.querySelector('[aria-label="用户头像"]')).not.toBeNull()
  })

  it('waits for a single destructive confirmation, supports cancellation, and emits only after acceptance', async () => {
    const nativeConfirm = vi.spyOn(window, 'confirm')
    const pending = deferred<boolean>()
    dialogs.confirm.mockReturnValueOnce(pending.promise).mockResolvedValueOnce(true)
    const { events } = await mountCard(entry({ parent_id: 1, root_id: 1 }))

    button('删除').click()
    button('删除').click()
    await nextTick()
    expect(dialogs.confirm).toHaveBeenCalledOnce()
    expect(dialogs.confirm).toHaveBeenCalledWith(expect.objectContaining({ title: '删除回复', destructive: true }))
    expect(button('删除').disabled).toBe(true)
    expect(events.delete).not.toHaveBeenCalled()
    pending.resolve(false)
    await flush()
    expect(events.delete).not.toHaveBeenCalled()
    expect(button('删除').disabled).toBe(false)

    button('删除').click()
    await flush()
    expect(events.delete).toHaveBeenCalledOnce()
    expect(events.delete).toHaveBeenCalledWith(expect.objectContaining({ id: 4 }))
    expect(nativeConfirm).not.toHaveBeenCalled()
  })

  it.each(['entry', 'board', 'unmount'] as const)('ignores a late confirmation after %s changes', async (change) => {
    const pending = deferred<boolean>()
    dialogs.confirm.mockReturnValue(pending.promise)
    const { currentEntry, board, events } = await mountCard(entry({ parent_id: 1, root_id: 1 }))
    button('删除').click()
    if (change === 'entry') currentEntry.value = entry({ id: 5, parent_id: 1, root_id: 1 })
    else if (change === 'board') board.value = 'guestbook'
    else { app?.unmount(); app = undefined }
    await nextTick()
    pending.resolve(true)
    await flush()
    expect(events.delete).not.toHaveBeenCalled()
  })

  it('preserves guestbook native confirmation and forwards like, reply, and report payloads', async () => {
    const nativeConfirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    const { events, currentEntry, likePending } = await mountCard(entry({ liked_by_me: true }), 'guestbook', true)
    expect(container.querySelector('h2')).toBeNull()
    expect(button('点赞').getAttribute('aria-pressed')).toBe('true')
    button('点赞').click()
    button('回复').click()
    expect(events.like).toHaveBeenCalledWith(currentEntry.value)
    expect(events.reply).toHaveBeenCalledWith(currentEntry.value)
    button('举报').click()
    await nextTick()
    expect(button('举报').getAttribute('aria-expanded')).toBe('true')
    button('泄露隐私').click()
    await nextTick()
    expect(events.report).toHaveBeenCalledWith(currentEntry.value, 'privacy')
    expect(button('举报').getAttribute('aria-expanded')).toBe('false')
    button('删除').click()
    expect(events.delete).not.toHaveBeenCalled()
    button('删除').click()
    expect(events.delete).toHaveBeenCalledOnce()
    expect(nativeConfirm).toHaveBeenCalledTimes(2)
    expect(dialogs.confirm).not.toHaveBeenCalled()

    likePending.value = true
    await nextTick()
    button('点赞').click()
    button('回复').click()
    expect(events.like).toHaveBeenCalledOnce()
    expect(events.reply).toHaveBeenCalledOnce()
  })
})
