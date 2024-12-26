import { MethodMap } from '../base'

// GET
// 获取Tos
export type APITos = {
    endpoint: '/api/tos/'
    method: MethodMap.GET
    response: {
        tos: string
    }
}

// GET
// 获取About
export type APIAbout = {
    endpoint: '/api/about/'
    method: MethodMap.GET
    response: {
        about: string
    }
}

