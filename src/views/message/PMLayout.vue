<template>
  <div class="min-h-screen bg-gray-100">
    <div v-if="isLoading" class="flex items-center justify-center h-screen">
      <div class="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
    </div>
    <div v-else-if="isLoggedIn" class="flex h-screen overflow-hidden">
      <aside :class="[
        'bg-white shadow-lg transition-all duration-300 ease-in-out',
        isSidebarOpen ? 'w-64' : 'w-20'
      ]">
        <div class="p-5 flex items-center justify-between">
          <h2 v-if="isSidebarOpen" class="text-xl font-semibold text-gray-800">消息中心</h2>
          <button @click="toggleSidebar" class="p-2 rounded-full hover:bg-gray-200">
            <ChevronLeft v-if="isSidebarOpen" class="w-6 h-6 text-gray-600" />
            <ChevronRight v-else class="w-6 h-6 text-gray-600" />
          </button>
        </div>
        <nav class="mt-5 px-2">
          <router-link
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="group flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors duration-200"
            active-class="bg-blue-100 text-blue-600"
          >
            <component :is="link.icon" class="w-5 h-5 mr-3" />
            <span v-if="isSidebarOpen" class="text-sm font-medium">{{ link.text }}</span>
          </router-link>
        </nav>
        <div class="absolute bottom-0 w-full p-4">
          <button class="w-full flex items-center justify-center py-2 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-200">
            <Settings class="w-5 h-5 mr-2" />
            <span v-if="isSidebarOpen" class="text-sm font-medium">消息设置</span>
          </button>
        </div>
      </aside>
      <main class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
        <div class="container mx-auto px-6 py-8">
          <router-view />
        </div>
      </main>
    </div>
    <div v-else class="flex items-center justify-center h-screen bg-gray-100">
      <div class="text-center bg-white p-8 rounded-xl shadow-2xl max-w-md w-full">
        <AlertCircle class="w-20 h-20 mx-auto text-yellow-500 mb-6" />
        <h2 class="text-3xl font-bold text-gray-800 mb-3">需要登录</h2>
        <p class="text-gray-600 mb-8">请先登录以访问消息中心</p>
        <router-link
          to="/"
          class="inline-block px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-300 shadow-md"
        >
          返回首页
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Bell,
  ThumbsUp,
  MessageSquare,
  Settings,
  Users,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-vue-next'
import { useUser } from '@/lib/useUser'
import { ref } from 'vue'

const { isLoggedIn, isLoading } = useUser()
const isSidebarOpen = ref(true)

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

const navLinks = [
  { to: '/message/inbox', icon: MessageSquare, text: '我的消息' },
  { to: '/message/replies', icon: Users, text: '回复我的' },
  { to: '/message/likes', icon: ThumbsUp, text: '收到的赞' },
  { to: '/message/system', icon: Bell, text: '系统通知' },
]
</script>
