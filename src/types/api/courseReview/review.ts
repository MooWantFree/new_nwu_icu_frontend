import { z } from 'zod'
import { ErrorFactory } from '../errors'
import { MethodMap } from '../base'

// POST
// 发表课程评价
export const APIPostReviewQuery = z.object({
  course: z.number(),
  content: z.string(),
  rating: z.number().min(1).max(5),
  anonymous: z.boolean(),
  difficulty: z.number().min(1).max(3),
  grade: z.number().min(1).max(3),
  homework: z.number().min(1).max(3),
  reward: z.number().min(1).max(3),
  semester: z.number(),
})
export type APIPostReview = {
  endpoint: '/api/assessment/review/'
  method: MethodMap.POST
  query: z.infer<typeof APIPostReviewQuery>
  response: {
    review_id: number
  }
  errors: ErrorFactory<'review'>[]
}

// DELETE
// 删除课程评价
const APIDeleteReviewQuery = z.object({
  review_id: z.number(),
})
export type APIDeleteReview = {
  endpoint: '/api/assessment/review/'
  method: MethodMap.DELETE
  query: z.infer<typeof APIDeleteReviewQuery>
  response: {
    review_id: number
  }
  errors: ErrorFactory<'review'>[]
}

// PUT
// 更新课程评价
export const APIUpdateReviewQuery = z.object({
  course: z.number(),
  content: z.string(),
  rating: z.number().min(1).max(5),
  anonymous: z.boolean(),
  difficulty: z.number().min(1).max(3),
  grade: z.number().min(1).max(3),
  homework: z.number().min(1).max(3),
  reward: z.number().min(1).max(3),
  semester: z.number(),
})
export type APIUpdateReview = {
  endpoint: '/api/assessment/review/'
  method: MethodMap.PUT
  query: z.infer<typeof APIUpdateReviewQuery>
  response: {}
  errors: ErrorFactory<'review'>[]
}

// POST
// 给评价/评论点赞或点踩
const APIPostReplyLikeQuery = z.object({
  review_id: z.number(),
  reply_id: z.number(),
  like_or_dislike: z.enum(['-1', '1']),
})
export type APIPostReplyLike = {
  endpoint: '/api/assessment/reply/like/'
  method: MethodMap.POST
  query: z.infer<typeof APIPostReplyLikeQuery>
  response: {
    like: {
      like: number
      dislike: number
    }
  }
  error: ErrorFactory<'login' | 'reply'>
}

// GET
// 获取最近课程评价
const APILatestReviewsQuery = z.object({
  page: z.number().default(1),
  pageSize: z.number().default(11),
  desc: z.number().default(0),
})
export type APILatestReviews = {
  endpoint: '/api/assessment/latest-review/'
  method: MethodMap.GET
  query: z.infer<typeof APILatestReviewsQuery>
  response: {
    page: number
    max_page: number
    count: number
    results: {
      id: number
      author: {
        nickname: string
        id: number
        avatar_uuid: string
        is_student: boolean
      }
      datetime: string
      course: {
        name: string
        id: number
        semester: string
      }
      content: string
      teachers: {
        name: string
        id: number
      }[]
      edited: boolean
    }[]
  }
  errors: ErrorFactory<'login'>[]
}
