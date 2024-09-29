export type NewReviewRequest = {
  course: number
  content: string
  rating: number
  anonymous: boolean
  difficulty: number
  grade: number
  homework: number
  reward: number
  semester: number
}

export type NewReviewResponse = {
  success: {
    review: number
    updated: boolean
  },
  // errors: 
  // TODO: LoginRequiredError
}

export type DeleteReviewRequest = {
  review_id: number
}

export type DeleteReviewResponse = {
  success: {
  },
  errors: 'auth' | 'review' | 'login'
}

