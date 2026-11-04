import { ref } from 'vue'
import { useShadcnToast } from '@/lib/useShadcnToast'
import { checkLoginStatus } from '@/lib/logins'

type CreationAction = '添加课程' | '添加教师'

export const isLoginRequiredResponse = (response: { status: number; errors?: unknown }): boolean =>
  response.status === 401 || (Array.isArray(response.errors) && response.errors.some(error =>
    typeof error === 'object' && error !== null && error.err_code === 'not_login',
  ))

export function useCreationLogin() {
  const message = useShadcnToast()
  const checkingLogin = ref(false)
  const notifyLoginRequired = (action: CreationAction) => message.error(`请先登录后再${action}`)

  const requireLogin = async (action: CreationAction): Promise<boolean> => {
    if (checkingLogin.value) return false
    checkingLogin.value = true
    try {
      if (await checkLoginStatus()) return true
      notifyLoginRequired(action)
      return false
    } catch {
      message.error('暂时无法确认登录状态，请重试')
      return false
    } finally {
      checkingLogin.value = false
    }
  }

  return { checkingLogin, requireLogin, notifyLoginRequired }
}
