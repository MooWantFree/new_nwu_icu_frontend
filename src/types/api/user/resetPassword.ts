import { z } from 'zod'
import { ErrorFactory, ErrorNotLogin } from '../errors'
import { basePasswordSchema } from '@/types/common/userBasicInfo'
import { MethodMap } from '../base'


// POST
// 由邮箱请求重置密码链接
const APIResetPasswordQuery = z.object({
  email: z.string().email(),
  captcha_key: z.string(),
  captcha_value: z.string(),
})
export type APIResetPassword = {
  endpoint: '/api/user/reset/'
  method: MethodMap.POST
  query: z.infer<typeof APIResetPasswordQuery>
  response: {}
  errors: ErrorFactory<'email' | 'captcha'>[]
}

// POST
// 从邮箱链接重置密码
const APIResetPasswordTokenParams = z.object({
  token: z.string(),
})
const APIResetPasswordTokenQuery = z
  .object({
    new_password: basePasswordSchema,
    confirm_password: z.string(),
    captcha_key: z.string(),
    captcha_value: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: '两次输入的密码不匹配',
    path: ['confirm_password'],
  })
export type APIResetPasswordToken = {
  endpoint: `/api/user/mail-reset/${string}/`
  method: MethodMap.POST
  params: z.infer<typeof APIResetPasswordTokenParams>
  query: z.infer<typeof APIResetPasswordTokenQuery>
  response: {}
  errors: ErrorFactory<'new_password' | 'confirm_password' | 'captcha'>[]
}

// GET
// 验证重置密码token
const APIVerifyResetPasswordTokenParams = z.object({
  token: z.string(),
})
export type APIVerifyResetPasswordToken = {
  endpoint: `/api/user/mail-reset/${string}/`
  method: MethodMap.GET
  params: z.infer<typeof APIVerifyResetPasswordTokenParams>
  response: {}
  errors: ErrorFactory<'token'>[]
}

// POST
// 已登录后重置密码
const APIUserResetPasswordQuery = z
  .object({
    old_password: z.string(),
    new_password: basePasswordSchema,
    confirm_password: z.string(),
    captcha_key: z.string(),
    captcha_value: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: '两次输入的密码不匹配',
    path: ['confirm_password'],
  })
  .refine((data) => data.old_password !== data.new_password, {
    message: '新密码不能与旧密码相同',
    path: ['new_password'],
  })
export type APIUserResetPassword = {
  endpoint: '/api/user/reset-login/'
  method: MethodMap.POST
  query: z.infer<typeof APIUserResetPasswordQuery>
  response: {}
  errors: ErrorFactory<ErrorNotLogin | 'password' | 'captcha'>[]
}
