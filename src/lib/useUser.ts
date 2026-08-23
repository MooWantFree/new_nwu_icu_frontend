import { ref, onMounted, onUnmounted, readonly } from 'vue'
import { api } from '@/lib/requests'
import { APIUserProfile } from '@/types/api/user/profilePage'
import { APIUnreadMessageCount } from '@/types/api/messages/messages'

type UserProfile = Omit<APIUserProfile['response'], 'is_me'> & {unread: APIUnreadMessageCount['response']}

const userInfo = ref<UserProfile | null>(null)
const isLoggedIn = ref(false)
const isLoading = ref(false)

const login = (data: UserProfile) => {
  userInfo.value = data
  isLoggedIn.value = true
}

const logout = () => {
  userInfo.value = null
  isLoggedIn.value = false
}

const fetchUserInfo = async () => {
  if (isLoading.value) return
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

let setupConsumers = 0
const handleWindowFocus = () => {
  void fetchUserInfo()
}

export function useUser(setup: boolean = true) {
  if (setup) {
    onMounted(() => {
      setupConsumers += 1
      if (setupConsumers === 1) {
        void fetchUserInfo()
        window.addEventListener('focus', handleWindowFocus)
      }
    })

    onUnmounted(() => {
      setupConsumers = Math.max(0, setupConsumers - 1)
      if (setupConsumers === 0) {
        window.removeEventListener('focus', handleWindowFocus)
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
