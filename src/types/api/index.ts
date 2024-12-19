export type ResponseBase = {
  success: object
  request?: Record<string,string|number> 
  errors?: string[] | string
}

export type APIResponse<T extends ResponseBase> = {
  message: string
  status: number
  contents: T["success"]
  errors?: {
    field?: T extends { errors: infer E } ? E : string
    err_msg: string
    err_code: string
  }[]
}

export type CaptchaError = "captcha_key"
