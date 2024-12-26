import { z } from 'zod'
import type { ErrorFactory } from '../errors'
import { MethodMap } from '../base'

// POST
// 搜索
export const APISearchQuery = z.object({
  keyword: z.string(),
  type: z.enum(['review', 'course', 'teacher']),
})
export type ReviewSearchResult = {
  id: number
  course: {
    id: number
    name: string
  }
  content: string
  rating: number
  created_by: {
    id: number
    nickname: string
    avatar: string
  }
  modify_time: string
  like: {
    like: number
    dislike: number
  }
  semester: string
}
export type CourseSearchResult = {
  id: number
  name: string
  teacher: string
  classification: string
  school: string
  semester: string
  rating: {
    average_rating: number
    normalized_rating: number
  }
  like: {
    like: number
    dislike: number
  }
  review_count: number
  latest_review_time: string | null
}
export type TeacherSearchResult = {
  id: number
  name: string
  school: string
  avatar_uuid: string
}
export type ResourceSearchResult = {
  id: number
  name: string
  size: number
  path: string
  type: string
  url: string
}
export type APISearch = {
  endpoint: '/api/assessment/search/'
  method: MethodMap.POST
  query: z.infer<typeof APISearchQuery>
  response: {
    search_result: {
      review: ReviewSearchResult
      course: CourseSearchResult
      teacher: TeacherSearchResult
      resource: ResourceSearchResult
    }[z.infer<typeof APISearchQuery>['type']][]
    // pagination
    total_pages: number
    current_page: number
    has_next: boolean
    has_previous: boolean
    total_count: number
  }
  errors: ErrorFactory<'keyword'>[]
}
