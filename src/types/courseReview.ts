type LatestCourseReviewResponse = {
  success: {
    count: number
    max_page: number
    page: number
    results: Review[]
  }
}

type Review = {
  id: number
  author: {
    nickname: string
    id: number
    avatar_uuid: string
    anonymous: boolean
    is_student: boolean
  }
  datetime: string
  course: {
    name: string
    id: number
  }
  content: string
  teachers: {
    name: string
    id: number
  }[]
  edited: boolean
}

export type { LatestCourseReviewResponse, Review }
