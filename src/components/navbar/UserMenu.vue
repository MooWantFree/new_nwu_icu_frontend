<template>
  <div class="relative">
    <!-- Login/Register button for logged out users -->
    <button
      v-if="!isLoggedIn"
      @click="$emit('showLoginModal')"
      :disabled="isLoading"
      class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
    >
      登录/注册
    </button>

    <!-- User avatar and dropdown for logged in users -->
    <div v-else class="relative">
      <button
        @click="isDropdownOpen = !isDropdownOpen"
        class="flex items-center focus:outline-none"
      >
        <img
          v-if="userInfo?.avatar"
          :src="`/api/download/${userInfo.avatar}`"
          alt="User avatar"
          class="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
        />
        <div
          v-else
          class="h-10 w-10 rounded-full bg-red-500 text-yellow-300 flex items-center justify-center font-bold"
        >
          {{ userInfo?.nickname?.charAt(0) || userInfo?.username?.charAt(0) || 'U' }}
        </div>
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
import { User, Pencil, LogOut } from 'lucide-vue-next'
import { APILogin } from '@/types/api/user/user'

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
