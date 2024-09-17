export type ResponseBase = {
  success: object
  errors?: string[] | string
}

export type APIResponse<T extends ResponseBase> = {
  message: string
  status: number
  contents: T["success"]
  error?: {
    message: string
    details: {
      field?: T extends { errors: infer E } ? E : string
      err_msg: string
      err_code: string
    }[]
  }
}

export type CaptchaError = "captcha_key"