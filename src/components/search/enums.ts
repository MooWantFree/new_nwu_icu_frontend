import { APISearchQuery } from '@/types/api/search/search'
import { z } from 'zod'
export const searchEnums = APISearchQuery.shape.type.enum
export type SearchType = z.infer<typeof APISearchQuery>['type']
export const searchTypeTooltip: Record<SearchType, string> = {
  [searchEnums.review]: '课程评价',
  [searchEnums.course]: '课程',
  [searchEnums.teacher]: '教师',
}
