<template>
  <article class="flex gap-3 px-4 py-4 transition-colors hover:bg-zinc-50">
    <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500" aria-hidden="true">
      <File v-if="resource.type === 'file'" class="h-4 w-4" />
      <Folder v-else class="h-4 w-4" />
    </div>

    <div class="min-w-0 flex-1">
      <div class="flex items-start justify-between gap-3">
        <RouterLink
          :to="safeResourceUrl"
          class="break-all rounded-sm text-sm font-medium leading-5 text-zinc-950 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
          @click="handleClick"
        >{{ resource.name }}</RouterLink>
        <span class="shrink-0 rounded-md border border-zinc-200 px-1.5 py-0.5 text-xs text-zinc-500">
          {{ resource.type === 'file' ? '文件' : '文件夹' }}
        </span>
      </div>
      <p class="mt-1 break-all text-xs leading-5 text-zinc-500">所在目录：{{ resource.path || '/' }}</p>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { File, Folder } from 'lucide-vue-next'
import type { ResourceSearchResult } from '@/types/api/search/search'
import { resourcePageUrl } from '@/lib/resourceBrowser'

const props = defineProps<{ resource: ResourceSearchResult }>()
const emit = defineEmits<{ (event: 'close'): void }>()

function handleClick(event: MouseEvent) {
  if (event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) emit('close')
}

const safeResourceUrl = computed(() => {
  const path = `${props.resource.path.replace(/\/+$/, '')}/${props.resource.name}`
  return resourcePageUrl(path)
})
</script>
