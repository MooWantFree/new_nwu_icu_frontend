import { onScopeDispose, ref, watch } from 'vue'
import { clearCourseReviewReplyDraft, loadCourseReviewReplyDraft, saveCourseReviewReplyDraft } from './courseReviewDraft'

export function useCourseReviewReplyDraft(userId: number, reviewId: number, parentId: number) {
  const saved = loadCourseReviewReplyDraft(userId, reviewId, parentId)
  const content = ref(saved?.content ?? '')
  const saveState = ref<'empty' | 'pending' | 'saved' | 'failed'>(saved ? 'saved' : 'empty')
  let timer: ReturnType<typeof setTimeout> | undefined
  let completed = false

  const persist = () => {
    clearTimeout(timer)
    if (completed) return true
    const ok = content.value.trim()
      ? saveCourseReviewReplyDraft(userId, reviewId, parentId, { content: content.value, updatedAt: new Date().toISOString() })
      : clearCourseReviewReplyDraft(userId, reviewId, parentId)
    saveState.value = ok ? (content.value.trim() ? 'saved' : 'empty') : 'failed'
    return ok
  }

  watch(content, () => {
    clearTimeout(timer)
    if (completed) return
    saveState.value = 'pending'
    timer = setTimeout(persist, 500)
  }, { flush: 'sync' })

  const clear = () => {
    content.value = ''
    clearTimeout(timer)
    const cleared = clearCourseReviewReplyDraft(userId, reviewId, parentId)
    saveState.value = cleared ? 'empty' : 'failed'
    return cleared
  }

  const markPublished = () => {
    completed = true
    clearTimeout(timer)
    content.value = ''
    const cleared = clearCourseReviewReplyDraft(userId, reviewId, parentId)
    saveState.value = cleared ? 'empty' : 'failed'
    return cleared
  }

  onScopeDispose(persist)
  return { content, saveState, persist, clear, markPublished }
}
