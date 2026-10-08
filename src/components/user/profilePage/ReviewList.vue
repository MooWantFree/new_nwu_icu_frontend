<template>
  <div class="min-w-0">
    <div v-if="data && data.results.length > 0" class="space-y-4">
      <article
        v-for="review in data.results"
        :key="review.id"
        class="min-w-0 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5"
      >
        <header class="mb-3 flex min-w-0 flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <router-link
            :to="`/review/course/${review.course.id}`"
            class="min-w-0 rounded-sm break-words text-base font-semibold leading-6 text-zinc-950 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
          >
            {{ review.course.name }}
          </router-link>
          <Time :time="review.datetime" class="shrink-0 whitespace-nowrap" />
        </header>
        <div class="mb-3 flex flex-wrap items-center gap-2">
          <span class="text-xs text-zinc-500">评分:</span>
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold tabular-nums text-zinc-950">
              {{ review.rating.rating.toFixed(1) }}
            </span>
            <ShadcnRating
              color="yellow"
              label="总体评分"
              :value="review.rating.rating"
              :size="16"
              readonly
              allow-half
            />
          </div>
        </div>
        <div class="mb-4 min-w-0 text-sm leading-7 text-zinc-600 [overflow-wrap:anywhere]">
          <ReviewPlainText :content="review.content.current_content" />
        </div>
        <div class="grid grid-cols-1 gap-x-4 gap-y-3 rounded-lg border border-zinc-100 bg-zinc-50/70 p-3 text-xs text-zinc-600 sm:grid-cols-2">
          <span class="flex items-center">
            <span class="font-medium mr-1">难度:</span>
            <ReviewMetricScale :model-value="review.rating.difficulty" v-bind="reviewMetrics.difficulty" readonly />
          </span>
          <span class="flex items-center">
            <span class="font-medium mr-1">给分:</span>
            <ReviewMetricScale :model-value="review.rating.grade" v-bind="reviewMetrics.grade" readonly />
          </span>
          <span class="flex items-center">
            <span class="font-medium mr-1">作业负担:</span>
            <ReviewMetricScale :model-value="review.rating.homework" v-bind="reviewMetrics.homework" readonly />
          </span>
          <span class="flex items-center">
            <span class="font-medium mr-1">收获:</span>
            <ReviewMetricScale :model-value="review.rating.reward" v-bind="reviewMetrics.reward" readonly />
          </span>
        </div>
        <footer class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-3">
          <div class="flex items-center gap-3 text-xs text-zinc-500">
            <span class="inline-flex items-center gap-1.5">
              <ThumbsUp class="h-3.5 w-3.5" aria-hidden="true" />
              {{ review.like.like }}
            </span>
            <span class="inline-flex items-center gap-1.5">
              <ThumbsDown class="h-3.5 w-3.5" aria-hidden="true" />
              {{ review.like.dislike }}
            </span>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <span v-if="review.is_me && review.anonymous" class="text-xs text-zinc-500">
              (匿名评价)
            </span>
            <button
              type="button"
              class="inline-flex min-h-8 items-center justify-center rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
              @click="
                $router.push(
                  `/review/course/${review.course.id}#review-${review.id}`
                )
              "
            >
              更多
            </button>
          </div>
        </footer>
      </article>
      <div class="space-y-4 pt-2">
        <div class="flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500">
          <span>
            第 {{ (currentPage - 1) * pageSize + 1 }} -
            {{ Math.min(currentPage * pageSize, data.count) }} 条，共
            {{ data.count }} 条
          </span>
          <label class="inline-flex items-center gap-2">
            <span>每页</span>
            <select
              :value="pageSize"
              aria-label="每页条数"
              class="h-8 rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
              @change="handlePageSizeChange(Number(($event.target as HTMLSelectElement).value))"
            >
              <option v-for="size in [10, 20, 30, 40]" :key="size" :value="size">{{ size }} 条</option>
            </select>
          </label>
        </div>
        <ReviewPagination
          :page="currentPage"
          :page-count="data.max_page"
          @update:page="handlePageChange"
        />
      </div>
    </div>
    <div v-else-if="errorDetail" class="rounded-xl border border-zinc-200 bg-white px-4 py-12 text-center" role="alert">
      <p class="text-sm leading-6 text-zinc-500">{{ errorDetail }}</p>
    </div>
    <div v-else-if="data && data.results.length === 0" class="rounded-xl border border-zinc-200 bg-white px-4 py-12 text-center">
      <p class="text-sm text-zinc-500">暂无评价</p>
    </div>
    <div v-else class="flex min-h-32 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white" role="status">
      <LoaderCircle class="h-5 w-5 animate-spin text-zinc-400" aria-hidden="true" />
      <span class="text-sm text-zinc-500">加载中...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
// Import necessary components and types
import { api } from '@/lib/requests'
import { APIUserActivitiesReview } from '@/types/api/user/profilePage'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ReviewMetricScale from '@/components/courseReview/course/courseReviews/ReviewMetricScale.vue'
import { reviewMetrics } from '@/lib/reviewMetrics'
import ShadcnRating from '@/components/common/ShadcnRating.vue'
import { LoaderCircle, ThumbsUp, ThumbsDown } from 'lucide-vue-next'
import ReviewPlainText from '@/components/tinyComponents/ReviewPlainText.vue'
import Time from '@/components/tinyComponents/Time.vue'
import ReviewPagination from '@/components/courseReview/ReviewPagination.vue'

// Define props
const props = defineProps<{
  id?: string
}>()

// Define reactive data
const data = ref<APIUserActivitiesReview['response'] | null>(null)
const errorDetail = ref<string>('')
const route = useRoute()
const router = useRouter()
const currentPage = computed(() => {
  const page = Number(route.query.page)
  return Number.isSafeInteger(page) && page > 0 ? page : 1
})
const pageSize = computed(() => {
  const size = Number(route.query.pageSize)
  return [10, 20, 30, 40].includes(size) ? size : 10
})

// Fetch data function
const fetchData = async (isCurrent: () => boolean) => {
  data.value = null
  errorDetail.value = ''
  if (!props.id) {
    return
  }
  try {
    const response = await api.get({
      url: `/api/assessment/user/activities/review/:id/`,
      params: {
        id: parseInt(props.id),
      },
      query: {
        page: currentPage.value,
        page_size: pageSize.value,
      },
    })
    if (!isCurrent()) return
    if (response.status !== 200) {
      console.error('API request failed:', response.status)
      errorDetail.value = response.errors?.[0]?.err_msg || '获取评价失败，请重试'
      return
    }
    data.value = response.data.contents
  } catch (error) {
    if (!isCurrent()) return
    console.error('Failed to fetch reviews:', error)
    errorDetail.value = '获取评价失败，请重试'
  }
}

// Watch for changes and fetch data
watch([() => props.id, currentPage, pageSize], (_state, _oldState, onCleanup) => {
  let current = true
  onCleanup(() => { current = false })
  void fetchData(() => current)
}, { immediate: true })

// Page change handler
const handlePageChange = (page: number) => {
  void router.push({ query: { ...route.query, page: String(page) } })
}

// Page size change handler
const handlePageSizeChange = (size: number) => {
  void router.push({ query: { ...route.query, page: '1', pageSize: String(size) } })
}
</script>

<style scoped>
:deep(.app-time) { color: #71717a; }
:deep(.app-time:hover) { color: #18181b; }
</style>
