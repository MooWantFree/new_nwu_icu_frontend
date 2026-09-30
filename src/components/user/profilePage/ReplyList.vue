<template>
  <div>
    <div v-if="data && data.results.length > 0">
      <div
        v-for="reply in data.results"
        :key="reply.id"
        class="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm"
      >
        <div class="flex justify-between items-center mb-2">
          <router-link
            :to="getReplyRoute(reply.course.id, reply.reply.id)"
            class="text-lg font-bold text-blue-700 transition-colors duration-200 hover:text-blue-800"
          >
            {{ reply.course.name }}
          </router-link>
          <Time :time="reply.datetime" />
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
            class="btn-secondary min-h-8 px-3 py-1"
            @click="$router.push(getReplyRoute(reply.course.id, reply.reply.id))"
          >
            查看原文
          </button>
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
      <p class="text-gray-500">暂无评论</p>
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
import { APIUserActivitiesReply } from '@/types/api/user/profilePage'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LoaderCircle } from 'lucide-vue-next'
import ReviewPlainText from '@/components/tinyComponents/ReviewPlainText.vue'
import Time from '@/components/tinyComponents/Time.vue'

// Define props
const props = defineProps<{
  id?: string
}>()

// Define reactive data
type DataType = APIUserActivitiesReply['response']
const data = ref<DataType | null>(null)
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
const errorDetail = ref<string | null>(null)

const getReplyRoute = (courseId: number, replyId: number) => ({
  name: 'courseReviewItem',
  params: { id: courseId },
  hash: `#reply-${replyId}`,
})

// Fetch data function
const fetchData = async (isCurrent: () => boolean) => {
  data.value = null
  errorDetail.value = null
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
    if (!isCurrent()) return
    if (response.status !== 200) {
      console.error('API request failed:', response.status)
      errorDetail.value = response.errors?.[0]?.err_msg || '获取评论失败，请重试'
      return
    }
    data.value = response.content
  } catch (error) {
    if (!isCurrent()) return
    console.error('Failed to fetch replies:', error)
    errorDetail.value = '获取评论失败，请重试'
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
