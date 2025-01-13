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
          v-for="notice in likes"
          :key="notice.id"
          class="p-4 border-b hover:bg-gray-50"
        >
          <div class="flex items-start space-x-3">
            <div class="flex-1">
              <div class="flex items-center justify-between">
                <span class="font-medium">{{
                  notice.raw_info.course.name
                }}</span>
                <n-time
                  :time="new Date(notice.datetime)"
                  format="yyyy-MM-dd HH:mm"
                />
              </div>
              <p class="mt-1 text-sm text-gray-600">
                {{ notice.raw_info.classify }}
              </p>
              <div class="mt-2 p-3 bg-gray-50 rounded-lg">
                <p class="text-sm text-gray-600">
                  {{ notice.raw_info.content }}
                </p>
              </div>
              <div
                class="mt-2 flex items-center space-x-4 text-sm text-gray-500"
              >
                <span>👍 {{ notice.like.like }}</span>
                <span>👎 {{ notice.like.dislike }}</span>
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

const message = useMessage()
const loading = ref(true)
// Store the likes data from API
const likes = ref<APILikeList['response']['results']>([])
// Current page number
const currentPage = ref(1)
// Total count of notices
const totalCount = ref(0)
// Maximum page number
const maxPage = ref(0)

// Fetch likes data from API
const fetchLikes = async (page: number) => {
  try {
    loading.value = true
    // Call the API endpoint with the correct path
    const response = await api.get({
      url: '/api/message/like/',
      query: { page },
    })
    // Update the data with API response
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

onMounted(() => {
  fetchLikes(currentPage.value)
})
</script>
