export type MessageUserRequest = {
  page: number,
}

export type MessageUserResponse = {
  success: {
    page: number,
    max_page: number,
    count: number,
    results: {
      id: number,
      chatter: {
        id: number,
        nickname: string,
        avatar: string,
      },
      last_message: {
        content: string,
        datetime: string,
      },
      unread_count: number,
    }[],
  }
}