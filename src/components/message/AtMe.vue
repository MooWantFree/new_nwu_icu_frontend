<template>
  <div v-if="loading" class="flex items-center justify-center h-full">
    <div class="p-8 bg-white rounded-lg shadow-md">
      <div
        class="w-16 h-16 mx-auto mb-4 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"
      />
      <p class="text-center text-gray-600">加载中...</p>
    </div>
  </div>
  <div v-else class="flex flex-col h-full">
    <div class="p-4 border-b">
      <h2 class="text-lg font-semibold">@我的</h2>
    </div>
    <div class="flex-grow overflow-y-auto">
      <template v-if="atMeMessages.length">
        <div
          v-for="message in atMeMessages"
          :key="message.id"
          class="p-4 border-b hover:bg-gray-50"
        >
          <div class="flex items-start space-x-3">
            <img
              :src="message.avatar"
              alt="Avatar"
              class="w-10 h-10 rounded-full"
            />
            <div class="flex-1">
              <div class="flex items-center justify-between">
                <span class="font-medium">{{ message.username }}</span>
                <span class="text-sm text-gray-500">{{
                  formatDate(message.timestamp)
                }}</span>
              </div>
              <p class="mt-1 text-sm text-gray-600">{{ message.content }}</p>
            </div>
          </div>
        </div>
      </template>
      <div v-else class="p-4 text-center text-gray-500">暂无@我的消息</div>
    </div>
    <div v-if="totalCount > 0" class="p-4 flex justify-center">
      <nav class="inline-flex rounded-md shadow">
        <button
          v-for="page in totalPages"
          :key="page"
          @click="handlePageChange(page)"
          :class="[
            'px-4 py-2 text-sm font-medium border',
            currentPage === page
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50',
          ]"
        >
          {{ page }}
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { api } from '@/lib/requests'

interface AtMeMessage {
  id: number
  avatar: string
  username: string
  content: string
  timestamp: string
}

const loading = ref(true)
const atMeMessages = ref<AtMeMessage[]>([])
const currentPage = ref(1)
const totalCount = ref(0)
const pageSize = 20

const totalPages = computed(() => Math.ceil(totalCount.value / pageSize))

const fetchAtMeMessages = async (page: number) => {
  loading.value = true
  try {
    const response = await api.get('/api/messages/at-me', {
      params: { page, page_size: pageSize },
    })
    atMeMessages.value = response.data.results
    totalCount.value = response.data.count
  } catch (error) {
    console.error('获取@我的消息失败', error)
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchAtMeMessages(page)
}

const formatDate = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(() => {
  fetchAtMeMessages(currentPage.value)
})
</script>
