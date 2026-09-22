import { onScopeDispose, ref, watch } from 'vue'
import {
  clearCourseReviewDraft,
  loadCourseReviewDraft,
  saveCourseReviewDraft,
  type CourseReviewDraft,
} from './courseReviewDraft'

type ReviewDraftBase = Omit<CourseReviewDraft, 'updatedAt'>

export function useCourseReviewDraft(
  userId: number,
  courseId: number,
  reviewId: number | null,
  initial: ReviewDraftBase,
) {
  const saved = loadCourseReviewDraft(userId, courseId, reviewId)
  const base = { ...initial }
  const content = ref(saved?.content ?? initial.content)
  const anonymous = ref(saved?.anonymous ?? initial.anonymous)
  const rating = ref(saved?.rating ?? initial.rating)
  const semester = ref(saved?.semester ?? initial.semester)
  const difficulty = ref(saved?.difficulty ?? initial.difficulty)
  const grade = ref(saved?.grade ?? initial.grade)
  const homework = ref(saved?.homework ?? initial.homework)
  const reward = ref(saved?.reward ?? initial.reward)
  const saveState = ref<'empty' | 'pending' | 'saved' | 'failed'>(saved ? 'saved' : 'empty')
  let timer: ReturnType<typeof setTimeout> | undefined
  let completed = false

  const hasContent = () => content.value.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim().length > 0
  const persist = () => {
    clearTimeout(timer)
    if (completed) return true
    const ok = hasContent()
      ? saveCourseReviewDraft(userId, courseId, reviewId, {
        content: content.value,
        anonymous: anonymous.value,
        rating: rating.value,
        semester: semester.value,
        difficulty: difficulty.value,
        grade: grade.value,
        homework: homework.value,
        reward: reward.value,
        updatedAt: new Date().toISOString(),
      })
      : clearCourseReviewDraft(userId, courseId, reviewId)
    saveState.value = ok ? (hasContent() ? 'saved' : 'empty') : 'failed'
    return ok
  }

  watch([content, anonymous, rating, semester, difficulty, grade, homework, reward], () => {
    clearTimeout(timer)
    if (completed) return
    saveState.value = 'pending'
    timer = setTimeout(persist, 500)
  }, { flush: 'sync' })

  const clear = () => {
    content.value = base.content
    anonymous.value = base.anonymous
    rating.value = base.rating
    semester.value = base.semester
    difficulty.value = base.difficulty
    grade.value = base.grade
    homework.value = base.homework
    reward.value = base.reward
    clearTimeout(timer)
    const cleared = clearCourseReviewDraft(userId, courseId, reviewId)
    saveState.value = cleared ? 'empty' : 'failed'
    return cleared
  }

  const markPublished = () => {
    completed = true
    clearTimeout(timer)
    const cleared = clearCourseReviewDraft(userId, courseId, reviewId)
    saveState.value = cleared ? 'empty' : 'failed'
    return cleared
  }

  onScopeDispose(persist)
  return { content, anonymous, rating, semester, difficulty, grade, homework, reward, saveState, persist, clear, markPublished }
}
