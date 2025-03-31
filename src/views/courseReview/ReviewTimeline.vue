<template>
  <div :class="['min-h-screen px-4 sm:px-6 lg:px-8', { 'py-12': showHeader }]">
    <div class="max-w-6xl mx-auto">
      <h1 v-if="showHeader" class="text-3xl font-bold text-gray-900 mb-8">时间线 ({{ totalReviewCount }})</h1>
      <div class="space-y-6">
        <template v-if="loading">
          <review-item-skeleton v-for="index in pageSize" :key="index" />
        </template>
        <template v-else>
          <review-item
            v-for="review in reviews"
            :review="review"
            :key="review.id"
          />
        </template>
      </div>
      <div
        v-if="totalReviewCount > 0 && showHeader"
        class="flex items-center justify-center mt-8"
      >
        <n-pagination
          v-model:page="currentPage"
          :item-count="totalReviewCount"
          :page-slot="5"
          :page-size="pageSize"
          @update:page="onPageUpdate"
          show-quick-jumper
        >
        </n-pagination>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { api } from '@/lib/requests'
import ReviewItem from '@/components/courseReview/timeline/ReviewItem.vue'
import ReviewItemSkeleton from '@/components/courseReview/timeline/ReviewItemSkeleton.vue'
import { APILatestReviews } from '@/types/api/courseReview/review'

const props = defineProps({
  showHeader: {
    type: Boolean,
    default: true,
  },
  pageSize: {
    type: Number,
    default: 5,
  },
})

const message = useMessage()
const router = useRouter()
const route = useRoute()

const reviews = ref<APILatestReviews['response']['results']>([])
const totalReviewCount = ref(0)
const loading = ref(true)
const currentPage = ref(parseInt(route.query.page as string) || 1)

const fetchReviews = async (page: number, desc: number = 1) => {
  const searchParams = {
    page: page,
    pageSize: props.pageSize,
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
  await router.replace({ query: { ...route.query, page: page.toString() } })
  await fetchReviews(page)
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
