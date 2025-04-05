<template>
  <div
    v-if="loading"
    class="flex items-center justify-center min-h-screen bg-gray-100"
  >
    <div class="p-8 bg-white rounded-lg shadow-md">
      <div
        class="w-16 h-16 mx-auto mb-4 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"
      />
      <p class="text-center text-gray-600">加载中...</p>
    </div>
  </div>
  <div
    v-else-if="error"
    class="flex items-center justify-center min-h-screen bg-gray-100"
  >
    <div class="p-8 bg-white rounded-lg shadow-md text-center">
      <XCircle class="w-16 h-16 mx-auto mb-4 text-red-500" />
      <p class="text-lg text-gray-800 mb-4">加载失败</p>
      <p class="text-gray-600 mb-6">{{ error }}</p>
      <button
        @click="fetchContent"
        class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
      >
        重试
      </button>
    </div>
  </div>
  <div v-else class="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gray-100">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-800 mb-8">文章</h1>
      <div v-for="(item, index) in content" class="py-2">
        <div class="bg-white rounded-xl shadow-lg overflow-hidden">
          <div class="p-8">
            <div class="flex justify-between mb-2">
              <RouterLink :to="`/blog/${item.id}`"
                          class="text-2xl font-bold text-gray-800">
                {{ item.title }}
              </RouterLink>

              <h1>{{ formatDate(item.modify_time) }}</h1>
            </div>

            <div class="prose prose-lg prose-blue max-w-none">
              <Viewer
                @toggle="() => handleMoreButtonClick(item.id)"
                :emitToggle="true"
                :expandButtonText="'查看更多 >'"
                :value="item.content"
                expand-color="from-white"
              />
            </div>
            <div class="flex items-center justify-end text-sm">
              <button
                @click="() => handleMoreButtonClick(item.id)"
                class="link font-medium px-3 py-1 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                查看全文
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="flex justify-center mt-12" v-if="totalPages > 1">
        <n-pagination v-model:page="currentPage" :page-count="totalPages" :on-update:page="handlePageChange"
                      :page-slot="5" show-quick-jumper>
          <template #prefix>
            {{ currentPage }}/{{ totalPages }}
          </template>
        </n-pagination>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { XCircle } from 'lucide-vue-next'
import { api } from '@/lib/requests'
import Viewer from '@/components/tiptap/viewer/Viewer.vue'

const currentPage = ref(1)
const totalPages = ref(1)
const router = useRouter()
const content = ref<string | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const formatDate = (timestamp: string) => {
  const date = new Date(timestamp)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return '今天'
  } else if (date.toDateString() === yesterday.toDateString()) {
    return '昨天'
  } else {
    return date.toLocaleDateString()
  }
}
const handleMoreButtonClick = (id: number) => {
  router.push({
    name: 'blog',
    params: { id: id.toString() },
  })
}


const fetchContent = async (page: number = 1) => {
  try {
    const query: {
      page: number;
      page_size: number;
    } = {
      page: page,
      page_size: 5,
    }
    loading.value = true
    error.value = null
    const res = await api.get({
      url: '/api/blogs/',
      query,
    })
    content.value = res.content.results.blogs
    totalPages.value = res.content.max_page
  } catch (e) {
    error.value = e instanceof Error ? e.message : '未知错误'
  } finally {
    loading.value = false
  }

}
const handlePageChange = async (page: number) => {
  currentPage.value = page
  await fetchContent(page)
}

onMounted(() => {
  fetchContent()
})
</script>
