import { CaptchaError } from "."

export type ResetPasswordResponse = {
  success: {

  },
  errors: {
    email: string[],
  } & CaptchaError
}

export type LoginResponse = {
  success: {
    id: number
    username: string
    email: string
    date_joined: string
    nickname: string
    avatar: string
    bio: string | null
  },
  errors: {
    username?: string[],
    password?: string[],
  }
}
