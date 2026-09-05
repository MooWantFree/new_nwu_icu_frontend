import { reactive } from 'vue'
import type { GuestbookEntry } from '../types/api/guestbook'

type ReplyPage = { results: GuestbookEntry[]; max_page: number }
type Branch = { ids: number[]; page: number; maxPage: number; loading: boolean; expanded: boolean; collapsed: boolean }

export function createGuestbookThread(fetchReplies: (id: number, page: number) => Promise<ReplyPage>) {
  const entries = reactive<Record<number, GuestbookEntry>>({})
  const branches = reactive<Record<number, Branch>>({})
  const branch = (id: number): Branch => {
    if (!branches[id]) branches[id] = { ids: [], page: 0, maxPage: 1, loading: false, expanded: false, collapsed: false }
    return branches[id]
  }
  let generation = 0

  const put = (entry: GuestbookEntry) => {
    if (entries[entry.id]) Object.assign(entries[entry.id], entry)
    else entries[entry.id] = entry
    return entries[entry.id]
  }
  const attach = (entry: GuestbookEntry) => {
    put(entry)
    if (entry.parent_id === null) return
    const parent = branch(entry.parent_id)
    if (!parent.ids.includes(entry.id)) parent.ids.push(entry.id)
    parent.ids.sort((a, b) => entries[a].created_at.localeCompare(entries[b].created_at) || a - b)
  }
  const reset = (root: GuestbookEntry) => {
    resetAll([root])
  }
  const resetAll = (roots: GuestbookEntry[]) => {
    generation += 1
    for (const key of Object.keys(entries)) delete entries[Number(key)]
    for (const key of Object.keys(branches)) delete branches[Number(key)]
    for (const root of roots) {
      put(root)
      branch(root.id).expanded = true
    }
  }
  const reveal = (path: GuestbookEntry[]) => {
    for (const entry of path) attach(entry)
    for (const entry of path) if (entry.parent_id !== null) branch(entry.parent_id).expanded = true
  }
  const load = async (id: number) => {
    const state = branch(id)
    if (state.loading || state.page >= state.maxPage) return
    const currentGeneration = generation
    state.loading = true
    try {
      const page = await fetchReplies(id, state.page + 1)
      if (generation !== currentGeneration) return
      for (const entry of page.results) attach(entry)
      state.page += 1
      state.maxPage = page.max_page
    } finally { state.loading = false }
  }
  const loadAll = async (id: number) => {
    const currentGeneration = generation
    const state = branch(id)
    while (generation === currentGeneration && state.page < state.maxPage) await load(id)
    if (generation !== currentGeneration) return
    for (const childId of state.ids) {
      if (entries[childId]?.children_count) await loadAll(childId)
      if (generation !== currentGeneration) return
    }
  }
  const addReply = (entry: GuestbookEntry) => {
    const known = Boolean(entries[entry.id])
    attach(entry)
    if (entry.parent_id === null) return
    branch(entry.parent_id).expanded = true
    if (known) return
    const parent = entries[entry.parent_id]
    if (parent) parent.children_count += 1
    const root = entries[entry.root_id!]
    if (root) root.reply_count = (root.reply_count ?? 0) + 1
  }
  return { entries, branch, put, reset, resetAll, reveal, load, loadAll, addReply }
}

export type GuestbookThread = ReturnType<typeof createGuestbookThread>
