type LatestCourseReview = {
  errors?: null,
  message: string,
  status: number,
  content: {
    reviews: Review[],
    total: number
  },
}

type Review = {
  id: number,
    author: {
    name: string,
      id: number,
      avatar_uuid: string,
  },
  datetime: string,
    course: {
    name: string,
      id: number
  },
  content: string,
    teachers: {
    name: string,
      id: number,
  }[],
    edited: boolean,
  is_student: boolean,
}

export {LatestCourseReview, Review}