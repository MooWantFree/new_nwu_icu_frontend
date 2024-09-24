import { CaptchaError } from "."
import { UserProfile } from "@/types/userProfile"

export type ResetPasswordResponse = {
  success: {},
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
  errors: 'username' | 'password'
}

export type RegisterResponse = {
  success: {
  },
  errors: 'username' | 'email' | 'password' | CaptchaError
}

export type CheckUsernameResponse = {
  success: {},
  errors: 'username'
}

export type UserProfileResponse = {
  success: UserProfile,
  errors: 'user',
}
