type MyReview = {
  id: number
  title: string
  content: string
  created_at: string
}

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