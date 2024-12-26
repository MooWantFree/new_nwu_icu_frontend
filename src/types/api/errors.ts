export type ErrorFactory<T extends string> = {
    field: T
    err_code: string
    err_msg: string
}

export type ErrorNotLogin = 'login'