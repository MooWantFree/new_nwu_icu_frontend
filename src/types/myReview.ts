interface Review {
  id: number;
  anonymous: boolean;
  datetime: string;
  course: {
    name: string;
    id: number;
    semester: string;
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
    name: string;
    id: number;
  }[];

}

interface MyReviews {
  message: { reviews: Review[]; }

}


export {MyReviews, Review}