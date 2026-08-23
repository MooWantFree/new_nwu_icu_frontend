import { describe, expect, it, vi } from 'vitest'
import { drainAfterCursor, mergeByMessageId } from './messageCursor'

describe('message cursor helpers', () => {
  it('deduplicates messages and keeps id order', () => {
    expect(mergeByMessageId(
      [{ id: 2, content: 'old' }, { id: 1, content: 'one' }],
      [{ id: 2, content: 'new' }, { id: 3, content: 'three' }],
    )).toEqual([
      { id: 1, content: 'one' },
      { id: 2, content: 'new' },
      { id: 3, content: 'three' },
    ])
  })

  it('drains every after page without gaps', async () => {
    const fetchPage = vi.fn(async (cursor: number) => {
      if (cursor === 1) return { results: [{ id: 2 }, { id: 3 }], after_id: 3, has_more: true }
      return { results: [{ id: 4 }, { id: 5 }], after_id: 5, has_more: false }
    })
    await expect(drainAfterCursor(1, fetchPage)).resolves.toEqual({
      results: [{ id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }],
      cursor: 5,
    })
    expect(fetchPage).toHaveBeenCalledTimes(2)
  })

  it('rejects a non-advancing cursor instead of polling forever', async () => {
    await expect(drainAfterCursor(4, async () => ({
      results: [{ id: 4 }],
      after_id: 4,
      has_more: true,
    }))).rejects.toThrow('did not advance')
  })
})
