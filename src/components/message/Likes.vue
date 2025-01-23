<template>
  <div class="flex flex-col h-full">
    <div class="flex justify-between items-center mb-6 p-4 border-b">
      <h2 class="text-2xl font-bold text-gray-800">收到的赞</h2>
      <button
        @click="refreshLikes"
        class="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition duration-300 ease-in-out flex items-center shadow-md"
      >
        <RefreshCw class="w-5 h-5 mr-2" />
        刷新
      </button>
    </div>
    <div class="flex-grow overflow-y-auto px-4">
      <div v-if="loading" class="flex items-center justify-center h-full">
        <div class="p-10 bg-white rounded-xl shadow-lg">
          <div
            class="w-20 h-20 mx-auto mb-6 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"
          />
          <p class="text-center text-gray-600 text-lg">加载中...</p>
        </div>
      </div>
      <template v-else-if="likes.length">
        <div
          v-for="notice in likes"
          :key="notice.id"
          class="mb-6 p-8 bg-white rounded-xl shadow-md hover:shadow-lg transition duration-300"
        >
          <div class="flex items-start space-x-6">
            <div class="flex-1">
              <div class="flex items-center justify-between mb-4">
                <span class="text-xl font-semibold text-gray-800">{{
                  notice.raw_info.course.name
                }}</span>
                <Time
                  :time="new Date(notice.datetime)"
                  format="yyyy-MM-dd HH:mm"
                  class="text-sm text-gray-500"
                />
              </div>
              <p class="text-md text-gray-600 mb-4">
                {{ notice.raw_info.classify }}
              </p>
              <div class="p-6 bg-gray-50 rounded-lg mb-4">
                <p class="text-md text-gray-700">
                  {{ notice.raw_info.content }}
                </p>
              </div>
              <div class="flex items-center space-x-6 text-md text-gray-500">
                <span class="flex items-center">
                  <ThumbsUp class="w-5 h-5 text-green-500 mr-2" />
                  {{ notice.like.like }}
                </span>
                <span class="flex items-center">
                  <ThumbsDown class="w-5 h-5 text-red-500 mr-2" />
                  {{ notice.like.dislike }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </template>
      <div v-else class="flex items-center justify-center h-full">
        <p class="text-gray-500 text-xl">暂无收到的赞</p>
      </div>
    </div>
    <div class="flex justify-center p-6">
      <n-pagination
        v-if="totalCount > 0"
        v-model:page="currentPage"
        :page-count="maxPage"
        :on-update:page="handlePageChange"
        class="bg-white shadow-sm rounded-lg"
      />
    </div>
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
