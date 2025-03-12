import { z } from 'zod'
import { ErrorFactory } from '../errors'
import { MethodMap } from '../base'

// GET
// 教师信息
const APITeacherInfoParams = z.object({
  id: z.number(),
})
export type APITeacherInfo = {
  endpoint: `/api/assessment/teacher/${string}/`
  method: MethodMap.GET
  params: z.infer<typeof APITeacherInfoParams>
  response: {
    teacher_info: {
      id: number
      name: string
      school: string
    }
    course_list: {
      course: {
        id: number
        semester: string
        code: string
        name: string
      }
      rating_avg: number
      normalized_rating_avg: number
      review_count: number
    }[]
  }
  errors: ErrorFactory<'teacher'>[]
}

// POST
// 新增教师
const APITeacherNewQuery = z.object({
  name: z.string(),
  school: z.number(),
})
export type APITeacherNew = {
  endpoint: '/api/assessment/teacher/'
  method: MethodMap.POST
  query: z.infer<typeof APITeacherNewQuery>
  response: {
    teacher_id: number
  }
  errors: ErrorFactory<'teacher'>[]
}
