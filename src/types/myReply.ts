type Like = {
  like: number
  dislike: number
}

type ReplyContent = {
  id: number
  content: string
}

type Course = {
  id: number
  name: string
  semester: string
}

type Reply = {
  id: number
  content: string
  datetime: string
  course: Course
  reply: ReplyContent
  like: Like
}

type Replies = {
  message: Reply[]
}

export { Replies, Reply }
