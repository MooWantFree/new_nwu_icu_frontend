<template>
  <div>
    <div v-if="data && data.results.length > 0">
      <div
        v-for="review in data.results"
        :key="review.id"
        class="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm"
      >
        <div class="flex justify-between items-center mb-2">
          <router-link
            :to="`/review/course/${review.course.id}`"
            class="text-lg font-bold text-blue-700 transition-colors duration-200 hover:text-blue-800"
          >
            {{ review.course.name }}
          </router-link>
          <Time :time="review.datetime" />
        </div>
        <div class="flex items-center mb-2">
          <span class="mr-2 text-sm text-gray-600">评分:</span>
          <div class="flex items-center">
            <span class="text-lg font-bold text-yellow-500 mr-2">
              {{ review.rating.rating.toFixed(1) }}
            </span>
            <n-rate
              :value="review.rating.rating"
              :size="16"
              readonly
              allow-half
              class="text-yellow-400"
            />
          </div>
        </div>
        <p class="text-gray-700 mb-2">
          <ReviewPlainText :content="review.content.current_content" />
        </p>
        <div class="flex flex-wrap gap-4 text-sm text-gray-600">
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
        <div class="mt-2 flex justify-between items-center">
          <div class="flex items-center text-sm text-gray-500">
            <span class="mr-4">
              <ThumbsUp class="inline-block w-4 h-4 mr-1" />
              {{ review.like.like }}
            </span>
            <span>
              <ThumbsDown class="inline-block w-4 h-4 mr-1" />
              {{ review.like.dislike }}
            </span>
          </div>
          <div class="flex items-center">
            <span v-if="review.is_me && review.anonymous" class="mr-2 text-sm text-gray-500">
              (匿名评价)
            </span>
            <button
              class="btn-secondary min-h-8 px-3 py-1"
              @click="
                $router.push(
                  `/review/course/${review.course.id}#review-${review.id}`
                )
              "
            >
              更多
            </button>
          </div>
        </div>
      </div>
      <div class="mt-6 flex justify-center items-center">
        <n-pagination
          :page="currentPage"
          :page-count="data.max_page"
          @update:page="handlePageChange"
          :page-size="pageSize"
          :page-sizes="[10, 20, 30, 40]"
          :show-size-picker="true"
          @update:page-size="handlePageSizeChange"
        >
          <template #prefix>
            第 {{ (currentPage - 1) * pageSize + 1 }} -
            {{ Math.min(currentPage * pageSize, data.count) }} 条，共
            {{ data.count }} 条
          </template>
        </n-pagination>
      </div>
    </div>
    <div v-else-if="errorDetail" class="text-center py-8">
      <p class="text-gray-500">{{ errorDetail }}</p>
    </div>
    <div v-else-if="data && data.results.length === 0" class="text-center py-8">
      <p class="text-gray-500">暂无评价</p>
    </div>
    <div v-else class="flex justify-center items-center h-32">
      <LoaderCircle class="w-8 h-8 text-blue-700 animate-spin" />
      <span class="ml-2 text-gray-600">加载中...</span>
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
import { NRate } from 'naive-ui'
import { LoaderCircle, ThumbsUp, ThumbsDown } from 'lucide-vue-next'
import ReviewPlainText from '@/components/tinyComponents/ReviewPlainText.vue'
import Time from '@/components/tinyComponents/Time.vue'

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
