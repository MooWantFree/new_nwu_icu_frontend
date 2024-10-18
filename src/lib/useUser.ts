import { ref, onMounted, onUnmounted, watch, readonly } from 'vue'
import { UserProfile } from '@/types/userProfile'
import { UserProfileResponse } from '@/types/api/users'
import { api } from '@/lib/requests'

const userInfo = ref<UserProfile | null>(null)
const isLoggedIn = ref(false)
const isLoading = ref(false)

let timeoutId: NodeJS.Timeout | null = null

export function useUser() {
  const checkLoginStatus = () => {
    const cookieExists = document.cookie.split(';').some(item => item.trim().startsWith('sessionid='))
    if (!cookieExists) {
      logout()
      return
    }
    // Check if the cookie is still valid
    const sessionTimeout = getSessionTimeout()
    if (sessionTimeout <= 0 || !sessionTimeout) {
      logout()
      return
    }
    // Fetch user info if the cookie is still valid and user is not logged in
    if (!isLoggedIn.value) {
      fetchUserInfo()
    }
  }

  const getSessionTimeout = (): number | null => {
    const userSessionCookie = document.cookie
      .split(';')
      .find(cookie => cookie.trim().startsWith('sessionid='))

    if (userSessionCookie) {
      const [, cookieValue] = userSessionCookie.split('=')
      const [, expiresAt] = cookieValue.split('|')
      if (!expiresAt) {
        return 365 * 24 * 60 * 60 * 1000
      }
      const expirationTime = new Date(expiresAt).getTime()
      const currentTime = new Date().getTime()
      return Math.max(0, expirationTime - currentTime)
    }
    return null
  }

  const resetTimeout = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    const sessionTimeout = getSessionTimeout() || 365 * 24 * 60 * 60 * 1000 // 365 days
    timeoutId = setTimeout(() => {
      logout()
    }, sessionTimeout)
  }

  const fetchUserInfo = async () => {
    isLoading.value = true
    try {
      const response = await api.get<UserProfileResponse>('/api/user/profile/')
      if (response.status === 200) {
        login(response.content)
      } else {
        logout()
      }
    } catch (error) {
      console.error('Error fetching user info:', error)
      logout()
    } finally {
      isLoading.value = false
    }
  }

  const login = (data: UserProfile) => {
    userInfo.value = data
    isLoggedIn.value = true
    resetTimeout()
  }

  const logout = () => {
    userInfo.value = null
    isLoggedIn.value = false
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  watch([userInfo, isLoggedIn], () => {
    checkLoginStatus()
  })

  onMounted(() => {
    checkLoginStatus()
    window.addEventListener('focus', checkLoginStatus)
  })

  onUnmounted(() => {
    window.removeEventListener('focus', checkLoginStatus)
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  })

  return {
    userInfo: readonly(userInfo),
    isLoggedIn: readonly(isLoggedIn),
    isLoading: readonly(isLoading),
    fetchUserInfo,
    login,
    logout,
  }
}
