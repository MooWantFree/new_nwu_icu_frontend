import { z } from 'zod'
import type { ErrorFactory } from '../errors'
import { MethodMap } from '../base'

// POST
// 推荐/不推荐课程
const APILikeNDislikeCourseQuery = z.object({
  course_id: z.number(),
  like: z.enum(['-1', '1']),
})
export type APILikeNDislikeCourse = {
  endpoint: '/api/assessment/course/like/'
  method: MethodMap.POST
  query: z.infer<typeof APILikeNDislikeCourseQuery>
  response: {
    name: string
    id: number
    like: {
      like: number
      dislike: number
    }
  }
  errors: ErrorFactory<'course'>[]
}

// GET
// 课程列表
export const APICourseListQuery = z.object({
  order_by: z.enum(['rating', 'popular']),
  course_type: z.enum([
    'all',
    'general',
    'pe',
    'english',
    'professional',
    'politics',
    'required',
    'optional',
  ]),
  page: z.number(),
})
export type APICourseList = {
  endpoint: '/api/assessment/courselist/'
  method: MethodMap.GET
  query: z.infer<typeof APICourseListQuery>
  response: {
    count: number
    max_page: number
    page: number
    results: {
      id: number
      name: string
      classification: string
      teacher: string
      semester: string
      review_count: number
      average_rating: number
      normalized_rating: number
    }[]
  }
}

// GET
// 学院列表
export type APISchoolList = {
  endpoint: '/api/assessment/school/',
  method: MethodMap.GET,
  response: {
    schools: {
      id: number,
      name: string
    }[]
  }
}

// GET
// 课程信息(评论信息, 评分等)
const APICourseInfoParams = z.object({
  id: z.number(),
})
export type APICourseInfo = {
  endpoint: `/api/assessment/course/${string}/`
  method: MethodMap.GET
  params: z.infer<typeof APICourseInfoParams>
  response: {
    id: number
    code: string
    name: string
    category: string
    teachers: {
      id: number
      avatar_uuid: string
      name: string
      school: string
      course: {
        id: number
        name: string
      }[]
    }[]
    semester: string[]
    school: string
    like: {
      like: number
      dislike: number
      user_option: number
    }
    rating_avg: string
    normalized_rating_avg: string
    request_user_review_id: number | null
    reviews: {
      id: number
      content: string
      rating: number
      modified_time: string
      created_time: string
      edited: boolean
      like: {
        like: number
        dislike: number
        user_option: number
      }
      difficulty: number
      grade: number
      homework: number
      reward: number
      semester: string
      author: {
        id: number
        nickname: string
        avatar: string
        anonymous: boolean
      }
      reply: {
        id: number
        floor_number: number
        created_time: string
        parent: number
        created_by: {
          id: number
          name: string
          avatar: string
        },
        like: {
          like: number
          dislike: number
          user_option: number
        }
        is_deleted: boolean
      }
    }[]
    other_dup_name_course: {
      course_id: number
      teacher_name: string
      rating: number
    }[]
  }
}

// POST
// 新增课程
export const APICourseNewQuery = z.object({
  name: z.string(),
  school: z.number(),
  classification: z.enum([
    'general',
    'pe',
    'english',
    'professional',
    'politics',
    'required',
    'optional',
  ]),
  teacher_id: z.number(),
})
export type APICourseNew = {
  endpoint: '/api/assessment/course/'
  method: MethodMap.POST
  query: z.infer<typeof APICourseNewQuery>
  response: {
    course_id: number
  }
  errors: ErrorFactory<'course' | 'classification' | 'school' | 'teacher'>[]
}

// GET
// 获取学期列表
export type APISemesterList = {
  endpoint: '/api/assessment/semester/'
  method: MethodMap.GET
  response: Record<string, string>
}
