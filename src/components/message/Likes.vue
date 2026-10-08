<template>
  <div class="h-full min-h-0 min-w-0 overflow-hidden bg-zinc-50">
    <section class="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <header class="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-zinc-200 px-5 sm:px-6">
        <div class="flex min-w-0 items-center gap-3">
          <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-600">
            <ThumbsUp class="h-5 w-5" aria-hidden="true" />
          </div>
          <div class="min-w-0">
            <h1 class="text-lg font-semibold tracking-tight text-zinc-900">收到的赞</h1>
            <p class="mt-1 text-xs text-zinc-500">大家对你发布内容的认可</p>
          </div>
        </div>
        <button type="button" aria-label="刷新收到的赞" @click="refreshLikes" :disabled="loading" class="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
          <span class="hidden sm:inline">刷新</span>
        </button>
      </header>

      <div class="min-h-0 flex-1 overflow-y-auto bg-white p-3 sm:p-5">
        <div v-if="loading" class="flex h-full items-center justify-center">
          <div class="text-center">
            <LoaderCircle class="mx-auto h-5 w-5 animate-spin text-zinc-600" />
            <p class="mt-3 text-sm text-zinc-500">正在加载点赞…</p>
          </div>
        </div>

        <div v-if="!loading && loadError" role="alert" class="mx-auto mb-4 flex max-w-4xl items-center gap-3 rounded-lg border border-red-200 bg-red-50/50 p-4 text-sm text-red-700">
          <AlertCircle class="h-4 w-4 shrink-0" aria-hidden="true" />
          <p class="min-w-0 flex-1">{{ loadError }}</p>
          <button type="button" class="shrink-0 rounded-md px-2 py-1 font-medium underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400" @click="refreshLikes">重试</button>
        </div>

        <div v-if="!loading && likes.length" class="mx-auto max-w-4xl space-y-3">
          <article v-for="notice in likes" :key="notice.id" class="group overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 sm:p-5">
            <div class="flex min-w-0 items-start gap-3">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600">
                <ThumbsUp class="h-5 w-5" aria-hidden="true" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <RouterLink v-if="notice.source === 'guestbook' || notice.source === 'announcement'" :to="`/${notice.source === 'announcement' ? 'announcements' : 'guestbook'}/${notice.guestbook.root_id}?focus=${notice.guestbook.entry_id}`" class="truncate font-semibold text-zinc-900 transition-colors group-hover:text-zinc-950 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2">
                    你的{{ notice.source === 'announcement' ? '公告' : '留言' }}收到了赞
                  </RouterLink>
                  <RouterLink v-else :to="`/review/course/${notice.raw_info.course.id}#${notice.raw_info.raw_post.classify === 'reply' ? 'reply' : 'review'}-${notice.raw_info.raw_post.id}`" class="truncate font-semibold text-zinc-900 transition-colors group-hover:text-zinc-950 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2">
                    {{ notice.raw_info.course.name }}
                  </RouterLink>
                  <Time class="shrink-0" :time="new Date(notice.datetime)" />
                </div>
                <p class="mt-1 text-sm text-zinc-500">{{ notice.source === 'guestbook' ? '留言板' : notice.source === 'announcement' ? '公告栏' : '课程评价' }}</p>
              </div>
            </div>

            <p class="mt-4 line-clamp-3 whitespace-pre-wrap break-words rounded-xl bg-zinc-50 px-4 py-3 text-sm leading-6 text-zinc-600 [overflow-wrap:anywhere]">
              {{ notice.source === 'guestbook' || notice.source === 'announcement' ? `你的${notice.source === 'announcement' ? '公告' : '留言'}收到了新的赞。` : extractText(notice.raw_info.raw_post.content) }}
            </p>

            <div class="mt-4 flex items-center gap-2 text-sm">
              <span class="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 font-medium text-zinc-600">
                <ThumbsUp class="h-3.5 w-3.5" />{{ notice.like.like }}
              </span>
              <span v-if="notice.source !== 'guestbook' && notice.source !== 'announcement'" class="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 font-medium text-zinc-600">
                <ThumbsDown class="h-3.5 w-3.5" />{{ notice.like.dislike }}
              </span>
              <RouterLink v-if="notice.source === 'guestbook' || notice.source === 'announcement'" :to="`/${notice.source === 'announcement' ? 'announcements' : 'guestbook'}/${notice.guestbook.root_id}?focus=${notice.guestbook.entry_id}`" class="ml-auto inline-flex items-center gap-1 font-medium text-zinc-600 hover:text-zinc-950 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2">
                查看详情<ChevronRight class="h-4 w-4" />
              </RouterLink>
              <RouterLink v-else :to="`/review/course/${notice.raw_info.course.id}#${notice.raw_info.raw_post.classify === 'reply' ? 'reply' : 'review'}-${notice.raw_info.raw_post.id}`" class="ml-auto inline-flex items-center gap-1 font-medium text-zinc-600 hover:text-zinc-950 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2">
                查看详情<ChevronRight class="h-4 w-4" />
              </RouterLink>
            </div>
          </article>
        </div>

        <div v-else-if="!loading && !loadError" class="flex h-full flex-col items-center justify-center px-6 text-center">
          <div class="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <ThumbsUp class="h-6 w-6 text-zinc-400" />
          </div>
          <p class="mt-4 text-sm font-medium text-zinc-950">暂无收到的赞</p>
          <p class="mt-2 text-sm text-zinc-500">发布高质量内容，新的认可会出现在这里</p>
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
import type { APILikeList } from '@/types/api/messages/like'
import Time from '@/components/tinyComponents/Time.vue'
import ReviewPagination from '@/components/courseReview/ReviewPagination.vue'
import { AlertCircle, ChevronRight, LoaderCircle, RefreshCw, ThumbsUp, ThumbsDown } from 'lucide-vue-next'

const message = useShadcnToast()
const loading = ref(true)
const loadError = ref('')
const likes = ref<APILikeList['response']['results']>([])
const route = useRoute()
const router = useRouter()
const currentPage = computed(() => {
  const page = Number(route.query.page)
  return Number.isSafeInteger(page) && page > 0 ? page : 1
})
const totalCount = ref(0)
const maxPage = ref(0)

let requestVersion = 0

const fetchLikes = async (page: number) => {
  const version = ++requestVersion
  likes.value = []
  loadError.value = ''
  try {
    loading.value = true
    const response = await api.get({
      url: '/api/message/like/',
      query: { page },
    })
    if (version !== requestVersion) return
    if (response.status !== 200) throw new Error('Failed to fetch likes')
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
  } catch {
    if (version === requestVersion) {
      loadError.value = '获取赞列表失败，请稍后重试'
      message.error('获取赞列表失败')
    }
  } finally {
    if (version === requestVersion) loading.value = false
  }
}

const handlePageChange = (page: number) => {
  void router.push({ query: { ...route.query, page: String(page) } })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const refreshLikes = () => {
  fetchLikes(currentPage.value)
}

onUnmounted(() => {
  requestVersion += 1
})

watch(currentPage, page => { void fetchLikes(page) }, { immediate: true })

function extractText(html: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}
</script>
