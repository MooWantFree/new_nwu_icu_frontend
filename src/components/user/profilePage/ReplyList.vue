<template>
  <div>
    <div v-if="data && data.results.length > 0">
      <div
        v-for="reply in data.results"
        :key="reply.id"
        class="mb-6 p-4 bg-gray-50 rounded-lg shadow"
      >
        <div class="flex justify-between items-center mb-2">
          <router-link
            :to="`/review/course/${reply.course.id}`"
            class="text-lg font-bold text-indigo-600 hover:text-indigo-800 transition-colors duration-200"
          >
            {{ reply.course.name }}
          </router-link>
          <span class="text-sm text-gray-500">{{
            new Date(reply.datetime).toLocaleDateString()
          }}</span>
        </div>
        <div class="mb-4">
          <div class="bg-gray-100 p-3 rounded mb-2">
            <p class="text-gray-700">
              <!-- 回复了 {{ reply.parent.created_by.name }}: -->
              <ReviewPlainText :content="reply.review.content" />
            </p>
          </div>
          <p class="text-gray-700">{{ reply.reply.content }}</p>
        </div>
        <div class="flex justify-between items-center">
          <div class="flex items-center text-sm text-gray-500">
            <!-- <span class="mr-4">
              <ThumbsUp class="inline-block w-4 h-4 mr-1" />
              {{ reply.like.like }}
            </span>
            <span>
              <ThumbsDown class="inline-block w-4 h-4 mr-1" />
              {{ reply.like.dislike }}
            </span> -->
          </div>
          <button
            class="px-3 py-1 text-sm text-indigo-600 border border-indigo-600 rounded hover:bg-indigo-600 hover:text-white transition-colors duration-200"
            @click="$router.push(`/review/course/${reply.course.id}`)"
          >
            查看原文
          </button>
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
    <div v-else-if="data && data.results.length === 0" class="text-center py-8">
      <p class="text-gray-500">暂无评论</p>
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
import { APIUserActivitiesReply } from '@/types/api/user/profilePage'
import { ref, watchEffect } from 'vue'
import { LoaderCircle, ThumbsUp, ThumbsDown } from 'lucide-vue-next'
import ReviewPlainText from '@/components/tinyComponents/ReviewPlainText.vue';

// Define props
const props = defineProps<{
  id?: string
}>()

// Define reactive data
type DataType = APIUserActivitiesReply['response']
const data = ref<DataType | null>(null)
const currentPage = ref(1)
const pageSize = ref(10)

// Fetch data function
const fetchData = async () => {
  if (!props.id) {
    return
  }
  try {
    const response = await api.get({
      url: '/api/assessment/user/activities/reply/:id/',
      params: {
        id: parseInt(props.id),
      },
      query: {
        page: currentPage.value,
        page_size: pageSize.value,
      },
    })
    data.value = response.content
  } catch (error) {
    console.error('Failed to fetch replies:', error)
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
