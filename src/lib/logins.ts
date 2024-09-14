const checkLoginStatus = (): boolean => {
  const cookies = document.cookie.split(';')
  const sessionCookie = cookies.find(cookie => cookie.trim().startsWith('sessionid='))
  return !!sessionCookie && sessionCookie.split('=')[1].trim() !== ''
}

export {
  checkLoginStatus
}