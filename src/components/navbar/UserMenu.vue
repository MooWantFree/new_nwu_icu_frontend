<template>
  <div class="relative">
    <!-- Compact account entry for logged out users -->
    <button
      v-if="!isLoggedIn"
      type="button"
      @click="$emit('showLoginModal')"
      :disabled="isLoading"
      class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      aria-label="登录或注册"
      title="登录或注册"
    >
      <LogIn class="h-5 w-5" aria-hidden="true" />
    </button>

    <!-- User avatar and dropdown for logged in users -->
    <div v-else class="relative">
      <button
        @click="isDropdownOpen = !isDropdownOpen"
        class="flex items-center focus:outline-none"
      >
        <UserAvatar
          :avatar="userInfo?.avatar"
          :uuid="userInfo?.uuid"
          :has-avatar="userInfo?.has_avatar"
          alt="User avatar"
          class="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
        />
      </button>

      <!-- Dropdown menu -->
      <div
        v-if="isDropdownOpen"
        class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10"
      >
        <router-link
          to="/user/me"
          class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          @click="isDropdownOpen = false"
        >
          <div class="flex items-center">
            <User class="h-5 w-5 mr-2" />
            用户资料
          </div>
        </router-link>
        
        <router-link
          to="/user/settings/profile"
          class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          @click="isDropdownOpen = false"
        >
          <div class="flex items-center">
            <Pencil class="h-5 w-5 mr-2" />
            编辑用户资料
          </div>
        </router-link>
        
        <button
          @click="handleLogout"
          class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <div class="flex items-center">
            <LogOut class="h-5 w-5 mr-2" />
            退出登录
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { api } from '@/lib/requests'
import { User, Pencil, LogIn, LogOut } from 'lucide-vue-next'
import { APILogin } from '@/types/api/user/user'
import UserAvatar from '@/components/common/UserAvatar.vue'

type UserProfile = APILogin['response']

defineProps<{
  isLoggedIn: boolean
  isLoading: boolean
  userInfo: UserProfile | null
}>()

const emit = defineEmits<{
  (e: 'showLoginModal'): void
  (e: 'logout'): void
  (e: 'showMessage', message: string, type: 'success' | 'error' | 'info'): void
}>()

const isDropdownOpen = ref(false)

const handleLogout = async () => {
  if (!window.dispatchEvent(new CustomEvent('guestbook:before-logout', { cancelable: true }))) {
    return
  }
  try {
    const { status } = await api.post({ url: '/api/user/logout/' })
    if (status !== 200) {
      emit('showMessage', '退出登录失败，请稍后再试', 'error')
      emit('logout')
      return
    }
    emit('logout')
    emit('showMessage', '成功退出登录，欢迎你下次再来', 'success')
  } catch (error) {
    emit('showMessage', '退出登录失败，请稍后再试', 'error')
    emit('logout')
  } finally {
    isDropdownOpen.value = false
  }
}

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  if (isDropdownOpen.value) {
    const target = event.target as HTMLElement
    if (!target.closest('.relative')) {
      isDropdownOpen.value = false
    }
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
