import { z } from 'zod'
import type { ErrorFactory, ErrorNotLogin } from '../errors'
import { usernameSchema } from '@/types/common/userBasicInfo'
import { MethodMap } from '../base'

// GET
// 获取已发表评价
type APIUserActivityReviewBase = {
  id: number
  datetime: string
  semester: string
  course: {
    name: string
    id: number
    semester: string
  }
  like: {
    like: number
    dislike: number
  }
  content: {
    current_content: string
  }
  teachers: {
    name: string
    id: number
  }[]
  rating: {
    rating: number
    difficulty: number
    grade: number
    homework: number
    reward: number
  }
}
export enum APIUserActivitiesQueryType {
  reply = 'reply',
  review = 'review',
}
export type APIUserActivitiesReview = {
  endpoint: '/api/assessment/user/activities/review/:id/'
  method: MethodMap.GET
  params: {
    id: number
  }
  query: {
    page_size: number
    page: number
  }
  response: {
    page: number
    max_page: number
    count: number
    results:
      | (APIUserActivityReviewBase & {
          is_me: true
          anonymous: boolean
          content: {
            current_content: string
            content_history: string[]
          }
        })[]
      | (APIUserActivityReviewBase & {
          is_me: false
        })[]
  }
  errors: ErrorFactory<ErrorNotLogin>[]
}

// GET
// 获取已发表回复
type APIUserActivityReplyBase = {
  id: number
  review: {
    author: {
      nickname: string
      id: number
      avatar_uuid: string
      is_student: boolean
    }
    content: string
  }
  datetime: string
  course: {
    name: string
    id: number
    semester: string
  }
  reply: {
    id: number
    content: string
  }
  like: {
    like: number
    dislike: number
  }
}
export type APIUserActivitiesReply = {
  endpoint: '/api/assessment/user/activities/reply/:id/'
  method: MethodMap.GET
  params: {
    id: number
  }
  query: {
    page_size: number
    page: number
  }
  response: {
    page: number
    max_page: number
    count: number
    results: APIUserActivityReplyBase[]
  }
  errors: ErrorFactory<ErrorNotLogin>[]
}

// POST
// 绑定西大邮箱
export const APIBindScholarEmailQuery = z.object({
  college_email: z
    .string()
    .email()
    .refine((email) => email.endsWith('nwu.edu.cn'), {
      message: '请使用以 nwu.edu.cn 结尾的西北大学邮箱',
    }),
})
export type APIBindScholarEmail = {
  endpoint: '/api/user/bind-college-email/bind/'
  method: MethodMap.POST
  query: z.infer<typeof APIBindScholarEmailQuery>
  response: {}
  errors: ErrorFactory<ErrorNotLogin>[]
}

// GET
// 获取个人信息
export type APIUserProfile = {
  endpoint: '/api/user/profile/'
  method: MethodMap.GET
  response: {
    id: number
    username: string
    bio?: string
    email: string
    date_joined: string
    nickname: string
    avatar: string
    college_email?: string
    verified: boolean
    is_me: true
  }
  errors: ErrorFactory<ErrorNotLogin>[]
}

// GET
// 获取指定ID的用户信息
const APIUserProfileGivenIdParams = z.object({
  id: z.number(),
})
export type APIUserProfileGivenId = {
  endpoint: '/api/user/profile/:id/'
  method: MethodMap.GET
  params: z.infer<typeof APIUserProfileGivenIdParams>
  response: {
    id: number
    bio: string | null
    nickname: string
    avatar: string
    is_me: boolean
    verified: boolean
  }
  errors: ErrorFactory<ErrorNotLogin>[]
}

// GET
// 获取个人信息
export type APIUserProfileFromId = {
  endpoint: `/api/user/profile/${number}/`
  method: MethodMap.GET
  params: {
    id: number
  }
  response:
    | {
        id: number
        username: string
        bio?: string
        email: string
        date_joined: string
        nickname: string
        avatar: string
        college_email?: string
        is_me: true
      }
    | {
        id: number
        bio: string | null
        nickname: string
        avatar: string
        is_me: false
        verified: boolean
        date_joined: string
      }
  errors: ErrorFactory<ErrorNotLogin>[]
}

// GET
// 点击邮箱链接确定绑定西大邮箱
const APIVerifyScholarEmailQuery = z.object({
  token: z.string(),
})
export type APIVerifyScholarEmail = {
  endpoint: '/api/user/bind-college-email/verify/'
  method: MethodMap.GET
  query: z.infer<typeof APIVerifyScholarEmailQuery>
  response: {}
  errors: ErrorFactory<ErrorNotLogin>[]
}

// POST
// 更新个人信息
export const APIUpdateProfileBody = z.object({
  nickname: z.nullable(
    z
      .string()
      .regex(/^[\u4e00-\u9fa5a-zA-Z0-9!@#$%^&*()_+~\-={}]+$/)
      .max(30)
      .min(2)
      .optional()
  ),
  username: usernameSchema.optional(),
  avatar_uuid: z.nullable(z.string().uuid().optional()),
  bio: z.nullable(z.string().max(255).optional()),
})
export type APIUpdateProfile = {
  endpoint: '/api/user/profile/'
  method: MethodMap.POST
  query: z.infer<typeof APIUpdateProfileBody>
  response: z.infer<typeof APIUpdateProfileBody> & { id: number }
  errors: ErrorFactory<
    ErrorNotLogin | 'bio' | 'avatar' | 'nickname' | 'username'
  >[]
}
// GET
// 用户隐私设定
export type APIPrivate = {
  endpoint: '/api/user/private/'
  method: MethodMap.GET
  response: {
    review: {
      setting: number
      explain: string
    }
    reply: {
      setting: number
      explain: string
    }
  }
}