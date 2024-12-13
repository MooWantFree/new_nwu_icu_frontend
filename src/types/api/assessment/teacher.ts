type TeacherCourse = {
  course: {
    id: number
    semester: string
    code: string
    name: string
    description?: string
  }
  rating_avg: number
  normalized_rating_avg: number
  review_count: number
}

export type TeacherResponse = {
  success: {
    teacher_info: {
        id: number
        name: string
        school: string
        avatar?: string
        description?: string
    }
    course_list: TeacherCourse[]
  }
}

