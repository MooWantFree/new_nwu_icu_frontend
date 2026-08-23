import { MethodMap } from '../base'

// GET
// 获取Blog
export type APITos = {
  endpoint: '/api/blogs/'
  method: MethodMap.GET
  query: {
    page: number
    page_size: number
  }
  response: {
    page: number
    max_page: number
    count: number
    results: {
      blogs: {
        id: number
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

export type APIBlogDetail = {
  endpoint: '/api/blogs/:id'
  method: MethodMap.GET
  params: { id: number }
  response: {
    results: {
      blogs: APITos['response']['results']['blogs']
    }
  }
}

export type APIBulletins = {
  endpoint: '/api/bulletins/'
  method: MethodMap.GET
  response: {
    bulletin_list: {
      title: string
      content: string
      publisher: { nickname: string; id: number; avatar: string }
      create_time: string
      update_time: string
    }[]
  }
}

