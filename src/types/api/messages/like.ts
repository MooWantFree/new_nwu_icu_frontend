import { z } from 'zod'
import type { ErrorFactory } from '../errors'
import { MethodMap } from '../base'

// GET
// 获取点赞列表
export const APILikeListQuery = z.object({
  page: z.number().min(1).default(1),
})
export type APILikeList = {
  endpoint: '/api/message/like/'
  method: MethodMap.GET
  query: z.infer<typeof APILikeListQuery>
  response: {
    page: number
    max_page: number
    count: number
    results: {
      id: number
      raw_info: {
        course: {
          id: number
          name: string
        },
        raw_post: {
          classify: string,
          content: string,
          id: number,
        }
      }
      like: {
        like: number
        dislike: number
      }
      datetime: string
    }[]
  }
  errors: ErrorFactory<'auth'>[]
}
