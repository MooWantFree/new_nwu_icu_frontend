<template>
  <AppPageLayout
    title="时间线"
    description="给课程添加评价"
    :show-header="showHeader"
  >
    <template #meta>
      <span>({{ totalReviewCount }})</span>
    </template>

    <div class="hidden items-start gap-10 md:grid md:grid-cols-2">
      <div v-for="(column, columnIndex) in desktopColumns" :key="columnIndex" class="space-y-4">
        <template v-if="loading">
          <review-item-skeleton
            v-for="index in desktopSkeletonCounts[columnIndex]"
            :key="`desktop-skeleton-${columnIndex}-${index}`"
            :align="columnIndex === 0 ? 'left' : 'right'"
          />
        </template>
        <template v-else>
          <review-item
            v-for="review in column"
            :key="`desktop-review-${review.id}`"
            :review="review"
            :align="columnIndex === 0 ? 'left' : 'right'"
          />
        </template>
      </div>
    </div>

    <div class="space-y-4 md:hidden">
      <template v-if="loading">
        <review-item-skeleton v-for="index in pageSize" :key="`mobile-skeleton-${index}`" />
      </template>
      <template v-else>
        <review-item
          v-for="review in reviews"
          :key="`mobile-review-${review.id}`"
          :review="review"
        />
      </template>
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
        @update:page="onPageUpdate"
        show-quick-jumper
      >
      </n-pagination>
    </div>
  </AppPageLayout>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
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
    default: 10,
  },
})

const message = useMessage()
const router = useRouter()
const route = useRoute()

const reviews = ref<APILatestReviews['response']['results']>([])
const totalReviewCount = ref(0)
const loading = ref(true)
const currentPage = ref(parseInt(route.query.page as string) || 1)

const desktopColumns = computed(() => [
    reviews.value.filter((_, index) => index % 2 === 0),
    reviews.value.filter((_, index) => index % 2 === 1),
])

const desktopSkeletonCounts = computed(() => [
  Math.ceil(props.pageSize / 2),
  Math.floor(props.pageSize / 2),
])

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

    reviews.value = content.results.map(review => ({
      ...review,
      like: review.like ?? { like: 0, dislike: 0, user_option: 0 },
    }))
    totalReviewCount.value = content.count
  } catch (error) {
    console.error('Error fetching reviews:', error)
    message.error(error instanceof Error ? error.message : '获取点评失败，请重试')
  }
}

const onPageUpdate = async (page: number) => {
  loading.value = true
  await router.push({ query: { ...route.query, page: page.toString() } })
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
