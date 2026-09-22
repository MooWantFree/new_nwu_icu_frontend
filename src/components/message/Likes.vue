<template>
  <div class="h-full min-w-0 overflow-hidden bg-slate-50 p-3 sm:p-4">
    <section class="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header class="flex min-h-20 items-center justify-between gap-4 border-b border-slate-200 px-5 sm:px-6">
        <div class="flex min-w-0 items-center gap-3">
          <div class="rounded-xl bg-blue-50 p-2.5 text-blue-700">
            <ThumbsUp class="h-5 w-5" aria-hidden="true" />
          </div>
          <div class="min-w-0">
            <h1 class="text-xl font-bold tracking-tight text-slate-900">收到的赞</h1>
            <p class="mt-1 text-xs text-slate-500">大家对你发布内容的认可</p>
          </div>
        </div>
        <button type="button" aria-label="刷新收到的赞" @click="refreshLikes" :disabled="loading" class="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
          <span class="hidden sm:inline">刷新</span>
        </button>
      </header>

      <div class="min-h-0 flex-1 overflow-y-auto bg-slate-50/70 p-3 sm:p-5">
        <div v-if="loading" class="flex h-full items-center justify-center">
          <div class="text-center">
            <LoaderCircle class="mx-auto h-9 w-9 animate-spin text-blue-700" />
            <p class="mt-3 text-sm text-slate-500">正在加载点赞…</p>
          </div>
        </div>

        <div v-else-if="likes.length" class="mx-auto max-w-4xl space-y-3">
          <article v-for="notice in likes" :key="notice.id" class="group overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md sm:p-5">
            <div class="flex min-w-0 items-start gap-3">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <ThumbsUp class="h-5 w-5" aria-hidden="true" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <RouterLink v-if="notice.source === 'guestbook' || notice.source === 'announcement'" :to="`/${notice.source === 'announcement' ? 'announcements' : 'guestbook'}/${notice.guestbook.root_id}?focus=${notice.guestbook.entry_id}`" class="truncate font-semibold text-slate-900 transition-colors group-hover:text-blue-700">
                    你的{{ notice.source === 'announcement' ? '公告' : '留言' }}收到了赞
                  </RouterLink>
                  <RouterLink v-else :to="`/review/course/${notice.raw_info.course.id}`" class="truncate font-semibold text-slate-900 transition-colors group-hover:text-blue-700">
                    {{ notice.raw_info.course.name }}
                  </RouterLink>
                  <Time class="shrink-0" :time="new Date(notice.datetime)" />
                </div>
                <p class="mt-1 text-sm text-slate-500">{{ notice.source === 'guestbook' ? '留言板' : notice.source === 'announcement' ? '公告栏' : '课程评价' }}</p>
              </div>
            </div>

            <p class="mt-4 line-clamp-3 whitespace-pre-wrap break-words rounded-xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600 [overflow-wrap:anywhere]">
              {{ notice.source === 'guestbook' || notice.source === 'announcement' ? `你的${notice.source === 'announcement' ? '公告' : '留言'}收到了新的赞。` : extractText(notice.raw_info.raw_post.content) }}
            </p>

            <div class="mt-4 flex items-center gap-2 text-sm">
              <span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
                <ThumbsUp class="h-3.5 w-3.5" />{{ notice.like.like }}
              </span>
              <span v-if="notice.source !== 'guestbook' && notice.source !== 'announcement'" class="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 font-medium text-rose-600">
                <ThumbsDown class="h-3.5 w-3.5" />{{ notice.like.dislike }}
              </span>
              <RouterLink v-if="notice.source === 'guestbook' || notice.source === 'announcement'" :to="`/${notice.source === 'announcement' ? 'announcements' : 'guestbook'}/${notice.guestbook.root_id}?focus=${notice.guestbook.entry_id}`" class="ml-auto inline-flex items-center gap-1 font-medium text-blue-700 hover:text-blue-900">
                查看详情<ChevronRight class="h-4 w-4" />
              </RouterLink>
              <RouterLink v-else :to="`/review/course/${notice.raw_info.course.id}`" class="ml-auto inline-flex items-center gap-1 font-medium text-blue-700 hover:text-blue-900">
                查看详情<ChevronRight class="h-4 w-4" />
              </RouterLink>
            </div>
          </article>
        </div>

        <div v-else class="flex h-full flex-col items-center justify-center px-6 text-center">
          <div class="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <ThumbsUp class="h-9 w-9 text-slate-300" />
          </div>
          <p class="mt-5 text-lg font-semibold text-slate-700">暂无收到的赞</p>
          <p class="mt-2 text-sm text-slate-400">发布高质量内容，新的认可会出现在这里</p>
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
import type { APILikeList } from '@/types/api/messages/like'
import Time from '@/components/tinyComponents/Time.vue'
import { ChevronRight, LoaderCircle, RefreshCw, ThumbsUp, ThumbsDown } from 'lucide-vue-next'

const message = useMessage()
const loading = ref(true)
const likes = ref<APILikeList['response']['results']>([])
const currentPage = ref(1)
const totalCount = ref(0)
const maxPage = ref(0)

const isMobile = ref(false)

const fetchLikes = async (page: number) => {
  try {
    loading.value = true
    const response = await api.get({
      url: '/api/message/like/',
      query: { page },
    })
    likes.value = response.content.results
    totalCount.value = response.content.count
    maxPage.value = response.content.max_page
    if (likes.value.length) {
      try {
        await api.post({
          url: '/api/message/notifications/read/',
          query: { ids: likes.value.map(item => item.id) },
        })
      } catch (error) {
        console.error('Error marking like notifications read:', error)
      }
    }
  } catch (error) {
    message.error('获取赞列表失败')
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchLikes(page)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const refreshLikes = () => {
  fetchLikes(currentPage.value)
}

const handleResize = () => {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  fetchLikes(currentPage.value)
  handleResize()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

function extractText(html: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}
</script>
