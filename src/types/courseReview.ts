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
  is_student: boolean
}

export { LatestCourseReviewResponse, Review }
