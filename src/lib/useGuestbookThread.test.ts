import { isReactive } from 'vue'
import { describe, expect, it } from 'vitest'
import { createGuestbookThread } from './useGuestbookThread'
import type { GuestbookEntry } from '../types/api/guestbook'

const entry = (id: number, parent: number | null = 1): GuestbookEntry => ({
  id, root_id: parent === null ? null : 1, parent_id: parent, content: `entry ${id}`, anonymous: false,
  is_deleted: false, created_at: '2026-09-01T00:00:00Z', like_count: 0, reply_count: 0, children_count: 0,
  author: { id: 1, nickname: 'author', avatar: null }, is_me: false, liked_by_me: false,
})

describe('guestbook discussion state', () => {
  it('returns reactive branch state for a newly discovered reply', () => {
    const thread = createGuestbookThread(async () => ({ results: [], max_page: 1 }))
    thread.reset(entry(1, null))
    const state = thread.branch(2)
    expect(isReactive(state)).toBe(true)
    expect(state.collapsed).toBe(false)
    state.collapsed = true
    expect(thread.branch(2).collapsed).toBe(true)
  })

  it('loads every page and nested branch for an expanded discussion', async () => {
    const thread = createGuestbookThread(async (id, page) => {
      if (id === 1) return {
        results: page === 1 ? [{ ...entry(2), children_count: 1 }] : [entry(3)],
        max_page: 2,
      }
      return { results: [entry(4, 2)], max_page: 1 }
    })
    thread.reset({ ...entry(1, null), children_count: 2, reply_count: 3 })
    await thread.loadAll(1)
    expect(thread.branch(1).ids).toEqual([2, 3])
    expect(thread.branch(1).page).toBe(2)
    expect(thread.branch(2).ids).toEqual([4])
    expect(thread.entries[4]).toBeDefined()
  })

  it('reveals a later-page target without skipping or duplicating paginated replies', async () => {
    const thread = createGuestbookThread(async (_id, page) => ({
      results: page === 1 ? Array.from({ length: 10 }, (_, i) => entry(i + 2)) : [entry(12)], max_page: 2,
    }))
    const root = { ...entry(1, null), children_count: 11, reply_count: 12 }
    thread.reset(root)
    thread.reveal([root, { ...entry(12), children_count: 1 }, entry(13, 12)])
    expect(thread.branch(1).ids).toEqual([12])
    expect(thread.branch(12).expanded).toBe(true)
    expect(thread.branch(12).ids).toEqual([13])
    await thread.load(1)
    expect(thread.branch(1).ids).toHaveLength(11)
    await thread.load(1)
    expect(thread.branch(1).ids).toEqual(Array.from({ length: 11 }, (_, i) => i + 2))
    expect(thread.branch(12).ids).toEqual([13])
    expect(thread.branch(12).expanded).toBe(true)
  })

  it('retains loaded children, collapsed state, and newly posted replies across pagination', async () => {
    const thread = createGuestbookThread(async () => ({ results: [entry(2), entry(3)], max_page: 1 }))
    thread.reset({ ...entry(1, null), children_count: 1, reply_count: 1 })
    thread.reveal([entry(2), entry(4, 2)])
    thread.branch(2).expanded = false
    thread.addReply(entry(3))
    thread.addReply(entry(3))
    expect(thread.entries[1].reply_count).toBe(2)
    await thread.load(1)
    expect(thread.branch(2).ids).toEqual([4])
    expect(thread.branch(2).expanded).toBe(false)
    expect(thread.branch(1).ids).toEqual([2, 3])
  })

  it('ignores in-flight results from a previous discussion', async () => {
    let resolve!: (value: { results: GuestbookEntry[]; max_page: number }) => void
    const thread = createGuestbookThread(() => new Promise(done => { resolve = done }))
    thread.reset(entry(1, null))
    const pending = thread.load(1)
    thread.reset(entry(50, null))
    resolve({ results: [entry(2)], max_page: 1 })
    await pending
    expect(thread.entries[2]).toBeUndefined()
    expect(thread.entries[50]).toBeDefined()
  })
})
