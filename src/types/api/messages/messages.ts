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
    results: ({
      id: number
      reply: {
        id: number
        content: string
      }
      created_by: {
        id: number
        nickname: string
        avatar: string
        uuid: string
        has_avatar: boolean
      }
      datetime: string
    } & ({
      source: 'guestbook'
      guestbook: { root_id: number; entry_id: number; target_id: number }
    } | {
      source: 'announcement'
      guestbook: { root_id: number; entry_id: number; target_id: number }
    } | {
      source?: undefined
      course: {
        id: number
        name: string
      }
      raw_post: {
        id: number
        classify: string
        content: string
      }
    }))[]
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

export const APIReadNotificationsBody = z.object({
  ids: z.array(z.number().min(1)).min(1).max(100),
})
export type APIReadNotifications = {
  endpoint: '/api/message/notifications/read/'
  method: MethodMap.POST
  query: z.infer<typeof APIReadNotificationsBody>
  response: { updated: number }
  errors: ErrorFactory<'auth'>[]
}

export type APISystemNotificationList = {
  endpoint: '/api/message/system/'
  method: MethodMap.GET
  query: { page?: number }
  response: {
    page: number
    max_page: number
    count: number
    results: {
      id: number
      title: string
      content: string
      datetime: string
    }[]
  }
  errors: ErrorFactory<'auth'>[]
}
