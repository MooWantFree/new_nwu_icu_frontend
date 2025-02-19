import { z } from 'zod'
import type { ErrorFactory } from '../errors'
import { MethodMap } from '../base'

// GET
// 获取消息列表
export const APIUserMessageListQuery = z.object({
  page: z.number().min(1).default(1),
})
export type APIUserMessageList = {
  endpoint: '/api/message/user/'
  method: MethodMap.GET
  query: z.infer<typeof APIUserMessageListQuery>
  response: {
    page: number
    max_page: number
    count: number
    results: {
      chatter: {
        id: number
        nickname: string
        avatar: string
      }
      last_message: {
        content: string
        datetime: string
      }
      unread_count: number
    }[]
  }
  errors: ErrorFactory<'auth'>[]
}

// GET
// 获取消息详情
export const APIUserMessageDetailParams = z.object({
  id: z.number(),
})
export const APIUserMessageDetailQuery = z.object({
  page: z.number().optional(),
  page_size: z.number().optional(),
  order: z.enum(['before', 'after']).default('after').optional(),
  last_message_id: z.number().optional(),
})
export type APIUserMessageDetail = {
  endpoint: `/api/message/user/${string}/`
  method: MethodMap.GET
  params: z.infer<typeof APIUserMessageDetailParams>
  query: z.infer<typeof APIUserMessageDetailQuery>
  response: {
    page: number
    max_page: number
    count: number
    results: {
      chatter: {
        avatar: string
        id: number
        nickname: string
      }
      id: number
      content: string
      datetime: string
    }[]
  }
  errors: ErrorFactory<'auth'>[]
}

// POST
// 发送消息
export const APISendMessageQuery = z.object({
  receiver: z.number(),
  content: z.string(), // For image, use Base64
  // TODO: Is there need to support file and reply to certain message?
})
export type APISendMessage = {
  endpoint: '/api/message/'
  method: MethodMap.POST
  query: z.infer<typeof APISendMessageQuery>
  response: {
    message: number // Message ID
  }
  errors: ErrorFactory<'auth'>[]
}
