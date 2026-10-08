<template>
  <article class="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-zinc-50">
    <div class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 text-sm font-medium text-zinc-600" aria-hidden="true">
      <img
        v-if="teacher.avatar_uuid && !failedAvatars.has(teacher.avatar_uuid)"
        :src="`/api/download/${teacher.avatar_uuid}/`"
        alt=""
        class="h-full w-full object-cover"
        @error="failedAvatars.add(teacher.avatar_uuid)"
      />
      <span v-else>{{ teacher.name.trim().slice(0, 1) || '师' }}</span>
    </div>

    <div class="min-w-0 flex-1">
      <RouterLink
        :to="`/review/teacher/${teacher.id}`"
        class="rounded-sm text-sm font-medium leading-5 text-zinc-950 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
        @click="handleClick"
      >
        <SearchHighlight :text="teacher.name" :highlight-ranges="teacher.name_highlight_ranges" />
      </RouterLink>
      <p class="mt-1 text-xs leading-5 text-zinc-500">{{ teacher.school }}</p>
    </div>
  </article>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import SearchHighlight from '@/components/tinyComponents/SearchHighlight.vue'
import type { TeacherSearchResult } from '@/types/api/search/search'

defineProps<{ teacher: TeacherSearchResult }>()
const emit = defineEmits<{ (event: 'close'): void }>()
const failedAvatars = ref(new Set<string>())

function handleClick(event: MouseEvent) {
  if (event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) emit('close')
}
</script>
