export type CursorPage<T> = {
  results: T[]
  after_id: number | null
  has_more: boolean
}

export function mergeByMessageId<T extends { id: number }>(existing: T[], incoming: T[]): T[] {
  const byId = new Map(existing.map(item => [item.id, item]))
  incoming.forEach(item => byId.set(item.id, item))
  return [...byId.values()].sort((a, b) => a.id - b.id)
}

export async function drainAfterCursor<T extends { id: number }>(
  initialCursor: number,
  fetchPage: (afterId: number) => Promise<CursorPage<T>>,
) {
  let cursor = initialCursor
  let results: T[] = []
  let hasMore = false
  do {
    const page = await fetchPage(cursor)
    results = mergeByMessageId(results, page.results)
    hasMore = page.has_more
    if (page.after_id !== null) {
      if (page.after_id <= cursor) throw new Error('Message cursor did not advance')
      cursor = page.after_id
    } else if (hasMore) {
      throw new Error('Message cursor is missing while more pages are available')
    }
  } while (hasMore)
  return { results, cursor }
}
