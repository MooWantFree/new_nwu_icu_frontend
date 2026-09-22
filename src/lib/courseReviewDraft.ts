import type { ReviewDataBase } from '@/types/courseReview'

export type CourseReviewDraft = Omit<ReviewDataBase, 'course' | 'semester'> & {
  semester: number | null
  updatedAt: string
}

export type CourseReviewReplyDraft = {
  content: string
  updatedAt: string
}

const reviewKey = (userId: number, courseId: number, reviewId: number | null) =>
  `course-review:draft:v1:${userId}:${courseId}:${reviewId ?? 'new'}`

const replyKey = (userId: number, reviewId: number, parentId: number) =>
  `course-review-reply:draft:v1:${userId}:${reviewId}:${parentId}`

const isRating = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5
const isSemester = (value: unknown): value is number | null =>
  value === null || (typeof value === 'number' && Number.isInteger(value) && value > 0)

export const loadCourseReviewDraft = (userId: number, courseId: number, reviewId: number | null): CourseReviewDraft | null => {
  try {
    const stored = localStorage.getItem(reviewKey(userId, courseId, reviewId))
    const value: unknown = stored ? JSON.parse(stored) : null
    if (!value || typeof value !== 'object'
      || !('content' in value) || typeof value.content !== 'string'
      || !('anonymous' in value) || typeof value.anonymous !== 'boolean'
      || !('rating' in value) || !isRating(value.rating)
      || !('difficulty' in value) || !isRating(value.difficulty)
      || !('grade' in value) || !isRating(value.grade)
      || !('homework' in value) || !isRating(value.homework)
      || !('reward' in value) || !isRating(value.reward)
      || !('semester' in value) || !isSemester(value.semester)
      || !('updatedAt' in value) || typeof value.updatedAt !== 'string') return null
    return value as CourseReviewDraft
  } catch {
    return null
  }
}

export const saveCourseReviewDraft = (userId: number, courseId: number, reviewId: number | null, draft: CourseReviewDraft) => {
  try {
    localStorage.setItem(reviewKey(userId, courseId, reviewId), JSON.stringify(draft))
    return true
  } catch {
    return false
  }
}

export const clearCourseReviewDraft = (userId: number, courseId: number, reviewId: number | null) => {
  try {
    localStorage.removeItem(reviewKey(userId, courseId, reviewId))
    return true
  } catch {
    return false
  }
}

export const loadCourseReviewReplyDraft = (userId: number, reviewId: number, parentId: number): CourseReviewReplyDraft | null => {
  try {
    const stored = localStorage.getItem(replyKey(userId, reviewId, parentId))
    const value: unknown = stored ? JSON.parse(stored) : null
    if (!value || typeof value !== 'object'
      || !('content' in value) || typeof value.content !== 'string'
      || !('updatedAt' in value) || typeof value.updatedAt !== 'string') return null
    return value as CourseReviewReplyDraft
  } catch {
    return null
  }
}

export const saveCourseReviewReplyDraft = (userId: number, reviewId: number, parentId: number, draft: CourseReviewReplyDraft) => {
  try {
    localStorage.setItem(replyKey(userId, reviewId, parentId), JSON.stringify(draft))
    return true
  } catch {
    return false
  }
}

export const clearCourseReviewReplyDraft = (userId: number, reviewId: number, parentId: number) => {
  try {
    localStorage.removeItem(replyKey(userId, reviewId, parentId))
    return true
  } catch {
    return false
  }
}
