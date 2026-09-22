import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, type App } from 'vue'
import InBox from './InBox.vue'
import type { APIUserMessageList } from '@/types/api/messages/inbox'

const mocks = vi.hoisted(() => ({ get: vi.fn(), error: vi.fn() }))
vi.mock('@/lib/requests', () => ({ api: { get: mocks.get } }))
vi.mock('naive-ui', () => ({ useMessage: () => ({ error: mocks.error }) }))
vi.mock('vue-router', () => ({ useRoute: () => ({ query: {} }) }))
vi.mock('@/components/common/UserAvatar.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/tinyComponents/Time.vue', () => ({ default: { render: () => null } }))
vi.mock('./ChatView.vue', () => ({ default: defineComponent({
  props: ['chatTarget'], emits: ['read'],
  setup: (props, { emit }) => () => h('div', { 'data-chat': props.chatTarget.chatter.id }, [
    h('span', props.chatTarget.chatter.nickname),
    h('button', { 'data-read-a': '', onClick: () => emit('read', 2) }, 'read A'),
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
  for (let i = 0; i < 8; i++) { await Promise.resolve(); await nextTick() }
}
let app: App | undefined
let container: HTMLDivElement
const mount = async () => {
  app = createApp(InBox)
  app.mount(container)
  await flush()
}
const rows = () => container.querySelectorAll<HTMLDivElement>('.cursor-pointer')

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  mocks.get.mockReset().mockResolvedValue(list())
  container = document.createElement('div')
  document.body.append(container)
})
afterEach(() => {
  app?.unmount()
  container.remove()
  vi.useRealTimers()
})

describe('inbox conversation refresh', () => {
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

  it('clips the two-pane layout instead of creating a page-level horizontal scrollbar', async () => {
    await mount()
    const root = container.firstElementChild
    const panes = root?.querySelector('.rounded-2xl')
    expect(root?.classList.contains('min-w-0')).toBe(true)
    expect(root?.classList.contains('overflow-hidden')).toBe(true)
    expect(panes?.classList.contains('min-w-0')).toBe(true)
    expect(panes?.classList.contains('overflow-hidden')).toBe(true)
  })
})
