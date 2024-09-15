export type ResponseBase = {
  success: object,
  errors: object | null
}

export type APIResponse<T extends ResponseBase> = {
  message: string,
  status: number,
  contents: T["success"],
  errors: T["errors"]
}

export type CaptchaError = {
  captcha_value: string[],
}