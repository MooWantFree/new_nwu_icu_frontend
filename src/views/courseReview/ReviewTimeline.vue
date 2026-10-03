<template>
  <main class="timeline-page min-h-[calc(100vh-7rem)] bg-zinc-50 text-zinc-950">
    <div class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <header v-if="showHeader" class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">时间线</h1>
          <span v-if="loading" class="h-5 w-20 rounded-md bg-zinc-200 motion-safe:animate-pulse" aria-hidden="true" />
          <span v-else class="text-sm text-zinc-500">
            {{ totalReviewCount }} 条评价
          </span>
        </div>

        <ReviewDirectoryNav active="timeline" />
      </header>

      <section aria-labelledby="timeline-reviews-title" class="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[0_1px_2px_rgb(0_0_0_/_0.025)]">
        <header class="flex items-center gap-2.5 border-b border-zinc-100 px-5 py-4 sm:px-6">
          <MessageSquareText class="h-4 w-4 text-zinc-500" aria-hidden="true" />
          <h2 id="timeline-reviews-title" class="text-sm font-semibold">最新评价</h2>
        </header>

        <div v-if="loading" class="divide-y divide-zinc-200" aria-label="正在加载课程评价" role="status">
          <span class="sr-only">正在加载课程评价</span>
          <review-item-skeleton v-for="index in pageSize" :key="index" />
        </div>
        <div v-else-if="reviews.length" class="divide-y divide-zinc-200">
          <review-item v-for="review in reviews" :key="review.id" :review="review" />
        </div>
        <div v-else class="px-5 py-16 text-center text-sm text-zinc-500 sm:px-6">
          暂时还没有课程评价。
        </div>

        <div v-if="totalReviewCount > 0 && showHeader" class="border-t border-zinc-200 px-4 py-5 sm:px-6">
          <ReviewPagination
            :page="currentPage"
            :page-count="Math.ceil(totalReviewCount / pageSize)"
            @update:page="onPageUpdate"
          />
        </div>
      </section>
    </div>
  </main>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { MessageSquareText } from 'lucide-vue-next'
import { api } from '@/lib/requests'
import ReviewItem from '@/components/courseReview/timeline/ReviewItem.vue'
import ReviewItemSkeleton from '@/components/courseReview/timeline/ReviewItemSkeleton.vue'
import ReviewDirectoryNav from '@/components/courseReview/ReviewDirectoryNav.vue'
import ReviewPagination from '@/components/courseReview/ReviewPagination.vue'
import { APILatestReviews } from '@/types/api/courseReview/review'

const props = defineProps({
  showHeader: {
    type: Boolean,
    default: true,
  },
  pageSize: {
    type: Number,
    default: 8,
  },
})

const message = useMessage()
const router = useRouter()
const route = useRoute()

const reviews = ref<APILatestReviews['response']['results']>([])
const totalReviewCount = ref(0)
const loading = ref(true)
const currentPage = computed(() => {
  const page = Number(route.query.page)
  return Number.isSafeInteger(page) && page > 0 ? page : 1
})
const pageSizeOptions = [8, 20, 50]
const pageSize = computed(() => {
  const size = Number(route.query.pageSize)
  return pageSizeOptions.includes(size) ? size : props.pageSize
})

const fetchReviews = async (isCurrent: () => boolean) => {
  loading.value = true
  reviews.value = []
  totalReviewCount.value = 0
  const searchParams = {
    page: currentPage.value,
    pageSize: pageSize.value,
    desc: 1,
  }
  try {
    const { status, content, errors } = await api.get({
      url: '/api/assessment/latest-review/',
      query: searchParams,
    })
    if (!isCurrent()) return

    if (status !== 200) {
      throw new Error(errors ? errors.map(err => err.err_msg).join(', ') : '获取点评失败，请重试')
    }

    reviews.value = content.results
    totalReviewCount.value = content.count
  } catch (error) {
    if (!isCurrent()) return
    console.error('Error fetching reviews:', error)
    message.error(error instanceof Error ? error.message : '获取点评失败，请重试')
  } finally {
    if (isCurrent()) loading.value = false
  }
}

const onPageUpdate = async (page: number) => {
  await router.push({
    query: {
      ...route.query,
      page: page.toString(),
      pageSize: pageSize.value.toString(),
    },
  })
}


watch([currentPage, pageSize], (_state, _oldState, onCleanup) => {
  let current = true
  onCleanup(() => { current = false })
  void fetchReviews(() => current)
}, { immediate: true })
</script>

<style scoped>
.timeline-page a:focus-visible {
  outline: 2px solid #a1a1aa;
  outline-offset: 3px;
}

</style>
