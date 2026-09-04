<template>
  <div class="flex flex-col h-full bg-gray-50">
    <div class="sticky top-0 z-10 flex justify-between items-center p-4 bg-white shadow-sm border-b">
      <h2 class="flex items-center text-xl font-bold text-gray-900 md:text-2xl">
        <ThumbsUp class="w-5 h-5 mr-2 text-blue-700" />
        收到的赞
      </h2>
      <button
        @click="refreshLikes"
        class="px-3 py-2 md:px-4 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 flex items-center shadow-sm"
        :disabled="loading"
      >
        <RefreshCw class="w-4 h-4 mr-1 md:mr-2" :class="{ 'animate-spin': loading }" />
        <span class="text-sm md:text-base">刷新</span>
      </button>
    </div>
    
    <div class="flex-grow overflow-y-auto px-2 md:px-4 py-4">
      <div v-if="loading" class="flex items-center justify-center h-full">
        <div class="p-6 rounded-lg">
          <div class="w-16 h-16 mx-auto mb-4 border-4 border-gray-100 border-t-blue-600 rounded-full animate-spin" />
          <p class="text-center text-gray-600">加载中...</p>
        </div>
      </div>
      
      <div v-else-if="likes.length" class="space-y-4">
        <div
          v-for="notice in likes"
          :key="notice.id"
          class="bg-white rounded-lg shadow-sm hover:shadow-md transition duration-200 overflow-hidden"
        >
          <div class="p-4 border-b border-gray-100 flex justify-between items-center">
            <RouterLink v-if="notice.source === 'guestbook'"
              :to="`/guestbook/${notice.guestbook.root_id}?focus=${notice.guestbook.entry_id}`"
              class="text-blue-700 hover:text-blue-800 font-medium truncate max-w-[70%]"
            >留言板</RouterLink>
            <RouterLink v-else
              :to="`/review/course/${notice.raw_info.course.id}`" 
              class="text-blue-700 hover:text-blue-800 font-medium truncate max-w-[70%]"
            >
              {{ notice.raw_info.course.name }}
            </RouterLink>
            <Time
              :time="new Date(notice.datetime)"
              format="yyyy-MM-dd HH:mm"
              class="text-xs text-gray-500"
            />
          </div>
          
          <div class="p-4">
            <div v-if="notice.source === 'guestbook'" class="bg-gray-50 rounded-lg p-4 mb-3 text-sm md:text-base text-gray-700">
              你的留言收到了新的赞。
            </div>
            <div v-else class="bg-gray-50 rounded-lg p-4 mb-3 text-sm md:text-base text-gray-700">
              {{ extractText(notice.raw_info.raw_post.content) }}
            </div>
            
            <div class="flex items-center space-x-4 text-sm text-gray-600">
              <span class="flex items-center">
                <ThumbsUp class="w-4 h-4 text-green-500 mr-1" />
                {{ notice.like.like }}
              </span>
              <span v-if="notice.source !== 'guestbook'" class="flex items-center">
                <ThumbsDown class="w-4 h-4 text-red-500 mr-1" />
                {{ notice.like.dislike }}
              </span>
              <RouterLink v-if="notice.source === 'guestbook'"
                :to="`/guestbook/${notice.guestbook.root_id}?focus=${notice.guestbook.entry_id}`"
                class="ml-auto text-xs text-blue-700 hover:text-blue-800 px-3 py-1 border border-blue-200 rounded-full hover:bg-blue-50"
              >查看详情</RouterLink>
              <RouterLink v-else
                :to="`/review/course/${notice.raw_info.course.id}`" 
                class="ml-auto text-xs text-blue-700 hover:text-blue-800 px-3 py-1 border border-blue-200 rounded-full hover:bg-blue-50"
              >
                查看详情
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="flex flex-col items-center justify-center h-full text-center p-4">
        <div class="w-20 h-20 mb-4 text-gray-300">
          <ThumbsUp class="w-full h-full" />
        </div>
        <p class="text-gray-500 text-lg mb-2">暂无收到的赞</p>
        <p class="text-gray-400 text-sm">发布高质量的评价，获取更多点赞吧！</p>
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
import type { APILikeList } from '@/types/api/messages/like'
import Time from '@/components/tinyComponents/Time.vue'
import { RefreshCw, ThumbsUp, ThumbsDown } from 'lucide-vue-next'

const message = useMessage()
const loading = ref(true)
const likes = ref<APILikeList['response']['results']>([])
const currentPage = ref(1)
const totalCount = ref(0)
const maxPage = ref(0)

const isMobile = ref(false)

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
    if (likes.value.length) {
      try {
        await api.post({
          url: '/api/message/notifications/read/',
          query: { ids: likes.value.map(item => item.id) },
        })
      } catch (error) {
        console.error('Error marking like notifications read:', error)
      }
    }
  } catch (error) {
    message.error('获取赞列表失败')
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchLikes(page)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const refreshLikes = () => {
  fetchLikes(currentPage.value)
}

const handleResize = () => {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  fetchLikes(currentPage.value)
  handleResize()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

function extractText(html: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}
</script>
