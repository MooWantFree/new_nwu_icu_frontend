import { ErrorFactory } from '../errors'
import { MethodMap } from '../base'


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
