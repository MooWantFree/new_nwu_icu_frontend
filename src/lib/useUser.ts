import { ref, onMounted, onUnmounted, readonly } from 'vue'
import { api } from '@/lib/requests'
import { APIUserProfile } from '@/types/api/user/profilePage'
import { APIUnreadMessageCount } from '@/types/api/messages/messages'

type UserProfile = Omit<APIUserProfile['response'], 'is_me'> & {unread: APIUnreadMessageCount['response']}

const userInfo = ref<UserProfile | null>(null)
const isLoggedIn = ref(false)
const isLoading = ref(false)
let unreadRequestVersion = 0

const login = (data: UserProfile) => {
  unreadRequestVersion += 1
  userInfo.value = data
  isLoggedIn.value = true
}

const logout = () => {
  unreadRequestVersion += 1
  userInfo.value = null
  isLoggedIn.value = false
}

const fetchUnreadCount = async () => {
  if (!isLoggedIn.value || !userInfo.value) return
  const version = ++unreadRequestVersion
  const userId = userInfo.value.id
  try {
    const response = await api.get({ url: '/api/message/unread/' })
    if (version !== unreadRequestVersion || userInfo.value?.id !== userId) return
    if (response.status === 200) {
      userInfo.value = { ...userInfo.value, unread: response.content }
    }
  } catch (error) {
    console.error('Error fetching unread messages:', error)
  }
}

const fetchUserInfo = async () => {
  if (isLoading.value) return
  isLoading.value = true
  const unreadVersion = ++unreadRequestVersion
  try {
    const profileReq = api.get({ url: '/api/user/profile/' })
    const unreadReq = api.get({ url: '/api/message/unread/' })
    const [profile, unread] = await Promise.all([profileReq, unreadReq])
    if (profile.status === 200 && unread.status === 200) {
      if (userInfo.value?.id === profile.content.id) {
        // A read refresh can complete while this slower profile request is in
        // flight. Keep its newer counts and let any current unread poll finish.
        userInfo.value = {
          ...profile.content,
          unread: unreadVersion === unreadRequestVersion ? unread.content : userInfo.value.unread,
        }
      } else {
        login({ ...profile.content, unread: unread.content })
      }
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
    fetchUnreadCount,
    login,
    logout,
  }
}
