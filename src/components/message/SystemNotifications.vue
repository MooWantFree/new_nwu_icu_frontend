<template>
  <div class="h-full min-h-0 min-w-0 overflow-hidden bg-zinc-50">
    <section class="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <header class="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-zinc-200 px-5 sm:px-6">
        <div class="flex min-w-0 items-center gap-3">
          <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-600">
            <Bell class="h-5 w-5" aria-hidden="true" />
          </div>
          <div class="min-w-0">
            <h1 class="text-lg font-semibold tracking-tight text-zinc-900">系统通知</h1>
            <p class="mt-1 text-xs text-zinc-500">账户动态与全站公告</p>
          </div>
        </div>
        <button type="button" aria-label="刷新系统通知" @click="refreshNotifications" :disabled="loading" class="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
          <span class="hidden sm:inline">刷新</span>
        </button>
      </header>

      <div class="min-h-0 flex-1 overflow-y-auto bg-white p-3 sm:p-5">
        <div v-if="loading" class="flex h-full items-center justify-center">
          <div class="text-center">
            <LoaderCircle class="mx-auto h-5 w-5 animate-spin text-zinc-600" />
            <p class="mt-3 text-sm text-zinc-500">正在加载通知…</p>
          </div>
        </div>

        <div v-if="!loading && loadError" role="alert" class="mx-auto mb-4 flex max-w-4xl items-center gap-3 rounded-lg border border-red-200 bg-red-50/50 p-4 text-sm text-red-700">
          <AlertCircle class="h-4 w-4 shrink-0" aria-hidden="true" />
          <p class="min-w-0 flex-1">{{ loadError }}</p>
          <button type="button" class="shrink-0 rounded-md px-2 py-1 font-medium underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400" @click="refreshNotifications">重试</button>
        </div>

        <div v-if="!loading && notifications.length" class="mx-auto max-w-4xl space-y-3">
          <article v-for="notification in notifications" :key="notification.id" class="overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 sm:p-5">
            <div class="flex min-w-0 items-start gap-3">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600">
                <Bell class="h-5 w-5" aria-hidden="true" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <h2 class="break-words font-semibold text-zinc-900 [overflow-wrap:anywhere]">{{ notification.title }}</h2>
                  <Time class="shrink-0" :time="notification.datetime" />
                </div>
                <div v-if="notification.source === 'announcement'" class="system-notification-content mt-2 break-words text-sm leading-6 text-zinc-600 [overflow-wrap:anywhere]" v-html="sanitizeAnnouncementHtml(notification.content)" />
                <p v-else class="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-600 [overflow-wrap:anywhere]">{{ notification.content }}</p>
                <div v-if="notification.target_url" class="mt-4 flex justify-end">
                  <RouterLink :to="notification.target_url" class="inline-flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-950 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2">
                    查看公告<ChevronRight class="h-4 w-4" />
                  </RouterLink>
                </div>
              </div>
            </div>
          </article>
        </div>

        <div v-else-if="!loading && !loadError" class="flex h-full flex-col items-center justify-center px-6 text-center">
          <div class="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <Bell class="h-6 w-6 text-zinc-400" aria-hidden="true" />
          </div>
          <p class="mt-4 text-sm font-medium text-zinc-950">暂无系统通知</p>
        </div>
      </div>

      <footer v-if="totalCount > 0" class="flex shrink-0 justify-center border-t border-zinc-200 bg-white px-4 py-3">
        <ReviewPagination :page="displayedPage" :page-count="maxPage" @update:page="handlePageChange" />
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useShadcnToast } from '@/lib/useShadcnToast'
import { api } from '@/lib/requests'
import { sanitizeAnnouncementHtml } from '@/lib/guestbook'
import { useUser } from '@/lib/useUser'
import type { APISystemNotificationList } from '@/types/api/messages/messages'
import Time from '@/components/tinyComponents/Time.vue'
import ReviewPagination from '@/components/courseReview/ReviewPagination.vue'
import { AlertCircle, Bell, ChevronRight, LoaderCircle, RefreshCw } from 'lucide-vue-next'

const message = useShadcnToast()
const { fetchUnreadCount } = useUser(false)
const route = useRoute()
const router = useRouter()
const currentPage = computed(() => {
  const page = Number(route.query.page)
  return Number.isSafeInteger(page) && page > 0 ? page : 1
})
const loading = ref(true)
const loadError = ref('')
const notifications = ref<APISystemNotificationList['response']['results']>([])
const displayedPage = ref(currentPage.value)
const totalCount = ref(0)
const maxPage = ref(0)
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
  loadError.value = ''
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
    if (version === requestVersion) {
      loadError.value = '获取系统通知失败，请稍后重试'
      message.error('获取系统通知失败')
    }
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

onUnmounted(() => {
  requestVersion += 1
})

watch(currentPage, page => { void fetchSystemNotifications(page) }, { immediate: true })
</script>

<style scoped>
.system-notification-content :deep(p) { margin: 0 0 0.5rem; }
.system-notification-content :deep(p:last-child) { margin-bottom: 0; }
.system-notification-content :deep(a) { color: #18181b; text-decoration: underline; text-underline-offset: 0.2em; }
.system-notification-content :deep(img) { display: block; height: auto; margin: 0.75rem auto; max-width: 100%; border-radius: 0.5rem; }
.system-notification-content :deep(img[data-size="25"]) { width: 25%; }
.system-notification-content :deep(img[data-size="50"]) { width: 50%; }
.system-notification-content :deep(img[data-size="75"]) { width: 75%; }
.system-notification-content :deep(img[data-size="100"]) { width: 100%; }
</style>
