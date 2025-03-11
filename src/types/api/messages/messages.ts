import { z } from 'zod'
import type { ErrorFactory } from '../errors'
import { MethodMap } from '../base'

// GET
// 回复提醒
const APINotificationListQuery = z.object({
  page: z.number().min(1).default(1),
})
export type APINotificationList = {
  endpoint: '/api/message/reply/'
  method: MethodMap.GET
  query: z.infer<typeof APINotificationListQuery>
  response: {
    results: {
      id: number
      reply: {
        id: number
        content: string
      }
      created_by: {
        id: number
        nickname: string
        avatar: string
      }
      course: {
        id: number
        name: string
      }
      raw_post: {
        id: number
        classify: string
        content: string
      }
      datetime: string
    }[]
    page: number
    max_page: number
    count: number
  }
  errors: ErrorFactory<'auth'>[]
}

// GET
// 未读消息数量
export type APIUnreadMessageCount = {
  endpoint: '/api/message/unread/'
  method: MethodMap.GET
  response: {
    unread: {
      user: number
      system: number
      like: number
      reply: number
    }
    total: number
  }
  errors: ErrorFactory<'auth'>[]
}
