<template>
  <AppPageLayout
    title="时间线"
    description="分享课程体验，也欢迎客观、友善地交流。"
    :show-header="showHeader"
  >
    <template #meta>
      <span v-if="loading" class="block h-4 w-8 rounded-md bg-slate-200 motion-safe:animate-pulse" aria-hidden="true" />
      <span v-else>({{ totalReviewCount }})</span>
    </template>

    <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div v-if="loading" class="divide-y divide-slate-200" aria-label="正在加载课程评价" role="status">
        <span class="sr-only">正在加载课程评价</span>
        <review-item-skeleton v-for="index in pageSize" :key="index" />
      </div>
      <div v-else-if="reviews.length" class="divide-y divide-slate-200">
        <review-item
          v-for="review in reviews"
          :key="review.id"
          :review="review"
        />
      </div>
      <div v-else class="px-5 py-16 text-center text-sm text-slate-500 sm:px-7">
        暂时还没有课程评价。
      </div>
    </div>
    <div
      v-if="totalReviewCount > 0 && showHeader"
      class="mt-8 flex items-center justify-center"
    >
      <n-pagination
        :page="currentPage"
        :item-count="totalReviewCount"
        :page-slot="5"
        :page-size="pageSize"
        :page-sizes="pageSizeOptions"
        :show-size-picker="true"
        @update:page="onPageUpdate"
        @update:page-size="onPageSizeUpdate"
        show-quick-jumper
      >
      </n-pagination>
    </div>
  </AppPageLayout>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { api } from '@/lib/requests'
import ReviewItem from '@/components/courseReview/timeline/ReviewItem.vue'
import ReviewItemSkeleton from '@/components/courseReview/timeline/ReviewItemSkeleton.vue'
import AppPageLayout from '@/components/layout/AppPageLayout.vue'
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

const onPageSizeUpdate = async (size: number) => {
  await router.push({
    query: {
      ...route.query,
      page: '1',
      pageSize: size.toString(),
    },
  })
}

watch([currentPage, pageSize], (_state, _oldState, onCleanup) => {
  let current = true
  onCleanup(() => { current = false })
  void fetchReviews(() => current)
}, { immediate: true })
</script>
