import { z } from 'zod'
import { ErrorFactory } from '../errors'
import { MethodMap } from '../base'

// GET
// 获取验证码
export type APICaptcha = {
  endpoint: '/api/captcha/'
  method: MethodMap.GET
  response: {
    image_url: string
    key: string
  }
}

// POST
// 验证验证码
const APICaptchaVerifyQuery = z.object({
  captcha_key: z.string(),
  captcha_value: z.string(),
})
export type APICaptchaVerify = {
  endpoint: '/api/captcha/'
  method: MethodMap.POST
  query: z.infer<typeof APICaptchaVerifyQuery>
  response: {}
  errors: ErrorFactory<'captcha'>[]
}
