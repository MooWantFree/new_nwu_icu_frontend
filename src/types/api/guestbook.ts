import { z } from 'zod'

import type { ErrorFactory } from './errors'
import { MethodMap } from './base'

export type GuestbookAuthor = {
  id: number | null
  nickname: string
  avatar: string | null
  uuid?: string | null
  has_avatar?: boolean
}

export type GuestbookEntry = {
  id: number
  root_id: number | null
  parent_id: number | null
  content: string
  anonymous: boolean
  is_deleted: boolean
  created_at: string
  like_count: number
  reply_count?: number
  children_count: number
  author: GuestbookAuthor
  is_me: boolean
  liked_by_me: boolean
}

const pageQuery = z.object({ page: z.number().optional(), pageSize: z.number().optional() })
const contentQuery = z.object({ content: z.string(), anonymous: z.boolean().optional(), submission_id: z.string().uuid() })
const replyQuery = z.object({ content: z.string(), submission_id: z.string().uuid() })

type PaginatedEntries = { page: number; max_page: number; count: number; results: GuestbookEntry[] }

export type APIGuestbookList = {
  endpoint: '/api/guestbook/'
  method: MethodMap.GET
  query: z.infer<typeof pageQuery>
  response: PaginatedEntries
}
export type APICreateGuestbook = {
  endpoint: '/api/guestbook/'
  method: MethodMap.POST
  query: z.infer<typeof contentQuery>
  response: { entry: GuestbookEntry }
  errors: ErrorFactory<'login' | 'content'>[]
}
export type APIGuestbookDetail = {
  endpoint: '/api/guestbook/:id/'
  method: MethodMap.GET
  params: { id: number }
  response: { entry: GuestbookEntry }
}
export type APIDeleteGuestbook = {
  endpoint: '/api/guestbook/:id/'
  method: MethodMap.DELETE
  params: { id: number }
  response: { entry_id: number }
}
export type APIGuestbookReplies = {
  endpoint: '/api/guestbook/:id/replies/'
  method: MethodMap.GET
  params: { id: number }
  query: z.infer<typeof pageQuery>
  response: PaginatedEntries
}
export type APICreateGuestbookReply = {
  endpoint: '/api/guestbook/:id/replies/'
  method: MethodMap.POST
  params: { id: number }
  query: z.infer<typeof replyQuery>
  response: { entry: GuestbookEntry }
}
export type APISetGuestbookLike = {
  endpoint: '/api/guestbook/:id/like/'
  method: MethodMap.PUT
  params: { id: number }
  query: { liked: boolean }
  response: { liked: boolean; like_count: number }
}
export type APIReportGuestbook = {
  endpoint: '/api/guestbook/:id/reports/'
  method: MethodMap.POST
  params: { id: number }
  query: { reason: 'spam' | 'abuse' | 'privacy' | 'other'; detail?: string }
  response: { report_id: number; created: boolean }
}
export type APIGuestbookContext = {
  endpoint: '/api/guestbook/:id/context/'
  method: MethodMap.GET
  params: { id: number }
  response: { root_id: number; path: number[]; entries: GuestbookEntry[] }
}
