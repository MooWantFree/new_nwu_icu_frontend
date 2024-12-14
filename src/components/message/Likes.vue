<template>
  <div class="flex flex-col h-full">
    <div class="p-4 border-b">
      <h2 class="text-lg font-semibold">收到的赞</h2>
    </div>
    <div class="flex-grow overflow-y-auto">
      <div v-if="loading" class="p-4">
        <n-skeleton text :repeat="5" />
      </div>
      <template v-else-if="likes.length">
        <div
          v-for="like in likes"
          :key="like.id"
          class="p-4 border-b hover:bg-gray-50"
        >
          <div class="flex items-start space-x-3">
            <n-avatar :src="like.user.avatar" />
            <div class="flex-1">
              <div class="flex items-center justify-between">
                <span class="font-medium">{{ like.user.username }}</span>
                <n-time
                  :time="new Date(like.timestamp)"
                  format="yyyy-MM-dd HH:mm"
                />
              </div>
              <p class="mt-1 text-sm text-gray-600">赞了你的{{ like.type }}</p>
              <div class="mt-2 p-3 bg-gray-50 rounded-lg">
                <p class="text-sm text-gray-600">{{ like.content }}</p>
              </div>
            </div>
          </div>
        </div>
      </template>
      <div v-else class="p-4 text-center text-gray-500">暂无收到的赞</div>
    </div>
    <n-pagination
      v-if="totalCount > 0"
      v-model:page="currentPage"
      :page-count="totalPages"
      :on-update:page="handlePageChange"
      class="p-4"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import { api } from '@/lib/requests'

const message = useMessage()
const loading = ref(true)
const likes = ref([])
const currentPage = ref(1)
const totalCount = ref(0)
const totalPages = ref(0)

const fetchLikes = async (page: number) => {
  try {
    loading.value = true
    const response = await api.get(`/likes?page=${page}`)
    likes.value = response.data.results
    totalCount.value = response.data.count
    totalPages.value = Math.ceil(totalCount.value / 10) // Assuming 10 items per page
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

onMounted(() => {
  fetchLikes(currentPage.value)
})
</script>
