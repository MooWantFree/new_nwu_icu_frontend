import { z } from 'zod'
import {
  basePasswordSchema,
  usernameSchema,
} from '@/types/common/userBasicInfo'
import { ErrorFactory } from '../errors'
import { MethodMap } from '../base'

// POST
// 用户注册
const APIRegisterQuery = z.object({
  username: usernameSchema,
  password: basePasswordSchema,
  repeat_password: z.string(),
  email: z
    .string()
    .email()
    .refine((email) => !email.endsWith('@nwu.edu.cn'), {
      message: '为了保证账号的稳定性，请不要使用学校邮箱注册',
    }),
  captcha_key: z.string(),
  captcha_value: z.string(),
})
export type APIRegister = {
  endpoint: '/api/user/register/'
  method: MethodMap.POST
  query: z.infer<typeof APIRegisterQuery>
  response: {}
  errors: ErrorFactory<'username' | 'email' | 'password' | 'captcha'>[]
}

// POST
// 用户登录
const APILoginQuery = z.object({
  username: z.string(),
  password: z.string(),
})
export type APILogin = {
  endpoint: '/api/user/login/'
  method: MethodMap.POST
  query: z.infer<typeof APILoginQuery>
  response: {
    id: number
    username: string
    email: string
    date_joined: string
    nickname: string
    avatar: string
    bio: string
  }
  errors: ErrorFactory<'password' | 'login' | 'user'>[]
}

// POST
// 用户退出登录
export type APILogout = {
  endpoint: '/api/user/logout/'
  method: MethodMap.POST
  response: {}
  errors: ErrorFactory<'login'>[]
}

// POST
// 检查用户名是否可用
const APICheckUsernameQuery = z.object({
  username: usernameSchema,
})
export type APICheckUsername = {
  endpoint: '/api/user/username/'
  method: MethodMap.POST
  query: z.infer<typeof APICheckUsernameQuery>
  response: {}
  errors: ErrorFactory<'username'>[]
}

// GET
// 激活账号
const APIActivateAccountQuery = z.object({
  token: z.string(),
})
export type APIActivateAccount = {
  endpoint: '/api/user/register/'
  method: MethodMap.GET
  query: z.infer<typeof APIActivateAccountQuery>
  response: {}
  errors: ErrorFactory<'token'>[]
}

// POST
// 重新发送激活邮件
const APISendActivateEmailQuery = z.object({
  username: z.string(),
  password: z.string(),
})
export type APISendActivateEmail = {
  endpoint: '/api/user/active/'
  method: MethodMap.POST
  query: z.infer<typeof APISendActivateEmailQuery>
  response: {}
  errors: ErrorFactory<'user' | 'password'>[]
}
