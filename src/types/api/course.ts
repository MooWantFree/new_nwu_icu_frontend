import { CourseData } from '@/types/courses'

export interface CourseDataResponse {
  success: CourseData,
}

export type CourseDataInCourseList = {
  id: number
  name: string
  teacher: string
  semester: string
  review_count: number
  average_rating: number
  normalized_rating: number
}

export type CourseListResponse = {
  success: {
    total: number;
    courses: {
      id: number;
      name: string;
      classification: string;
      teacher: string;
      semester: string;
      review_count: number;
      average_rating: number;
      normalized_rating: number;
    }[];
    has_next: boolean;
    has_previous: boolean;
    current_page: number;
    num_pages: number;
  }
}

export type SemesterListResponse = {
  success: {
    [key: string]: string
  }
}

export type ReplyCreateResponse = {
  success: {
    reply_id: number
  },
  errors: "reply"
}

export type ReplyDeleteResponse = {
  success: {},
  errors: "review"
}

export type ReplyLikeResponse = {
  success: {
    name: string,
    id: number,
    like: {
      like: number,
      dislike: number
    }
  }
}