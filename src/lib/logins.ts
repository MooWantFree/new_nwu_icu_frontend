const checkLoginStatus = (): boolean => {
  const cookie = document.cookie
  return cookie.includes('sessionid') // TODO
}

export {
  checkLoginStatus
}