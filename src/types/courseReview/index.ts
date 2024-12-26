import type { APICourseInfo } from '@/types/api/courseReview/course'
import { APIPostReviewQuery } from '@/types/api/courseReview/review'
import type { APILatestReviews } from '@/types/api/courseReview/review'
import { z } from 'zod'

export type Review = APICourseInfo['response']['reviews'][0]
export type CourseData = APICourseInfo['response']

export type ReviewTimeline = APILatestReviews['response']['results'][0]

export type ReviewDataBase = z.infer<typeof APIPostReviewQuery>