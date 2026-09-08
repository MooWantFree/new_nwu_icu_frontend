import { z } from 'zod'
import { ErrorFactory } from '../errors'
import { MethodMap } from '../base'

// POST
// 新建回复
const APIPostReplyQuery = z.object({
  review_id: z.number(),
  content: z.string().max(2_000),
  parent_id: z.number().optional(),
})
export type APIPostReply = {
  endpoint: '/api/assessment/reply/'
  method: MethodMap.POST
  query: z.infer<typeof APIPostReplyQuery>
  response: {
    reply_id: number
  }
  errors: ErrorFactory<'login' | 'reply'>[]
}

// DELETE
// 删除回复
const APIDeleteReplyQuery = z.object({
  review_id: z.number(),
  reply_id: z.number(),
})
export type APIDeleteReply = {
  endpoint: '/api/assessment/reply/'
  method: MethodMap.DELETE
  query: z.infer<typeof APIDeleteReplyQuery>
  response: {}
  errors: ErrorFactory<'login' | 'reply'>[]
}

// GET
// 获取指定课程评价的评论
const APIGetReplyParams = z.object({
  id: z.number(),
})
export type APIGetReply = {
  endpoint: `/api/assessment/reply/${number}/`
  method: MethodMap.GET
  params: z.infer<typeof APIGetReplyParams>
  query: { after?: number; target?: number }
  response: {
    count: number
    next_cursor: number | null
    results: import('@/types/courseReview').Review['reply']
  }
}
