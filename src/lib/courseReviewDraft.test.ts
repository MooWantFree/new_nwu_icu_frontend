import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import { loadCourseReviewDraft, loadCourseReviewReplyDraft } from './courseReviewDraft'
import { useCourseReviewDraft } from './useCourseReviewDraft'
import { useCourseReviewReplyDraft } from './useCourseReviewReplyDraft'

const initial = {
  content: '', anonymous: false, rating: 3, semester: null,
  difficulty: 3, grade: 3, homework: 3, reward: 3,
}

describe('course review drafts', () => {
  beforeEach(() => { localStorage.clear(); vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

  it('automatically saves every review field and restores it for the same account and course', () => {
    const scope = effectScope()
    const draft = scope.run(() => useCourseReviewDraft(1, 42, null, initial))!
    draft.content.value = '<p>课程草稿</p>'
    draft.rating.value = 5
    draft.semester.value = 9
    draft.anonymous.value = true
    vi.advanceTimersByTime(500)

    expect(loadCourseReviewDraft(1, 42, null)).toMatchObject({
      content: '<p>课程草稿</p>', rating: 5, semester: 9, anonymous: true,
    })
    expect(loadCourseReviewDraft(2, 42, null)).toBeNull()
    expect(loadCourseReviewDraft(1, 43, null)).toBeNull()
    scope.stop()

    const nextScope = effectScope()
    const restored = nextScope.run(() => useCourseReviewDraft(1, 42, null, initial))!
    expect(restored.content.value).toBe('<p>课程草稿</p>')
    expect(restored.rating.value).toBe(5)
    expect(restored.semester.value).toBe(9)
    nextScope.stop()
  })

  it('does not restore a published review after a pending timer or disposal', () => {
    const scope = effectScope()
    const draft = scope.run(() => useCourseReviewDraft(1, 42, null, initial))!
    draft.content.value = '<p>已经发布</p>'
    draft.markPublished()
    scope.stop()
    vi.runAllTimers()
    expect(loadCourseReviewDraft(1, 42, null)).toBeNull()
  })

  it('keeps reply drafts isolated by account, review and parent and clears published replies', () => {
    const scope = effectScope()
    const draft = scope.run(() => useCourseReviewReplyDraft(1, 119, 2))!
    draft.content.value = '楼中楼草稿'
    vi.advanceTimersByTime(500)
    expect(loadCourseReviewReplyDraft(1, 119, 2)?.content).toBe('楼中楼草稿')
    expect(loadCourseReviewReplyDraft(1, 119, 0)).toBeNull()
    expect(loadCourseReviewReplyDraft(2, 119, 2)).toBeNull()
    draft.markPublished()
    scope.stop()
    vi.runAllTimers()
    expect(loadCourseReviewReplyDraft(1, 119, 2)).toBeNull()
  })
})
