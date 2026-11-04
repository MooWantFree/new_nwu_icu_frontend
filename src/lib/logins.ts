import { requestSignal } from './requestSignal'

const checkLoginStatus = async (): Promise<boolean> => {
  const response = await fetch('/api/user/profile/', { credentials: 'include', signal: requestSignal() })
  if (response.status === 401) return false
  if (!response.ok) throw new Error('暂时无法确认登录状态，请重试')
  return true
}

export { checkLoginStatus }
