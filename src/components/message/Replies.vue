<template>
  <div class="h-full min-w-0 overflow-hidden bg-slate-50 p-3 sm:p-4">
    <section class="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header class="flex min-h-20 items-center justify-between gap-4 border-b border-slate-200 px-5 sm:px-6">
        <div class="flex min-w-0 items-center gap-3">
          <div class="rounded-xl bg-blue-50 p-2.5 text-blue-700">
            <MessageSquare class="h-5 w-5" aria-hidden="true" />
          </div>
          <div class="min-w-0">
            <h1 class="text-xl font-bold tracking-tight text-slate-900">回复我的</h1>
            <p class="mt-1 text-xs text-slate-500">与你发布内容相关的新讨论</p>
          </div>
        </div>
        <button type="button" aria-label="刷新回复" @click="refreshReplies" :disabled="loading" class="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
          <span class="hidden sm:inline">刷新</span>
        </button>
      </header>

      <div class="min-h-0 flex-1 overflow-y-auto bg-slate-50/70 p-3 sm:p-5">
        <div v-if="loading" class="flex h-full items-center justify-center">
          <div class="text-center">
            <LoaderCircle class="mx-auto h-9 w-9 animate-spin text-blue-700" />
            <p class="mt-3 text-sm text-slate-500">正在加载回复…</p>
          </div>
        </div>

        <div v-else-if="replies && replies.length" class="mx-auto max-w-4xl space-y-3">
          <article v-for="reply in replies" :key="reply.id" class="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md sm:p-5">
            <div class="flex min-w-0 items-center gap-3">
              <UserAvatar :avatar="reply.created_by.avatar" :uuid="reply.created_by.uuid" :has-avatar="reply.created_by.has_avatar" :alt="reply.created_by.nickname" class="h-10 w-10 shrink-0 rounded-full ring-1 ring-slate-200" />
              <div class="min-w-0 flex-1">
                <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p class="min-w-0 truncate text-sm text-slate-500">
                    <RouterLink :to="`/user/${reply.created_by.id}`" class="font-semibold text-slate-900 hover:text-blue-700">{{ reply.created_by.nickname }}</RouterLink>
                    回复了你
                  </p>
                  <Time class="shrink-0" :time="new Date(reply.datetime)" />
                </div>
                <p class="mt-1 truncate text-xs text-slate-400">{{ reply.source === 'guestbook' ? '留言板' : reply.source === 'announcement' ? '公告栏' : reply.course.name }}</p>
              </div>
            </div>

            <div class="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
              <template v-if="reply.source === 'guestbook' || reply.source === 'announcement'">
                <p class="mb-2 text-xs font-medium text-slate-400">回复你的{{ reply.source === 'announcement' ? '公告' : '留言' }}</p>
                <div class="whitespace-pre-wrap break-words [overflow-wrap:anywhere]" v-html="sanitizeGuestbookHtml(reply.reply.content)" />
              </template>
              <template v-else>
                <p class="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{{ reply.reply.content }}</p>
                <blockquote v-if="reply.raw_post.classify === 'reply'" class="mt-3 border-l-2 border-slate-300 pl-3 text-xs text-slate-400">
                  {{ reply.raw_post.content }}
                </blockquote>
              </template>
            </div>

            <div class="mt-4 flex justify-end">
              <RouterLink v-if="reply.source === 'guestbook' || reply.source === 'announcement'" :to="`/${reply.source === 'announcement' ? 'announcements' : 'guestbook'}/${reply.guestbook.root_id}?focus=${reply.guestbook.entry_id}`" class="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-900">
                查看讨论<ChevronRight class="h-4 w-4" />
              </RouterLink>
              <RouterLink v-else :to="reply.raw_post.classify === 'review' ? `/review/course/${reply.course.id}#review-${reply.raw_post.id}` : `/review/course/${reply.course.id}#reply-${reply.raw_post.id}`" class="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-900">
                查看讨论<ChevronRight class="h-4 w-4" />
              </RouterLink>
            </div>
          </article>
        </div>

        <div v-else class="flex h-full flex-col items-center justify-center px-6 text-center">
          <div class="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <MessageSquare class="h-9 w-9 text-slate-300" />
          </div>
          <p class="mt-5 text-lg font-semibold text-slate-700">暂无收到的回复</p>
          <p class="mt-2 text-sm text-slate-400">参与讨论后，新的回复会出现在这里</p>
        </div>
      </div>

      <footer v-if="totalCount > 0" class="flex justify-center border-t border-slate-200 bg-white px-4 py-3">
      <n-pagination
        v-model:page="currentPage"
        :page-count="maxPage"
        :on-update:page="handlePageChange"
        :size="isMobile ? 'small' : 'medium'"
        class="rounded-lg"
      />
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useMessage } from 'naive-ui'
import { api } from '@/lib/requests'
import { sanitizeGuestbookHtml } from '@/lib/guestbook'
import type { APINotificationList } from '@/types/api/messages/messages'
import Time from '@/components/tinyComponents/Time.vue'
import { ChevronRight, LoaderCircle, RefreshCw, MessageSquare } from 'lucide-vue-next'
import UserAvatar from '@/components/common/UserAvatar.vue'

const message = useMessage()
const loading = ref(true)
const replies = ref<APINotificationList['response']['results']>([])
const currentPage = ref(1)
const totalCount = ref(0)
const maxPage = ref(0)

const isMobile = ref(false)

// Close menu when clicking outside
const handleResize = () => {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  fetchReplies(currentPage.value)
  handleResize()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

const fetchReplies = async (page: number) => {
  try {
    loading.value = true
    const response = await api.get({
      url: '/api/message/reply/',
      query: { page },
    })
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
  } catch (error) {
    message.error('获取回复列表失败')
  } finally {
    loading.value = false
  }
}

const refreshReplies = () => {
  fetchReplies(currentPage.value)
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchReplies(page)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>


