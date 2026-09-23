<!--
  About.vue - About page component
  This component displays the about page content fetched from the API
  Features:
  - Responsive layout
  - Content skeleton while loading
  - Error handling
  - Safe rich text rendering shared with announcements
-->
<template>
  <div class="py-12 px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-6rem-22px)] bg-gray-100">
    <div class="max-w-4xl mx-auto">
      <div class="bg-white rounded-xl shadow-lg overflow-hidden">
        <div class="p-8">
          <h1 class="mb-8 text-3xl font-bold text-gray-900">关于本站</h1>
          <div v-if="loading" class="min-h-40 space-y-4 motion-safe:animate-pulse" role="status" aria-label="正在加载关于本站">
            <span class="sr-only">正在加载关于本站</span>
            <div class="h-4 w-full rounded bg-gray-200" aria-hidden="true" />
            <div class="h-4 w-11/12 rounded bg-gray-200" aria-hidden="true" />
            <div class="h-4 w-4/5 rounded bg-gray-200" aria-hidden="true" />
            <div class="h-4 w-2/3 rounded bg-gray-200" aria-hidden="true" />
          </div>
          <div v-else-if="error" class="py-8 text-center" role="alert">
            <XCircle class="w-12 h-12 mx-auto mb-4 text-red-500" />
            <p class="mb-2 text-lg font-semibold text-gray-900">加载失败</p>
            <p class="text-gray-600 mb-6">{{ error }}</p>
            <button
              @click="fetchContent"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              重试
            </button>
          </div>
          <div v-else-if="content?.trim()" class="about-content break-words text-gray-700" v-html="sanitizeAnnouncementHtml(content || '')" />
          <p v-else class="text-gray-500">内容正在完善。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { XCircle } from 'lucide-vue-next'
import { api } from '@/lib/requests'
import { sanitizeAnnouncementHtml } from '@/lib/guestbook'

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
    if (res.status !== 200) throw new Error('关于本站加载失败，请稍后重试。')
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

<style scoped>
.about-content :deep(p) { margin: 0 0 0.75rem; }
.about-content :deep(p:last-child) { margin-bottom: 0; }
.about-content :deep(a) { color: #1d4ed8; text-decoration: underline; text-underline-offset: 0.2em; }
.about-content :deep(img) { display: block; height: auto; margin: 0.75rem auto; max-width: 100%; border-radius: 0.5rem; }
.about-content :deep(img[data-size="25"]) { width: 25%; }
.about-content :deep(img[data-size="50"]) { width: 50%; }
.about-content :deep(img[data-size="75"]) { width: 75%; }
.about-content :deep(img[data-size="100"]) { width: 100%; }
</style>
