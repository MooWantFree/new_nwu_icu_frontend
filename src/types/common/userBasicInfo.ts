import { z } from 'zod'
export const basePasswordSchema = z
  .string()
  .min(8, '密码长度至少为8个字符')
  .max(30, '密码长度不能超过30个字符')
  .regex(
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).*$/,
    '密码必须包含至少一个大写字母、一个小写字母和一个数字'
  )

export const usernameSchema = z
  .string()
  .regex(
    /^(?=.*[a-zA-Z])\w{8,29}$/,
    '只能包含字母、数字和下划线，同时必须包含一个字母，长度在8到29字符之间'
  )
