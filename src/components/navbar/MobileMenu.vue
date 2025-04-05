<template>
  <div class="md:hidden">
    <button
      @click="isMenuOpen = !isMenuOpen"
      class="p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
      aria-label="Toggle menu"
    >
      <Menu class="h-6 w-6" />
    </button>

    <!-- Mobile menu dropdown -->
    <div
      v-if="isMenuOpen"
      class="absolute top-16 right-4 w-72 bg-white rounded-lg shadow-lg z-50 overflow-hidden"
    >
      <!-- Home button -->
      <div class="border-b border-gray-100">
        <router-link
          to="/"
          class="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors"
          @click="isMenuOpen = false"
        >
          <House class="h-5 w-5 mr-3" />
          主页
        </router-link>
      </div>

      <!-- Main menu items -->
      <div class="max-h-[60vh] overflow-y-auto">
        <div v-for="item in menuItems" :key="item.key">
          <!-- Menu item with children -->
          <template v-if="item.children">
            <div
              class="flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors"
              @click="toggleSubmenu(item.key)"
            >
              <div class="flex items-center">
                <component
                  :is="item.icon"
                  class="h-5 w-5 mr-3"
                  v-if="item.icon"
                />
                {{ item.text }}
              </div>
              <ChevronDown class="h-4 w-4" />
            </div>
            <!-- Submenu items -->
            <div v-if="openSubmenus.includes(item.key)" class="bg-gray-50">
              <router-link
                v-for="child in item.children"
                :key="child.key"
                :to="child.path"
                class="block pl-12 pr-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                @click="isMenuOpen = false"
              >
                {{ child.text }}
              </router-link>
            </div>
          </template>

          <!-- Menu item with path -->
          <template v-else-if="item.path">
            <router-link
              :to="item.path"
              class="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors"
              @click="isMenuOpen = false"
            >
              <component
                :is="item.icon"
                class="h-5 w-5 mr-3"
                v-if="item.icon"
              />
              {{ item.text }}
            </router-link>
          </template>

          <!-- Menu item with custom click handler -->
          <template v-else-if="item.onclick">
            <div
              class="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors"
              @click="handleCustomClick(item)"
            >
              <component
                :is="item.icon"
                class="h-5 w-5 mr-3"
                v-if="item.icon"
              />
              {{ item.text }}
            </div>
          </template>
        </div>
      </div>

      <!-- User area buttons -->
      <div class="border-t border-gray-100">
        <template v-if="isLoggedIn">
          <router-link
            to="/user/me"
            class="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors"
            @click="isMenuOpen = false"
          >
            <User class="h-5 w-5 mr-3" />
            用户资料
          </router-link>
          <router-link
           to="/message/inbox"
           class="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors"
           @click="isMenuOpen = false"
          >
            <Mail class="h-5 w-5 mr-3" />
            消息
          </router-link>
          <button
            @click="handleLogout"
            class="flex items-center w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <LogOut class="h-5 w-5 mr-3" />
            退出登录
          </button>
        </template>
        <template v-else>
          <button
            @click="$emit('showLoginModal'); isMenuOpen = false"
            class="flex items-center w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <LogIn class="h-5 w-5 mr-3" />
            登录/注册
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import {
  User,
  LogOut,
  LogIn,
  Mail,
  Menu,
  House,
  ChevronDown,
} from 'lucide-vue-next'
import { api } from '@/lib/requests'

interface MenuItem {
  key: string
  text: string
  icon?: any
  path?: string
  onclick?: () => void
  children?: {
    key: string
    text: string
    path: string
  }[]
}

defineProps<{
  menuItems: MenuItem[]
  isLoggedIn: boolean
}>()

const emit = defineEmits<{
  (e: 'showLoginModal'): void
  (e: 'logout'): void
  (e: 'showMessage', message: string, type: 'success' | 'error' | 'info'): void
}>()

const isMenuOpen = ref(false)
const openSubmenus = ref<string[]>([])

const toggleSubmenu = (key: string) => {
  if (openSubmenus.value.includes(key)) {
    openSubmenus.value = openSubmenus.value.filter(k => k !== key)
  } else {
    openSubmenus.value.push(key)
  }
}

const handleCustomClick = (item: MenuItem) => {
  if (item.onclick) {
    item.onclick()
  }
  isMenuOpen.value = false
}

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
    isMenuOpen.value = false
  }
}

// Close menu when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  if (isMenuOpen.value) {
    const target = event.target as HTMLElement
    if (!target.closest('.md\\:hidden')) {
      isMenuOpen.value = false
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
