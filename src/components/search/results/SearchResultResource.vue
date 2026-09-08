<template>
  <!-- Resource card with hover effect and shadow -->
  <div class="bg-white rounded-lg shadow-md p-4">
    <!-- Resource name and type section -->
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-lg font-semibold text-blue-700 truncate mr-2">
        <RouterLink :to="safeResourceUrl" class="hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500" @click="handleClick">{{ resource.name }}</RouterLink>
      </h3>
      <!-- File type badge -->
      <span class="px-2 py-1 text-xs rounded bg-gray-100 text-gray-600">
        {{ resource.type === 'file' ? '文件' : '文件夹' }}
      </span>
    </div>

    <p class="break-all text-xs text-gray-500">所在目录：{{ resource.path || '/' }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ResourceSearchResult } from '@/types/api/search/search'
import { resourcePageUrl } from '@/lib/resourceBrowser'

// Define props with TypeScript type
const props = defineProps<{
  resource: ResourceSearchResult
}>()
const emit = defineEmits<{ (event: 'close'): void }>()
function handleClick(event: MouseEvent) {
  if (event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) emit('close')
}

const safeResourceUrl = computed(() => {
  const path = `${props.resource.path.replace(/\/+$/, '')}/${props.resource.name}`
  return resourcePageUrl(path)
})

</script>
