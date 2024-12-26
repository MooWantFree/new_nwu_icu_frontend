import { ErrorFactory } from '../errors'
import { MethodMap } from '../base'


// GET
// 获取已发表评价
export type APIMyReview = {
  endpoint: '/api/assessment/my/review/'
  method: MethodMap.GET
  response: {
    page: number
    max_page: number
    count: number
    results: {
      id: number
      anonymous: boolean
      datetime: string
      course: {
        name: string
        id: number
        semester: string
      }
      like: {
        like: number
        dislike: number
      }
      content: {
        current_content: string
        content_history: any[]
      }
      teachers: {
        name: string
        id: number
      }[]
    }[]
  }
  errors: ErrorFactory<'login'>[]
}

// GET
// 获取已发表回复
export type APIMyReply = {
  endpoint: '/api/assessment/my/reply/'
  method: MethodMap.GET
  response: {
    id: number
    content: string
    datetime: string
    course: {
      name: string
      id: number
      semester: string
    }
    reply: {
      id: number
      content: string
    }
    like: {
      like: number
      dislike: number
    }
  }[]
  errors: ErrorFactory<'login'>[]
}
