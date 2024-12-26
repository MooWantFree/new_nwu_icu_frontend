import { z } from 'zod'
import { ErrorFactory } from '../errors'
import { MethodMap } from '../base'

// POST
// 新建回复
const APIPostReplyQuery = z.object({
  review_id: z.number(),
  content: z.string(),
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
  review_id: z.number(),
})
export type APIGetReply = {
  endpoint: `/api/assessment/reply/${number}/`
  method: MethodMap.GET
  params: z.infer<typeof APIGetReplyParams>
  response: {
    id: number
    create_time: string
    content: string
    author: {
      id: number
      nickname: string
    }
    like: {
      like: number
      dislike: number
    }
    parent_id: number
  }[]
}