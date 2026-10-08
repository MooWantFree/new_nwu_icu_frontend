<template>
  <div data-message-layout class="h-[calc(100dvh-4rem-1px)] min-w-0 overflow-hidden bg-zinc-50 p-3 sm:p-4 lg:p-6">
    <div v-if="isLoading && !isLoggedIn" class="flex h-full items-center justify-center gap-2 text-sm text-zinc-500" role="status">
      <LoaderCircle class="h-5 w-5 animate-spin" aria-hidden="true" />正在加载消息中心…
    </div>
    <div v-else-if="isLoggedIn" data-message-shell class="mx-auto flex h-full min-w-0 max-w-7xl flex-col gap-3 overflow-hidden sm:flex-row lg:gap-4">
      <aside :class="['flex w-full shrink-0 flex-col rounded-xl border border-zinc-200 bg-white', isSidebarOpen ? 'sm:w-52 lg:w-56' : 'sm:w-14']">
        <div class="hidden h-16 shrink-0 items-center px-2 sm:flex" :class="isSidebarOpen ? 'justify-between pl-4' : 'justify-center'">
          <h2 v-if="isSidebarOpen" class="text-base font-semibold tracking-tight">消息中心</h2>
          <button type="button" :aria-label="isSidebarOpen ? '收起消息导航' : '展开消息导航'" :aria-expanded="isSidebarOpen" aria-controls="message-navigation"
            class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400" @click="toggleSidebar">
            <PanelLeftClose v-if="isSidebarOpen" class="h-4 w-4" aria-hidden="true" /><PanelLeftOpen v-else class="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <nav id="message-navigation" class="grid min-h-0 grid-cols-4 gap-1 p-2 sm:block sm:space-y-1 sm:overflow-y-auto sm:px-2 sm:pb-3 sm:pt-0" aria-label="消息中心导航">
          <RouterLink v-for="link in navLinks" :key="link.to" :to="link.to" :aria-label="link.text" :title="link.text"
            class="relative flex h-12 flex-col items-center justify-center gap-1 rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 sm:h-10 sm:flex-row sm:gap-2"
            :class="isSidebarOpen ? 'sm:justify-start sm:px-2.5' : 'sm:justify-center'" active-class="bg-zinc-100 font-medium text-zinc-950">
            <component :is="link.icon" class="h-4 w-4 shrink-0" aria-hidden="true" />
            <span class="min-w-0 truncate text-xs sm:flex-1 sm:text-sm" :class="{ 'sm:hidden': !isSidebarOpen }">{{ link.text }}</span>
            <span v-if="isSidebarOpen && unreadCount[link.name] > 0" class="hidden min-w-5 rounded-md bg-zinc-950 px-1.5 py-0.5 text-center text-xs font-medium tabular-nums text-white sm:block">{{ unreadCount[link.name] > 99 ? '99+' : unreadCount[link.name] }}</span>
            <span v-if="unreadCount[link.name] > 0" class="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-zinc-950" :class="{ 'sm:hidden': isSidebarOpen }" :aria-label="`${unreadCount[link.name]} 条未读`" />
          </RouterLink>
        </nav>
      </aside>
      <main class="h-full min-h-0 min-w-0 flex-1 overflow-hidden"><RouterView /></main>
    </div>
    <div v-else class="flex h-full items-center justify-center px-3">
      <section class="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
        <span class="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50"><MessageSquare class="h-5 w-5 text-zinc-500" aria-hidden="true" /></span>
        <h1 class="mt-4 text-lg font-semibold tracking-tight">需要登录</h1>
        <p class="mt-2 text-sm text-zinc-500">登录后查看私信和通知</p>
        <div class="mt-5 flex justify-center gap-2">
          <RouterLink to="/" class="inline-flex h-10 items-center justify-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium shadow-sm hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400">返回首页</RouterLink>
          <RouterLink :to="loginTo" class="inline-flex h-10 items-center justify-center rounded-md bg-zinc-950 px-4 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2">登录或注册</RouterLink>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { LoaderCircle, ThumbsUp, MessageSquare, Users, Bell, PanelLeftClose, PanelLeftOpen } from 'lucide-vue-next'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useUser } from '@/lib/useUser'

const { isLoggedIn, isLoading, userInfo, fetchUnreadCount } = useUser()
const route = useRoute()
const loginTo = computed(() => ({ path: '/login', query: { redirect: route.fullPath } }))
const isSidebarOpen = ref(true)
const unreadCount = computed(() => userInfo.value?.unread?.unread ?? { user: 0, reply: 0, like: 0, system: 0 })
const toggleSidebar = () => { isSidebarOpen.value = !isSidebarOpen.value }
const navLinks = [
  { to: '/message/inbox', icon: MessageSquare, text: '我的消息', name: 'user' },
  { to: '/message/replies', icon: Users, text: '回复我的', name: 'reply' },
  { to: '/message/likes', icon: ThumbsUp, text: '收到的赞', name: 'like' },
  { to: '/message/system', icon: Bell, text: '系统通知', name: 'system' },
] as const
let intervalId: ReturnType<typeof setInterval> | undefined
let active = true
let isPollingUnread = false
const pollUnreadCount = async () => {
  if (!active || !isLoggedIn.value || isPollingUnread) return
  isPollingUnread = true
  try { await fetchUnreadCount() }
  finally { isPollingUnread = false }
}
watch(isLoggedIn, loggedIn => { if (loggedIn) void pollUnreadCount() }, { immediate: true })
onMounted(() => {
  if (window.innerWidth < 768) isSidebarOpen.value = false
  intervalId = setInterval(pollUnreadCount, 3000)
})
onUnmounted(() => { active = false; clearInterval(intervalId) })
</script>
