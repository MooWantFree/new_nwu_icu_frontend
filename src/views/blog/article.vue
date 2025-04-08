<template>
  <!-- Loading state -->
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

  <!-- Error state -->
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

  <!-- Content -->
  <div v-else class="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gray-100">
    <div class="max-w-4xl mx-auto">
      <div class="flex justify-center w-full mb-4">
        <h1 class="text-2xl font-bold text-gray-800">{{ content.title }}</h1>
      </div>
      <div class="flex justify-end mb-4">
        <h1 class="text-base text-gray-600">最后修改于: {{ formatDate(content.modify_time) }}</h1>
      </div>

      <div class="py-2">
        <div class="bg-white rounded-xl shadow-lg overflow-hidden">
          <div class="p-8">

            <div class="prose prose-lg prose-blue max-w-none">
              <Viewer
                :value="content.content"
                :need-expand="false"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { XCircle } from 'lucide-vue-next'
import { api } from '@/lib/requests'
import Viewer from '@/components/tiptap/viewer/Viewer.vue'

const route = useRoute()
const router = useRouter()

const content = ref<string | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)


const fetchContent = async () => {
  try {
    loading.value = true
    error.value = null
    const res = await api.get({
      url: `/api/blogs/${route.params.id}`,
    })
    content.value = res.content.results.blogs[0]
    document.title = `${content.value.title} | NWU.ICU`
  } catch (e) {
    error.value = e instanceof Error ? e.message : '未知错误'
  } finally {
    loading.value = false
  }
}
const formatDate = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleDateString()
}
// Initialize component
onMounted(() => {
  fetchContent()
})
</script>
