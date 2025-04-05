<template>
  <div>
    <div v-if="data && data.results.length > 0">
      <div
        v-for="review in data.results"
        :key="review.id"
        class="mb-6 p-4 bg-gray-50 rounded-lg shadow"
      >
        <div class="flex justify-between items-center mb-2">
          <router-link
            :to="`/review/course/${review.course.id}`"
            class="text-lg font-bold text-indigo-600 hover:text-indigo-800 transition-colors duration-200"
          >
            {{ review.course.name }}
          </router-link>
          <span class="text-sm text-gray-500">{{
            new Date(review.datetime).toLocaleDateString()
          }}</span>
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
            <Rate v-model="review.rating.difficulty" :readonly="true" :max="3"/>
          </span>
          <span class="flex items-center">
            <span class="font-medium mr-1">给分:</span>
            <Rate v-model="review.rating.grade" :readonly="true" :max="3"/>
          </span>
          <span class="flex items-center">
            <span class="font-medium mr-1">作业量:</span>
            <Rate v-model="review.rating.homework" :readonly="true" :max="3" />
          </span>
          <span class="flex items-center">
            <span class="font-medium mr-1">收获:</span>
            <Rate v-model="review.rating.reward" :readonly="true" :max="3" />
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
              class="px-3 py-1 text-sm text-indigo-600 border border-indigo-600 rounded hover:bg-indigo-600 hover:text-white transition-colors duration-200"
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
          v-model:page="currentPage"
          :page-count="data.max_page"
          :on-update:page="handlePageChange"
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
      <LoaderCircle class="w-8 h-8 text-indigo-500 animate-spin" />
      <span class="ml-2 text-gray-600">加载中...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
// Import necessary components and types
import { api } from '@/lib/requests'
import { APIUserActivitiesReview } from '@/types/api/user/profilePage'
import { ref, watchEffect } from 'vue'
import Rate from '@/components/tinyComponents/Rate.vue'
import { NRate } from 'naive-ui'
import { LoaderCircle, ThumbsUp, ThumbsDown } from 'lucide-vue-next'
import ReviewPlainText from '@/components/tinyComponents/ReviewPlainText.vue'

// Define props
const props = defineProps<{
  id?: string
}>()

// Define reactive data
const data = ref<APIUserActivitiesReview['response'] | null>(null)
const errorDetail = ref<string>('')
const currentPage = ref(1)
const pageSize = ref(10)

// Fetch data function
const fetchData = async () => {
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
    if (response.status !== 200) {
      console.error('API request failed:', response.status)
      errorDetail.value = response.errors[0].err_msg
      return
    }
    data.value = response.data.contents
  } catch (error) {
    console.error('Failed to fetch reviews:', error)
  }
}

// Watch for changes and fetch data
watchEffect(fetchData)

// Page change handler
const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchData()
}

// Page size change handler
const handlePageSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  fetchData()
}
</script>
