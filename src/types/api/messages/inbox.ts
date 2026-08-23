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
      conversation_id: number
      chatter: {
        id: number
        nickname: string
        avatar: string
        uuid: string
        has_avatar: boolean
      }
      last_message: {
        id: number | null
        content: string
        datetime: string | null
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
  page_size: z.number().optional(),
  before_id: z.number().optional(),
  after_id: z.number().optional(),
  order: z.enum(['before', 'after']).optional(),
  last_message_id: z.number().optional(),
})
export type APIUserMessageDetail = {
  endpoint: `/api/message/user/${string}/`
  method: MethodMap.GET
  params: z.infer<typeof APIUserMessageDetailParams>
  query: z.infer<typeof APIUserMessageDetailQuery>
  response: {
    conversation_id: number
    count: number
    has_more: boolean
    before_id: number | null
    after_id: number | null
    snapshot_latest_message_id: number
    results: {
      chatter: {
        avatar: string
        uuid: string
        has_avatar: boolean
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
  content: z.string().min(1).max(500),
})
export type APISendMessage = {
  endpoint: '/api/message/'
  method: MethodMap.POST
  query: z.infer<typeof APISendMessageQuery>
  response: {
    message: number // Message ID
    conversation_id: number
    datetime: string
  }
  errors: ErrorFactory<'auth'>[]
}

export const APIReadConversationParams = z.object({ id: z.number() })
export const APIReadConversationBody = z.object({ through_message_id: z.number().min(0) })
export type APIReadConversation = {
  endpoint: `/api/message/user/${string}/read/`
  method: MethodMap.POST
  params: z.infer<typeof APIReadConversationParams>
  query: z.infer<typeof APIReadConversationBody>
  response: { through_message_id: number }
  errors: ErrorFactory<'auth'>[]
}
