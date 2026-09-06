import { computed, onScopeDispose, ref, watch } from 'vue'
import { clearGuestbookDraft, guestbookTextLength, loadGuestbookDraft, saveGuestbookDraft } from './guestbook'

export function useGuestbookDraft(userId: number, parentId: number | null, board = 'guestbook') {
  const saved = loadGuestbookDraft(userId, parentId, board)
  const title = ref(saved?.title ?? '')
  const content = ref(saved?.content ?? '')
  const anonymous = ref(parentId === null && (saved?.anonymous ?? false))
  const submissionId = ref(saved?.submissionId ?? crypto.randomUUID())
  const textLength = computed(() => guestbookTextLength(content.value))
  const saveState = ref<'empty' | 'pending' | 'saved' | 'failed'>(saved ? 'saved' : 'empty')
  let timer: ReturnType<typeof setTimeout> | undefined
  let completed = false

  const persist = () => {
    clearTimeout(timer)
    if (completed) return true
    const ok = textLength.value
      ? saveGuestbookDraft(userId, parentId, {
        title: title.value, content: content.value, anonymous: anonymous.value, submissionId: submissionId.value,
        updatedAt: new Date().toISOString(),
      }, board)
      : clearGuestbookDraft(userId, parentId, board)
    saveState.value = ok ? (textLength.value ? 'saved' : 'empty') : 'failed'
    return ok
  }
  watch([title, content, anonymous], () => {
    clearTimeout(timer)
    if (completed) return
    submissionId.value = crypto.randomUUID()
    saveState.value = 'pending'
    timer = setTimeout(persist, 500)
  }, { flush: 'sync' })

  const clear = () => {
    content.value = ''
    title.value = ''
    anonymous.value = false
    persist()
  }
  const markPublished = () => {
    completed = true
    clearTimeout(timer)
    content.value = ''
    title.value = ''
    anonymous.value = false
    const cleared = clearGuestbookDraft(userId, parentId, board) || saveGuestbookDraft(userId, parentId, {
      content: '', anonymous: false, updatedAt: new Date().toISOString(),
    }, board)
    saveState.value = cleared ? 'empty' : 'failed'
    return cleared
  }
  onScopeDispose(persist)
  return { title, content, anonymous, submissionId, textLength, saveState, persist, clear, markPublished }
}
