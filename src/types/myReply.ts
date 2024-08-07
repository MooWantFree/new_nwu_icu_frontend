interface Like {
  like: number;
  dislike: number;
}

interface Reply {
  id: number;
  content: string;
}

interface Message {
  id: number;
  content: string;
  datetime: string;
  reply: Reply;
  like: Like;
}

interface ResponseData {
  message: Message[];
}
