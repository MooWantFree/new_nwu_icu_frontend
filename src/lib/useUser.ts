import { ref, onMounted, onUnmounted, watch, readonly } from 'vue'
import { api } from '@/lib/requests'
import { APIUserProfile } from '@/types/api/user/profilePage'
import { APIUnreadMessageCount } from '@/types/api/messages/messages'

type UserProfile = Omit<APIUserProfile['response'], 'is_me'> & {unread: APIUnreadMessageCount['response']}

const userInfo = ref<UserProfile | null>(null)
const isLoggedIn = ref(false)
const isLoading = ref(false)

let timeoutId: NodeJS.Timeout | null = null

export function useUser(setup: boolean = true) {
  const checkLoginStatus = () => {
    const cookieExists = document.cookie
      .split(';')
      .some((item) => item.trim().startsWith('sessionid='))
    if (!cookieExists) {
      logout()
      return
    }
    // Check if the cookie is still valid
    const sessionTimeout = getSessionTimeout()
    if ((sessionTimeout && sessionTimeout <= 0) || !sessionTimeout) {
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
      .find((cookie) => cookie.trim().startsWith('sessionid='))

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
      const profileReq = api.get({ url: '/api/user/profile/' })
      const unreadReq = api.get({ url: '/api/message/unread/' })
      const [profile, unread] = await Promise.all([profileReq, unreadReq])
      if (profile.status === 200 && unread.status === 200) {
        login({
          ...profile.content,
          unread: unread.content,
        })
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

  if (setup) {
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
  }

  return {
    userInfo: readonly(userInfo),
    isLoggedIn: readonly(isLoggedIn),
    isLoading: readonly(isLoading),
    fetchUserInfo,
    login,
    logout,
  }
}
