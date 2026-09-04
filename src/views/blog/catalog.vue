<template>
  <AppPageLayout title="公告">
    <div
      v-if="loading"
      class="surface-card flex min-h-64 flex-col items-center justify-center p-8"
    >
      <div
        class="w-16 h-16 mx-auto mb-4 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"
      />
      <p class="text-center text-gray-600">加载中...</p>
    </div>

    <div
      v-else-if="error"
      class="surface-card flex min-h-64 flex-col items-center justify-center p-8 text-center"
    >
      <XCircle class="w-16 h-16 mx-auto mb-4 text-red-500" />
      <p class="mb-4 text-lg font-semibold text-gray-900">加载失败</p>
      <p class="text-gray-600 mb-6">{{ error }}</p>
      <button
        @click="() => fetchContent()"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
      >
        重试
      </button>
    </div>

    <template v-else>
      <div v-for="item in content" :key="item.id" class="py-2 first:pt-0">
        <article class="surface-card overflow-hidden p-6 sm:p-8">
          <div class="mb-2 flex flex-wrap items-start justify-between gap-3">
            <RouterLink
              :to="`/blog/${item.id}`"
              class="text-2xl font-bold text-gray-900 transition-colors hover:text-blue-700"
            >
              {{ item.title }}
            </RouterLink>
            <time class="shrink-0 text-sm text-gray-500" :datetime="item.modify_time">
              {{ formatDate(item.modify_time) }}
            </time>
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
              class="link rounded-full bg-gray-50 px-3 py-1 font-medium transition-colors hover:bg-gray-100"
            >
              查看全文
            </button>
          </div>
        </article>
      </div>

      <div v-if="totalPages > 1" class="mt-12 flex justify-center">
        <n-pagination
          v-model:page="currentPage"
          :page-count="totalPages"
          :on-update:page="handlePageChange"
          :page-slot="5"
          show-quick-jumper
        >
          <template #prefix>
            {{ currentPage }}/{{ totalPages }}
          </template>
        </n-pagination>
      </div>
    </template>
  </AppPageLayout>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { XCircle } from 'lucide-vue-next'
import { api } from '@/lib/requests'
import Viewer from '@/components/tiptap/viewer/Viewer.vue'
import AppPageLayout from '@/components/layout/AppPageLayout.vue'

const currentPage = ref(1)
const totalPages = ref(1)
const router = useRouter()
type Blog = import('@/types/api/text/text').APITos['response']['results']['blogs'][number]
const content = ref<Blog[]>([])
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
