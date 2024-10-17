<template>
  <div v-if="!content" class="flex items-center justify-center h-screen bg-gray-100">
    <div class="p-8 bg-white rounded-lg shadow-md">
      <div class="w-16 h-16 mx-auto mb-4 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
      <p class="text-center text-gray-600">加载中...</p>
    </div>
  </div>
  <div v-else class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      <div class="p-8">
        <h1 class="text-3xl font-bold text-gray-800 mb-6">关于我们</h1>
        <div class="prose prose-lg prose-indigo max-w-none">
          <Viewer :value="content" :need-expand="false" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Viewer from '@/components/tiptap/viewer/Viewer.vue'
import { api } from '@/lib/requests'
import { AboutResponse } from '@/types/api/texts'
import { ref, onMounted } from 'vue'

const content = ref<string | null>(null)

onMounted(async () => {
  const res = await api.get<AboutResponse>('/api/about/')
  content.value = res.content.about
})
</script>