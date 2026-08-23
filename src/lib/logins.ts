const checkLoginStatus = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/user/profile/', { credentials: 'include' })
    return response.ok
  }
  catch {
    return false
  }
}

export { checkLoginStatus }
