<template>
  <div class="flex flex-col h-full bg-gray-50">
    <div class="sticky top-0 z-10 flex justify-between items-center p-4 bg-white shadow-sm border-b">
      <h2 class="text-xl md:text-2xl font-bold text-gray-800 flex items-center">
        <MessageSquare class="w-5 h-5 mr-2 text-blue-500" />
        回复我的
      </h2>
      <button
        @click="refreshReplies"
        class="px-3 py-2 md:px-4 md:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200 flex items-center shadow-sm"
        :disabled="loading"
      >
        <RefreshCw class="w-4 h-4 mr-1 md:mr-2" :class="{ 'animate-spin': loading }" />
        <span class="text-sm md:text-base">刷新</span>
      </button>
    </div>

    <div class="flex-grow overflow-y-auto px-2 md:px-4 py-4">
      <div v-if="loading" class="flex items-center justify-center h-full">
        <div class="p-6 rounded-lg">
          <div class="w-16 h-16 mx-auto mb-4 border-4 border-gray-100 border-t-blue-500 rounded-full animate-spin" />
          <p class="text-center text-gray-600">加载中...</p>
        </div>
      </div>

      <div v-else-if="replies && replies.length" class="space-y-4">
        <div
          v-for="reply in replies"
          :key="reply.id"
          class="bg-white rounded-lg shadow-sm hover:shadow-md transition duration-200 overflow-hidden"
        >
          <div class="p-4 border-b border-gray-100 flex justify-between items-center">
            <div class="flex items-center space-x-2">
              <img
                :src="`/api/download/${reply.created_by.avatar}`"
                alt="User avatar"
                class="w-8 h-8 rounded-full"
              />
              <RouterLink
                :to="`/user/${reply.created_by.id}`"
                class="text-blue-600 hover:text-blue-800 font-medium"
              >
                {{ reply.created_by.nickname }}
              </RouterLink>
              <span class="text-gray-500">&nbsp;回复了</span>
            </div>
            <Time
              :time="new Date(reply.datetime)"
              format="yyyy-MM-dd HH:mm"
              class="text-xs text-gray-500"
            />
          </div>

          <div class="p-4">
            <div class="bg-gray-50 rounded-lg p-4 mb-3 text-sm md:text-base text-gray-700">
              《
              <RouterLink
                :to="`/review/course/${reply.course.id}`"
                class="text-blue-600 hover:underline"
              >{{ reply.course.name }}</RouterLink>》下的
              <RouterLink 
                :to="`/review/course/${reply.course.id}`"
                class="text-blue-600 hover:underline"
              >我的评论</RouterLink>
            </div>
            <div class="mt-2">
              <p class="text-sm text-gray-600">{{ reply.reply.content }}</p>
            </div>
            <div
              v-if="reply.raw_post.classify === 'reply'"
              class="mt-2 p-3 bg-gray-50 rounded-lg"
            >
              <p class="text-sm text-gray-600">{{ reply.raw_post.content }}</p>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="flex flex-col items-center justify-center h-full text-center p-4">
        <div class="w-20 h-20 mb-4 text-gray-300">
          <MessageSquare class="w-full h-full" />
        </div>
        <p class="text-gray-500 text-lg mb-2">暂无收到的回复</p>
        <p class="text-gray-400 text-sm">发布评论，参与讨论吧！</p>
      </div>
    </div>

    <div class="p-4 flex justify-center bg-white border-t" v-if="totalCount > 0">
      <n-pagination
        v-model:page="currentPage"
        :page-count="maxPage"
        :on-update:page="handlePageChange"
        :size="isMobile ? 'small' : 'medium'"
        class="shadow-sm rounded-lg"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useMessage } from 'naive-ui'
import { api } from '@/lib/requests'
import type { APINotificationList } from '@/types/api/messages/messages'
import Time from '@/components/tinyComponents/Time.vue'
import { RefreshCw, MessageSquare } from 'lucide-vue-next'

const message = useMessage()
const loading = ref(true)
const replies = ref<APINotificationList['response']['results']>([])
const currentPage = ref(1)
const totalCount = ref(0)
const maxPage = ref(0)

const isMobile = ref(false)

// Close menu when clicking outside
const handleResize = () => {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  fetchReplies(currentPage.value)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

const fetchReplies = async (page: number) => {
  try {
    loading.value = true
    const response = await api.get({
      url: '/api/message/reply/',
      query: { page },
    })
    replies.value = response.content.results
    totalCount.value = response.content.count
    maxPage.value = response.content.max_page
  } catch (error) {
    message.error('获取回复列表失败')
  } finally {
    loading.value = false
  }
}

const refreshReplies = () => {
  fetchReplies(currentPage.value)
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchReplies(page)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>


