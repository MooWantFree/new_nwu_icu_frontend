<template>
  <div v-if="loading" class="flex items-center justify-center h-full">
    <div class="p-8 bg-white rounded-lg shadow-md">
      <div
        class="w-16 h-16 mx-auto mb-4 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"
      />
      <p class="text-center text-gray-600">加载中...</p>
    </div>
  </div>
  <div v-else class="replies-container">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-800">回复我的</h2>
      <button
        @click="refreshReplies"
        class="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition duration-300 ease-in-out flex items-center shadow-md"
      >
        <RefreshCw class="w-4 h-4 mr-2" />
        刷新
      </button>
    </div>

    <div class="space-y-4">
      <div
        v-for="reply in replies"
        :key="reply.id"
        class="bg-white rounded-lg shadow p-4"
      >
        <div class="flex items-start space-x-4">
          <img
            :src="`/api/download/${reply.created_by.avatar}`"
            alt="User avatar"
            class="w-10 h-10 rounded-full"
          />
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-900">
                  <RouterLink
                    :to="`/user/${reply.created_by.id}`"
                    class="text-blue-600 hover:underline"
                    >{{ reply.created_by.nickname }}</RouterLink
                  >
                  <span>&nbsp;回复了</span>
                  <span
                    >《
                    <RouterLink
                      :to="`/review/course/${reply.course.id}`"
                      class="text-blue-600 hover:underline"
                      >{{ reply.course.name }}</RouterLink
                    >》下的</span
                  >
                  <span class="text-blue-600 hover:underline"
                    ><RouterLink :to="`/review/course/${reply.course.id}`"
                      >我的评论</RouterLink
                    ></span
                  >
                </p>
                <p class="text-sm text-gray-500">
                  {{ formatDate(reply.datetime) }}
                </p>
              </div>
              <div class="relative">
                <button
                  @click="toggleMenu(reply.id)"
                  class="text-gray-400 hover:text-gray-600"
                >
                  <MoreVertical class="w-4 h-4" />
                </button>
                <div
                  v-if="activeMenu === reply.id"
                  class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200"
                >
                  <button
                    @click="
                      deleteConfirmation = reply.id;
                      activeMenu = null
                    "
                    class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    删除回复
                  </button>
                </div>
                <div
                  v-if="deleteConfirmation === reply.id"
                  class="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg p-4 z-20 border border-gray-200"
                >
                  <p class="text-sm text-gray-700 mb-3">
                    确定要删除这条回复吗？
                  </p>
                  <div class="flex justify-end space-x-2">
                    <button
                      @click="deleteConfirmation = null"
                      class="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      @click="deleteReply(reply.id)"
                      class="px-3 py-1.5 text-sm text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors"
                    >
                      确认删除
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div class="mt-2">
              <p class="text-sm text-gray-600">{{ reply.reply.content }}</p>
            </div>
            <div
              v-if="reply.raw_post.classify === 'reply'"
              class="mt-2 p-3 bg-gray-50 rounded-lg"
            >
              <p class="text-sm text-gray-600">{{ reply.raw_post.content }}</p>
              <!-- <p class="text-sm text-gray-600">回复给：
                <Viewer :value="reply.raw_post.content" />
              </p> -->
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!replies || replies.length === 0" class="text-center py-8">
      <p class="text-gray-500">暂无回复</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { MoreVertical, RefreshCw } from 'lucide-vue-next'
import { api } from '@/lib/requests'
import { useMessage } from 'naive-ui'
import { APINotificationList } from '@/types/api/messages/messages'

const replies = ref<APINotificationList['response']['results']>()
const message = useMessage()
const loading = ref(true)
const activeMenu = ref<number | null>(null)
const deleteConfirmation = ref<number | null>(null)

// Close menu when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  if (
    activeMenu.value !== null &&
    !(event.target as Element).closest('.relative')
  ) {
    activeMenu.value = null
  }
}

onMounted(async (): Promise<void> => {
  await fetchData()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const fetchData = async (): Promise<void> => {
  loading.value = true
  try {
    const response = await api.get({
      url: '/api/message/reply/',
      query: {
        page: 1,
      },
    })
    if (response.status.toString().startsWith('2')) {
      replies.value = response.content.results
    } else {
      message.error('获取回复失败')
    }
  } catch (error) {
    message.error('获取回复失败')
    console.error('Failed to fetch replies:', error)
  } finally {
    loading.value = false
  }
}

const formatDate = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const refreshReplies = async (): Promise<void> => {
  loading.value = true
  await fetchData()
}

const toggleMenu = (replyId: number) => {
  if (activeMenu.value === replyId) {
    activeMenu.value = null
  } else {
    activeMenu.value = replyId
  }
}

// const deleteReply = async (replyId: number) => {
//   try {
//     await api.delete(`/api/message/reply/${replyId}`)
//     message.success('回复已删除')
//     deleteConfirmation.value = null
//     await new Promise((resolve) => setTimeout(resolve, 500))
//     await fetchData() // Refresh the list after deletion
//   } catch (error) {
//     message.error('删除回复失败')
//     console.error('Failed to delete reply:', error)
//   }
// }
</script>

<style scoped>
.replies-container {
  max-width: 800px;
  margin: 0 auto;
}
</style>
