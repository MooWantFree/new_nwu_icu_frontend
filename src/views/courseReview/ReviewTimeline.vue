<template>
  <AppPageLayout
    title="时间线"
    description="分享课程体验，也欢迎客观、友善地交流。"
    :show-header="showHeader"
  >
    <template #meta>
      <span>({{ totalReviewCount }})</span>
    </template>

    <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div v-if="loading" class="divide-y divide-slate-200" aria-label="正在加载课程评价">
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
        v-model:page="currentPage"
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
import { onMounted, ref, watch } from 'vue'
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
const currentPage = ref(parseInt(route.query.page as string) || 1)
const pageSizeOptions = [8, 20, 50]
const requestedPageSize = parseInt(route.query.pageSize as string)
const pageSize = ref(
  pageSizeOptions.includes(requestedPageSize) ? requestedPageSize : props.pageSize,
)

const fetchReviews = async (page: number, desc: number = 1) => {
  const searchParams = {
    page: page,
    pageSize: pageSize.value,
    desc: desc,
  }
  try {
    const { status, content, errors } = await api.get({
      url: '/api/assessment/latest-review/',
      query: searchParams,
    })

    if (status !== 200) {
      throw new Error(errors ? errors.map(err => err.err_msg).join(', ') : '获取点评失败，请重试')
    }

    reviews.value = content.results
    totalReviewCount.value = content.count
  } catch (error) {
    console.error('Error fetching reviews:', error)
    message.error(error instanceof Error ? error.message : '获取点评失败，请重试')
  }
}

const onPageUpdate = async (page: number) => {
  loading.value = true
  await router.push({
    query: {
      ...route.query,
      page: page.toString(),
      pageSize: pageSize.value.toString(),
    },
  })
  await fetchReviews(page)
  loading.value = false
}

const onPageSizeUpdate = async (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  loading.value = true
  await router.push({
    query: {
      ...route.query,
      page: '1',
      pageSize: size.toString(),
    },
  })
  await fetchReviews(1)
  loading.value = false
}

watch(() => route.query.page, (newPage) => {
  currentPage.value = parseInt(newPage as string) || 1
})

onMounted(async () => {
  loading.value = true
  await fetchReviews(currentPage.value)
  loading.value = false
})
</script>
