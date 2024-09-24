export type GetCaptchaResponse = {
  success: {
    image_url: string
    key: string
  },
  errors: []
}

export type CheckCaptchaResponse = {
  success: {},
  errors: 'captcha'
}
