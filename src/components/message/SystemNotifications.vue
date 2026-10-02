<template>
  <div class="h-full min-w-0 overflow-hidden bg-slate-50 p-3 sm:p-4">
    <section class="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header class="flex min-h-20 items-center justify-between gap-4 border-b border-slate-200 px-5 sm:px-6">
        <div class="flex min-w-0 items-center gap-3">
          <div class="rounded-xl bg-blue-50 p-2.5 text-blue-700">
            <Bell class="h-5 w-5" aria-hidden="true" />
          </div>
          <div class="min-w-0">
            <h1 class="text-xl font-bold tracking-tight text-slate-900">系统通知</h1>
            <p class="mt-1 text-xs text-slate-500">账户动态与全站公告</p>
          </div>
        </div>
        <button type="button" aria-label="刷新系统通知" @click="refreshNotifications" :disabled="loading" class="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
          <span class="hidden sm:inline">刷新</span>
        </button>
      </header>

      <div class="min-h-0 flex-1 overflow-y-auto bg-slate-50/70 p-3 sm:p-5">
        <div v-if="loading" class="flex h-full items-center justify-center">
          <div class="text-center">
            <LoaderCircle class="mx-auto h-9 w-9 animate-spin text-blue-700" />
            <p class="mt-3 text-sm text-slate-500">正在加载通知…</p>
          </div>
        </div>

        <div v-else-if="notifications.length" class="mx-auto max-w-4xl space-y-3">
          <article v-for="notification in notifications" :key="notification.id" class="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md sm:p-5">
            <div class="flex min-w-0 items-start gap-3">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Bell class="h-5 w-5" aria-hidden="true" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <h2 class="break-words font-semibold text-slate-900 [overflow-wrap:anywhere]">{{ notification.title }}</h2>
                  <Time class="shrink-0" :time="notification.datetime" />
                </div>
                <div v-if="notification.source === 'announcement'" class="system-notification-content mt-2 break-words text-sm leading-6 text-slate-600 [overflow-wrap:anywhere]" v-html="sanitizeAnnouncementHtml(notification.content)" />
                <p v-else class="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600 [overflow-wrap:anywhere]">{{ notification.content }}</p>
                <div v-if="notification.target_url" class="mt-4 flex justify-end">
                  <RouterLink :to="notification.target_url" class="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-900">
                    查看公告<ChevronRight class="h-4 w-4" />
                  </RouterLink>
                </div>
              </div>
            </div>
          </article>
        </div>

        <div v-else class="flex h-full flex-col items-center justify-center px-6 text-center">
          <div class="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <Bell class="h-9 w-9 text-slate-300" aria-hidden="true" />
          </div>
          <p class="mt-5 text-lg font-semibold text-slate-700">暂无系统通知</p>
        </div>
      </div>

      <footer v-if="totalCount > 0" class="flex justify-center border-t border-slate-200 bg-white px-4 py-3">
        <n-pagination
          :page="displayedPage"
          :page-count="maxPage"
          @update:page="handlePageChange"
          :size="isMobile ? 'small' : 'medium'"
          class="rounded-lg"
        />
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { api } from '@/lib/requests'
import { sanitizeAnnouncementHtml } from '@/lib/guestbook'
import { useUser } from '@/lib/useUser'
import type { APISystemNotificationList } from '@/types/api/messages/messages'
import Time from '@/components/tinyComponents/Time.vue'
import { Bell, ChevronRight, LoaderCircle, RefreshCw } from 'lucide-vue-next'

const message = useMessage()
const { fetchUnreadCount } = useUser(false)
const route = useRoute()
const router = useRouter()
const currentPage = computed(() => {
  const page = Number(route.query.page)
  return Number.isSafeInteger(page) && page > 0 ? page : 1
})
const loading = ref(true)
const notifications = ref<APISystemNotificationList['response']['results']>([])
const displayedPage = ref(currentPage.value)
const totalCount = ref(0)
const maxPage = ref(0)
const isMobile = ref(false)
let requestVersion = 0

const markNotificationsRead = async (ids: number[], version: number) => {
  try {
    const response = await api.post({
      url: '/api/message/notifications/read/',
      query: { ids },
    })
    if (version !== requestVersion) return
    if (response.status < 200 || response.status >= 300) throw new Error('Failed to mark system notifications read')
  } catch {
    if (version === requestVersion) message.error('标记系统通知已读失败，请刷新重试')
    return
  }
  try {
    await fetchUnreadCount()
  } catch (error) {
    console.error('Error refreshing unread notifications:', error)
  }
}

const fetchSystemNotifications = async (page: number) => {
  const version = ++requestVersion
  loading.value = true
  try {
    const response = await api.get({ url: '/api/message/system/', query: { page } })
    if (version !== requestVersion) return
    if (response.status !== 200) throw new Error('Failed to fetch system notifications')
    notifications.value = response.content.results
    displayedPage.value = response.content.page
    totalCount.value = response.content.count
    maxPage.value = response.content.max_page
    loading.value = false
    await nextTick()
    if (version !== requestVersion || !notifications.value.length) return
    await markNotificationsRead(notifications.value.map(item => item.id), version)
  } catch {
    if (version === requestVersion) message.error('获取系统通知失败')
  } finally {
    if (version === requestVersion) loading.value = false
  }
}

const refreshNotifications = () => {
  void fetchSystemNotifications(currentPage.value)
}

const handlePageChange = (page: number) => {
  if (page === currentPage.value) void fetchSystemNotifications(page)
  else void router.push({ query: { ...route.query, page: String(page) } })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleResize = () => {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  requestVersion += 1
  window.removeEventListener('resize', handleResize)
})

watch(currentPage, page => { void fetchSystemNotifications(page) }, { immediate: true })
</script>

<style scoped>
.system-notification-content :deep(p) { margin: 0 0 0.5rem; }
.system-notification-content :deep(p:last-child) { margin-bottom: 0; }
.system-notification-content :deep(a) { color: #1d4ed8; text-decoration: underline; text-underline-offset: 0.2em; }
.system-notification-content :deep(img) { display: block; height: auto; margin: 0.75rem auto; max-width: 100%; border-radius: 0.5rem; }
.system-notification-content :deep(img[data-size="25"]) { width: 25%; }
.system-notification-content :deep(img[data-size="50"]) { width: 50%; }
.system-notification-content :deep(img[data-size="75"]) { width: 75%; }
.system-notification-content :deep(img[data-size="100"]) { width: 100%; }
</style>
