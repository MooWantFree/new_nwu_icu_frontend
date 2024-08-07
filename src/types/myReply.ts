interface Like {
  like: number;
  dislike: number;
}

interface ReplyContent {
  id: number;
  content: string;
}

interface Course {
  id: number;
  name: string;
  semester: string;
}

interface Reply {
  id: number;
  content: string;
  datetime: string;
  course: Course;
  reply: ReplyContent;
  like: Like;
}

interface Replies {
  message: Reply[];
}

export {Replies, Reply}