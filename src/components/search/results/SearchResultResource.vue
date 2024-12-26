<template>
  <!-- Resource card with hover effect and shadow -->
  <div
    class="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
  >
    <!-- Resource name and type section -->
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-lg font-semibold text-blue-600 truncate mr-2">
        {{ resource.name }}
      </h3>
      <!-- File type badge -->
      <span class="px-2 py-1 text-xs rounded bg-gray-100 text-gray-600">
        {{ resource.type }}
      </span>
    </div>

    <!-- Resource details -->
    <div class="text-sm text-gray-600 space-y-2">
      <!-- File size with formatted display -->
      <p class="flex items-center">
        <span class="mr-2">📁</span>
        {{ formatFileSize(resource.size) }}
      </p>
      
      <!-- Download button -->
      <a
        :href="resource.url"
        target="_blank"
        class="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
      >
        <span class="mr-2">⬇️</span>
        下载资源
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
// Import the ResourceSearchResult type for type checking
import { ResourceSearchResult } from '@/types/api/search/search'

// Define props with TypeScript type
defineProps<{
  resource: ResourceSearchResult
}>()

// Utility function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}
</script>
