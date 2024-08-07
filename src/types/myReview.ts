interface Review {
  id: number;
  anonymous: boolean;
  datetime: string;
  course: {
    course_name: string;
    course_id: number;
  };
  like: {
    like: number;
    dislike: number;
  };
  content: {
    current_content: string;
    content_history: string[];
  };
  teachers: {
    teacher_name: string;
    teacher_id: number;
  }[];
  semester: string;
}

interface MyReviews {
  message: { reviews: Review[]; }

}


export {MyReviews, Review}