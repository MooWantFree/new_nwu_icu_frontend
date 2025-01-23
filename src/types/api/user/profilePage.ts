import { z } from 'zod'
import type { ErrorFactory, ErrorNotLogin } from '../errors'
import { usernameSchema } from '@/types/common/userBasicInfo'
import { MethodMap } from '../base'

// GET
// 获取已发表评价
export type APIUserOwnReview = {
  endpoint: '/api/assessment/my/review/'
  method: MethodMap.GET
  response: {
    page: number
    max_page: number
    count: number
    results: {
      id: number
      anonymous: boolean
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
        content_history: string[]
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
    }[]
  }
  errors: ErrorFactory<ErrorNotLogin>[]
}

// POST
// 绑定西大邮箱
const APIBindScholarEmailQuery = z.object({
  college_email: z.string(),
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
    nwu_email?: string
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
const APIUpdateProfileBody = z.object({
  nickname: z
    .string()
    .regex(/^[\u4e00-\u9fa5a-zA-Z0-9!@#$%^&*()_+~\-={}]+$/)
    .max(30)
    .min(2)
    .optional(),
  username: usernameSchema.optional(),
  avatar: z.string().optional(),
  bio: z.string().max(255).optional(),
})
export type APIUpdateProfile = {
  endpoint: '/api/user/profile/'
  method: MethodMap.POST
  body: z.infer<typeof APIUpdateProfileBody>
  response: z.infer<typeof APIUpdateProfileBody> & { id: number }
  errors: ErrorFactory<
    ErrorNotLogin | 'bio' | 'avatar' | 'nickname' | 'username'
  >[]
}
