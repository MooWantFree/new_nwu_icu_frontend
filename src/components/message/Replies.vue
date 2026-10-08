<template>
  <div class="h-full min-h-0 min-w-0 overflow-hidden bg-zinc-50">
    <section class="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <header class="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-zinc-200 px-5 sm:px-6">
        <div class="flex min-w-0 items-center gap-3">
          <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-600">
            <MessageSquare class="h-5 w-5" aria-hidden="true" />
          </div>
          <div class="min-w-0">
            <h1 class="text-lg font-semibold tracking-tight text-zinc-900">回复我的</h1>
            <p class="mt-1 text-xs text-zinc-500">与你发布内容相关的新讨论</p>
          </div>
        </div>
        <button type="button" aria-label="刷新回复" @click="refreshReplies" :disabled="loading" class="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
          <span class="hidden sm:inline">刷新</span>
        </button>
      </header>

      <div class="min-h-0 flex-1 overflow-y-auto bg-white p-3 sm:p-5">
        <div v-if="loading" class="flex h-full items-center justify-center">
          <div class="text-center">
            <LoaderCircle class="mx-auto h-5 w-5 animate-spin text-zinc-600" />
            <p class="mt-3 text-sm text-zinc-500">正在加载回复…</p>
          </div>
        </div>

        <div v-if="!loading && loadError" role="alert" class="mx-auto mb-4 flex max-w-4xl items-center gap-3 rounded-lg border border-red-200 bg-red-50/50 p-4 text-sm text-red-700">
          <AlertCircle class="h-4 w-4 shrink-0" aria-hidden="true" />
          <p class="min-w-0 flex-1">{{ loadError }}</p>
          <button type="button" class="shrink-0 rounded-md px-2 py-1 font-medium underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400" @click="refreshReplies">重试</button>
        </div>

        <div v-if="!loading && replies.length" class="mx-auto max-w-4xl space-y-3">
          <article v-for="reply in replies" :key="reply.id" class="overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 sm:p-5">
            <div class="flex min-w-0 items-center gap-3">
              <UserAvatar :avatar="reply.created_by.avatar" :uuid="reply.created_by.uuid" :has-avatar="reply.created_by.has_avatar" :alt="reply.created_by.nickname" class="h-10 w-10 shrink-0 rounded-full ring-1 ring-zinc-200" />
              <div class="min-w-0 flex-1">
                <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p class="min-w-0 truncate text-sm text-zinc-500">
                    <RouterLink :to="`/user/${reply.created_by.id}`" class="font-semibold text-zinc-900 hover:text-zinc-950 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2">{{ reply.created_by.nickname }}</RouterLink>
                    回复了你
                  </p>
                  <Time class="shrink-0" :time="new Date(reply.datetime)" />
                </div>
                <p class="mt-1 truncate text-xs text-zinc-400">{{ reply.source === 'guestbook' ? '留言板' : reply.source === 'announcement' ? '公告栏' : reply.course.name }}</p>
              </div>
            </div>

            <div class="mt-4 rounded-xl bg-zinc-50 px-4 py-3 text-sm leading-6 text-zinc-600">
              <template v-if="reply.source === 'guestbook' || reply.source === 'announcement'">
                <p class="mb-2 text-xs font-medium text-zinc-400">回复你的{{ reply.source === 'announcement' ? '公告' : '留言' }}</p>
                <div class="whitespace-pre-wrap break-words [overflow-wrap:anywhere]" v-html="sanitizeGuestbookHtml(reply.reply.content)" />
              </template>
              <template v-else>
                <p class="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{{ reply.reply.content }}</p>
                <blockquote v-if="reply.raw_post.classify === 'reply'" class="mt-3 border-l-2 border-zinc-300 pl-3 text-xs text-zinc-400">
                  {{ reply.raw_post.content }}
                </blockquote>
              </template>
            </div>

            <div class="mt-4 flex justify-end">
              <RouterLink v-if="reply.source === 'guestbook' || reply.source === 'announcement'" :to="`/${reply.source === 'announcement' ? 'announcements' : 'guestbook'}/${reply.guestbook.root_id}?focus=${reply.guestbook.entry_id}`" class="inline-flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-950 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2">
                查看讨论<ChevronRight class="h-4 w-4" />
              </RouterLink>
              <RouterLink v-else :to="reply.raw_post.classify === 'review' ? `/review/course/${reply.course.id}#review-${reply.raw_post.id}` : `/review/course/${reply.course.id}#reply-${reply.raw_post.id}`" class="inline-flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-950 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2">
                查看讨论<ChevronRight class="h-4 w-4" />
              </RouterLink>
            </div>
          </article>
        </div>

        <div v-else-if="!loading && !loadError" class="flex h-full flex-col items-center justify-center px-6 text-center">
          <div class="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <MessageSquare class="h-6 w-6 text-zinc-400" />
          </div>
          <p class="mt-4 text-sm font-medium text-zinc-950">暂无收到的回复</p>
          <p class="mt-2 text-sm text-zinc-500">参与讨论后，新的回复会出现在这里</p>
        </div>
      </div>

      <footer v-if="totalCount > 0" class="flex shrink-0 justify-center border-t border-zinc-200 bg-white px-4 py-3">
        <ReviewPagination :page="currentPage" :page-count="maxPage" @update:page="handlePageChange" />
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useShadcnToast } from '@/lib/useShadcnToast'
import { api } from '@/lib/requests'
import { sanitizeGuestbookHtml } from '@/lib/guestbook'
import type { APINotificationList } from '@/types/api/messages/messages'
import Time from '@/components/tinyComponents/Time.vue'
import ReviewPagination from '@/components/courseReview/ReviewPagination.vue'
import { AlertCircle, ChevronRight, LoaderCircle, RefreshCw, MessageSquare } from 'lucide-vue-next'
import UserAvatar from '@/components/common/UserAvatar.vue'

const message = useShadcnToast()
const loading = ref(true)
const loadError = ref('')
const replies = ref<APINotificationList['response']['results']>([])
const route = useRoute()
const router = useRouter()
const currentPage = computed(() => {
  const page = Number(route.query.page)
  return Number.isSafeInteger(page) && page > 0 ? page : 1
})
const totalCount = ref(0)
const maxPage = ref(0)

let requestVersion = 0

onUnmounted(() => {
  requestVersion += 1
})

const fetchReplies = async (page: number) => {
  const version = ++requestVersion
  replies.value = []
  loadError.value = ''
  try {
    loading.value = true
    const response = await api.get({
      url: '/api/message/reply/',
      query: { page },
    })
    if (version !== requestVersion) return
    if (response.status !== 200) throw new Error('Failed to fetch replies')
    replies.value = response.content.results
    totalCount.value = response.content.count
    maxPage.value = response.content.max_page
    if (replies.value.length) {
      try {
        await api.post({
          url: '/api/message/notifications/read/',
          query: { ids: replies.value.map(item => item.id) },
        })
      } catch (error) {
        console.error('Error marking reply notifications read:', error)
      }
    }
  } catch {
    if (version === requestVersion) {
      loadError.value = '获取回复列表失败，请稍后重试'
      message.error('获取回复列表失败')
    }
  } finally {
    if (version === requestVersion) loading.value = false
  }
}

const refreshReplies = () => {
  fetchReplies(currentPage.value)
}

const handlePageChange = (page: number) => {
  void router.push({ query: { ...route.query, page: String(page) } })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

watch(currentPage, page => { void fetchReplies(page) }, { immediate: true })
</script>


