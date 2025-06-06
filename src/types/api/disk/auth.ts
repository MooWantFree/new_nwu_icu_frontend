export interface Me {
  code: number,
  message: string,
  data: {
    id: number,
    username: string,
    password: string,
    base_path: string,
    role: number,
    disabled: boolean,
    permission: number,
    sso_id: string,
    otp: boolean,
  }
}