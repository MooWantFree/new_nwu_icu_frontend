import { MethodMap } from '../base'

// GET
// 获取Blog
export type APITos = {
  endpoint: '/api/blogs/'
  method: MethodMap.GET
  response: {
    page: number
    max_page: number
    count: number
    results: {
      blogs: {
        title: string
        content: string
        create_time: string
        modify_time: string
      }[]
    }
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

