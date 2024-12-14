export type MessageReplyResponse = {
  success: {
    results: {
      id: number,
      reply: {
        id: number,
        content: string,
      },
      created_by: {
        id: number,
        nickname: string,
        avatar: string,
      },
      course: {
        id: number,
        name: string,
      },
      raw_post: {
        id: number,
        classify: string,
        content: string,
      },
      datetime: string,
    }[],
    max_page: number,
    page: number,
    count: number,
    has_next: boolean,
  }
}