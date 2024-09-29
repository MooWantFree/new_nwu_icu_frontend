<template>
  <div class="bg-gray-100">
    <div class="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-6xl mx-auto">
        <h1 class="text-3xl font-bold text-gray-900 mb-8">时间线</h1>
        <div class="space-y-6">
          <template  v-if="loading">
            <review-item-skeleton v-for="index in pageLength" :key="index" />
          </template>
          <template v-else>
            <review-item
                v-for="(review, index) in reviews"
                :review="review"
                :key="index"
            />
          </template>
        </div>
        <div v-if="totalReviewCount !== 0" class="flex items-center justify-center">
          <n-pagination
              class="my-5"
              :item-count="totalReviewCount"
              :page-solt="7"
              :page-size="5"
              @update:page="onPageUpdate"
              v-model:page="currentPage"
          >
            <template #prefix="{ itemCount, startIndex, endIndex }">
              共{{ itemCount }}个点评
            </template>
          </n-pagination>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue"
import ReviewItem from "@/components/courseReview/timeline/ReviewItem.vue"
import { useMessage } from "naive-ui"
import { LatestCourseReviewResponse } from "@/types/courseReview"
import ReviewItemSkeleton from "@/components/courseReview/timeline/ReviewItemSkeleton.vue"
import { useRoute, useRouter } from "vue-router"
import { api } from "@/lib/requests"

const message = useMessage()

const reviews = ref<LatestCourseReviewResponse["success"]["reviews"]>()
const totalReviewCount = ref(0)
const loading = ref(true)
const pageLength = ref(5)

const router = useRouter()
const route = useRoute()

const fetchReviews = async (currentPage: number, pageSize: number = 5, desc: number = 1) => {
  const searchParams = new URLSearchParams({
    currentPage: currentPage.toString(),
    pageSize: pageSize.toString(),
    desc: desc.toString(),
  })
  const reqUrl = "/api/assessment/review/?" + searchParams.toString()
  
  try {
    const { status, content, errors } = await api.get<LatestCourseReviewResponse>(reqUrl)
    
    if (status !== 200) {
      if (errors) {
        message.error(errors.map(err => err.err_msg).join(', '))
      } else {
        message.error('获取点评失败，请重试')
      }
      return
    }
    
    reviews.value = content.reviews
    totalReviewCount.value = content.total
  } catch (error) {
    console.error('Error fetching reviews:', error)
    message.error('获取点评失败，请重试')
  }
}

onMounted(async () => {
  loading.value = true
  await fetchReviews(currentPage.value)
  loading.value = false
})

// Page
const queryPage = parseInt(route.query.page as string)
const currentPage = ref(isNaN(queryPage) ? 1 : queryPage)
const onPageUpdate = async (page: number) => {
  loading.value = true
  await Promise.all([
    router.replace({path: route.path, query: {page: page}}),
    fetchReviews(page)
  ])
  loading.value = false
}
</script>
