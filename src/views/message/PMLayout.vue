<template>
  <div class="h-screen overflow-hidden bg-slate-50">
    <div v-if="isLoading && !isLoggedIn" class="flex h-screen items-center justify-center">
      <LoaderCircle class="w-16 h-16 text-blue-700 animate-spin" />
    </div>
    <div v-else-if="isLoggedIn" class="flex h-screen min-w-0 overflow-hidden">
      <aside :class="[
        'shrink-0 border-r border-slate-200 bg-white transition-all duration-300 ease-in-out',
        isSidebarOpen ? 'w-64' : 'w-20'
      ]">
        <div class="flex h-20 items-center justify-between px-4">
          <h2 v-if="isSidebarOpen" class="text-xl font-bold tracking-tight text-slate-900">消息中心</h2>
          <button type="button" :aria-label="isSidebarOpen ? '收起消息导航' : '展开消息导航'" @click="toggleSidebar" class="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
            <ChevronLeft v-if="isSidebarOpen" class="h-5 w-5" />
            <ChevronRight v-else class="h-5 w-5" />
          </button>
        </div>
        <nav class="space-y-1 px-3" aria-label="消息中心导航">
          <router-link
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="group relative flex min-h-11 items-center rounded-xl px-3 text-slate-600 transition-colors duration-200 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            active-class="bg-blue-50 text-blue-700"
          >
            <component :is="link.icon" class="mr-3 h-5 w-5 shrink-0" />
            <span v-if="isSidebarOpen" class="text-sm font-medium">{{ link.text }}</span>
            <span 
              v-if="isSidebarOpen && unreadCount[link.name as keyof typeof unreadCount] > 0"
              class="absolute right-3 top-2.5 min-w-5 rounded-full bg-red-500 px-1.5 py-0.5 text-center text-xs font-bold text-white"
            >
              {{ unreadCount[link.name as keyof typeof unreadCount] }}
            </span>
            <span 
              v-else-if="!isSidebarOpen && unreadCount[link.name as keyof typeof unreadCount] > 0" 
              class="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full"
            ></span>
          </router-link>
        </nav>
      </aside>
      <main class="min-w-0 flex-1 overflow-hidden bg-slate-50">
        <div class="h-full min-w-0">
          <router-view />
        </div>
      </main>
    </div>
    <div v-else class="flex h-screen items-center justify-center bg-gray-100">
      <div class="text-center bg-white p-8 rounded-xl shadow-2xl max-w-md w-full">
        <AlertCircle class="w-20 h-20 mx-auto text-yellow-500 mb-6" />
        <h2 class="mb-3 text-3xl font-bold text-gray-900">需要登录</h2>
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
  LoaderCircle,
  ThumbsUp,
  MessageSquare,
  Users,
  Bell,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-vue-next'
import { useUser } from '@/lib/useUser'
import { onMounted, onUnmounted, ref } from 'vue'
import { api } from '@/lib/requests'

const { isLoggedIn, isLoading } = useUser()
const isSidebarOpen = ref(true)
const unreadCount = ref({
  user: 0,
  reply: 0,
  like: 0,
  system: 0,
})

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

const navLinks = [
  { to: '/message/inbox', icon: MessageSquare, text: '我的消息', name: 'user' },
  { to: '/message/replies', icon: Users, text: '回复我的', name: 'reply' },
  { to: '/message/likes', icon: ThumbsUp, text: '收到的赞', name: 'like' },
  { to: '/message/system', icon: Bell, text: '系统通知', name: 'system' },
]

const fetchUnreadCount = async () => {
  if (!isLoggedIn.value) return
  if (isFetchingUnread.value) return
  isFetchingUnread.value = true
  try {
  const { content } = await api.get({ url: '/api/message/unread/' })
  unreadCount.value = {
    user: content.unread.user,
    reply: content.unread.reply,
    like: content.unread.like,
    system: content.unread.system,
  }
  } finally {
    isFetchingUnread.value = false
  }
}
const isFetchingUnread = ref(false)
const intervalId = ref<ReturnType<typeof setInterval> | undefined>(undefined)

onMounted(() => {
  if (window.innerWidth < 768) {
    isSidebarOpen.value = false
  }
  // Disable scroll
  document.body.style.overflow = 'hidden'
  fetchUnreadCount()
  intervalId.value = setInterval(fetchUnreadCount, 3000)
})

onUnmounted(() => {
  // Enable scroll
  document.body.style.overflow = 'auto'
  clearInterval(intervalId.value)
})
</script>
