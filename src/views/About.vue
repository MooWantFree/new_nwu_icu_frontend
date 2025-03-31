<!--
  About.vue - About page component
  This component displays the about page content fetched from the API
  Features:
  - Responsive layout
  - Loading state with animation
  - Error handling
  - Markdown content rendering using Tiptap viewer
-->
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
      <div class="bg-white rounded-xl shadow-lg overflow-hidden">
        <div class="p-8">
          <h1 class="text-3xl font-bold text-gray-800 mb-8">关于我们</h1>
          <div class="prose prose-lg prose-blue max-w-none">
            <Viewer :value="content!" :need-expand="false" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { XCircle } from 'lucide-vue-next'
import { api } from '@/lib/requests'
import Viewer from '@/components/tiptap/viewer/Viewer.vue'

// State management
const content = ref<string | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

// Fetch about page content from API
const fetchContent = async () => {
  try {
    loading.value = true
    error.value = null
    const res = await api.get({
      url: '/api/about/'
    })
    content.value = res.content.about
  } catch (e) {
    error.value = e instanceof Error ? e.message : '未知错误'
  } finally {
    loading.value = false
  }
}

// Initialize component
onMounted(() => {
  fetchContent()
})
</script>
