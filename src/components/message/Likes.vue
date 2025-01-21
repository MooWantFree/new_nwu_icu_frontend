<template>
  <div class="flex flex-col h-full">
    <div class="flex justify-between items-center mb-6 p-4 border-b">
      <h2 class="text-2xl font-bold text-gray-800">收到的赞</h2>
      <button
        @click="refreshLikes"
        class="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition duration-300 ease-in-out flex items-center shadow-md"
      >
        <RefreshCw class="w-4 h-4 mr-2" />
        刷新
      </button>
    </div>
    <div class="flex-grow overflow-y-auto">
      <div v-if="loading" class="flex items-center justify-center h-full">
        <div class="p-8 bg-white rounded-lg shadow-md">
          <div
            class="w-16 h-16 mx-auto mb-4 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"
          />
          <p class="text-center text-gray-600">加载中...</p>
        </div>
      </div>
      <template v-else-if="likes.length">
        <div
          v-for="notice in likes"
          :key="notice.id"
          class="mb-4 p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition duration-300"
        >
          <div class="flex items-start space-x-4">
            <div class="flex-1">
              <div class="flex items-center justify-between mb-2">
                <span class="text-lg font-semibold text-gray-800">{{
                  notice.raw_info.course.name
                }}</span>
                <Time
                  :time="new Date(notice.datetime)"
                  format="yyyy-MM-dd HH:mm"
                  class="text-sm text-gray-500"
                />
              </div>
              <p class="text-sm text-gray-600 mb-3">
                {{ notice.raw_info.classify }}
              </p>
              <div class="p-4 bg-gray-50 rounded-lg mb-3">
                <p class="text-sm text-gray-700">
                  {{ notice.raw_info.content }}
                </p>
              </div>
              <div class="flex items-center space-x-4 text-sm text-gray-500">
                <span class="flex items-center">
                  <ThumbsUp class="w-4 h-4 text-green-500 mr-1" />
                  {{ notice.like.like }}
                </span>
                <span class="flex items-center">
                  <ThumbsDown class="w-4 h-4 text-red-500 mr-1" />
                  {{ notice.like.dislike }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </template>
      <div v-else class="flex items-center justify-center h-full">
        <p class="text-gray-500 text-lg">暂无收到的赞</p>
      </div>
    </div>
    <n-pagination
      v-if="totalCount > 0"
      v-model:page="currentPage"
      :page-count="maxPage"
      :on-update:page="handlePageChange"
      class="p-4"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import { api } from '@/lib/requests'
import type { APILikeList } from '@/types/api/messages/like'
import Time from '@/components/tinyComponents/Time.vue'
import { RefreshCw, ThumbsUp, ThumbsDown } from 'lucide-vue-next'

const message = useMessage()
const loading = ref(true)
const likes = ref<APILikeList['response']['results']>([])
const currentPage = ref(1)
const totalCount = ref(0)
const maxPage = ref(0)

const fetchLikes = async (page: number) => {
  try {
    loading.value = true
    const response = await api.get({
      url: '/api/message/like/',
      query: { page },
    })
    likes.value = response.content.results
    totalCount.value = response.content.count
    maxPage.value = response.content.max_page
  } catch (error) {
    message.error('获取赞列表失败')
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchLikes(page)
}

const refreshLikes = () => {
  fetchLikes(currentPage.value)
}

onMounted(() => {
  fetchLikes(currentPage.value)
})
</script>
