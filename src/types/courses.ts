type LikeDislike = {
  like: number
  user_option: number
  dislike: number
}

type Reply = {
  id: number,
  parent: number,
  content: string
  created_time: string
  created_by: {
    id: number
    name: string
    avatar: string
  }
  like: LikeDislike
}

export type Review = {
  id: number
  content: string
  rating: number
  modified_time: string
  created_time: string
  edited: boolean
  like: LikeDislike
  difficulty: number
  grade: number
  homework: number
  reward: number
  semester: string
  author: Author
  reply: Reply[]
}

type Author = {
  avatar: string
  id: number
  nickname: string
}

type Teacher = {
  id: number
  name: string
  school: string
  course?: Course[]
}

export type CourseData = {
  id: number
  code: string
  name: string
  category: string
  teachers: Teacher[]
  semester: string[]
  school: string
  request_user_review_id: number | null
  like: LikeDislike
  rating_avg: string
  normalized_rating_avg: string
  reviews: Review[]
  other_dup_name_course: {
    course_id: number
    teacher_name: string
    rating: number
  }[]
}

type Course = {
  id: number
  name: string
}