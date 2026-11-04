import { ref, onMounted, onUnmounted, readonly } from 'vue'
import { api } from '@/lib/requests'
import { APIUserProfile } from '@/types/api/user/profilePage'
import { APIUnreadMessageCount } from '@/types/api/messages/messages'

type UserProfile = Omit<APIUserProfile['response'], 'is_me'> & {unread: APIUnreadMessageCount['response']}

const userInfo = ref<UserProfile | null>(null)
const isLoggedIn = ref(false)
const isLoading = ref(false)
const profileError = ref('')
let unreadRequestVersion = 0
let sessionVersion = 0
let profileRequestVersion = 0

const login = (data: UserProfile) => {
  sessionVersion += 1
  profileError.value = ''
  unreadRequestVersion += 1
  userInfo.value = data
  isLoggedIn.value = true
}

const logout = () => {
  sessionVersion += 1
  profileError.value = ''
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
  profileError.value = ''
  const session = sessionVersion
  const requestVersion = ++profileRequestVersion
  const unreadVersion = ++unreadRequestVersion
  // A count failure must never invalidate the user's session. Handle rejection
  // immediately, even while the profile request is still pending.
  const profileReq = api.get({ url: '/api/user/profile/' })
  const unreadReq = api.get({ url: '/api/message/unread/' }).catch(() => null)
  try {
    const profile = await profileReq
    if (session !== sessionVersion) return
    if (profile.status === 401) {
      logout()
      return
    }
    if (profile.status !== 200) throw new Error('profile unavailable')
    const previousCounts = userInfo.value?.id === profile.content.id ? userInfo.value.unread : undefined
    userInfo.value = {
      ...profile.content,
      unread: previousCounts ?? { unread: { user: 0, reply: 0, like: 0, system: 0 }, total: 0 },
    }
    isLoggedIn.value = true
    isLoading.value = false
    void unreadReq.then(unread => {
      if (session === sessionVersion && unreadVersion === unreadRequestVersion && unread?.status === 200 && userInfo.value?.id === profile.content.id) {
        userInfo.value = { ...userInfo.value, unread: unread.content }
      }
    })
  } catch (error) {
    console.error('Error fetching user info:', error)
    if (session === sessionVersion) profileError.value = '个人资料加载失败，请重试'
  } finally {
    if (requestVersion === profileRequestVersion) isLoading.value = false
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
    profileError: readonly(profileError),
    fetchUserInfo,
    fetchUnreadCount,
    login,
    logout,
  }
}
