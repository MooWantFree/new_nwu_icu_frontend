type LikeDislike = {
  like: number;
  dislike: number;
};

type Reply = {
  content: string;
  created_time: string;
  created_by: {
    id: number;
    name: string;
    avatar: string;
  };
  like: LikeDislike;
};

export type Review = {
  id: number;
  content: string;
  rating: number;
  modified_time: string;
  created_time: string;
  edited: boolean;
  like: LikeDislike;
  difficulty: string;
  grade: string;
  homework: string;
  reward: string;
  semester: string;
  reply: Reply[];
};

type Teacher = {
  id: number;
  name: string;
  school: string;
};

export type CourseData = {
  id: number;
  code: string;
  name: string;
  category: string;
  teachers: Teacher[];
  semester: string[];
  school: string;
  rating_avg: string;
  normalized_rating_avg: string;
  reviews: Review[];
};
