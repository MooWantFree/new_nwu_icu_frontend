<template>
  <div class="space-y-4" :aria-label="`正在加载${itemLabel}`" aria-busy="true" role="status">
    <article v-for="index in 3" :key="index" class="animate-pulse rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div v-if="board === 'announcements'" class="relative">
        <div class="absolute right-0 top-0 h-3 w-14 rounded bg-slate-100" />
        <div class="mx-auto h-7 w-2/5 min-w-28 rounded bg-slate-200" />
        <div class="mx-auto mt-2 h-4 w-20 rounded bg-slate-100" />
        <div class="mt-5 space-y-2">
          <div class="h-4 w-full rounded bg-slate-100" />
          <div class="h-4 w-4/5 rounded bg-slate-100" />
        </div>
      </div>

      <div v-else class="flex gap-3">
        <div class="h-10 w-10 shrink-0 rounded-full bg-slate-200" />
        <div class="min-w-0 flex-1">
          <div class="flex items-start justify-between gap-3">
            <div class="h-4 w-24 rounded bg-slate-200" />
            <div class="h-3 w-14 rounded bg-slate-100" />
          </div>
          <div class="mt-4 space-y-2">
            <div class="h-4 w-full rounded bg-slate-100" />
            <div class="h-4 w-4/5 rounded bg-slate-100" />
          </div>
        </div>
      </div>

      <div class="mt-4 flex items-center gap-3">
        <div class="h-4 w-10 rounded bg-slate-100" />
        <div class="h-4 w-12 rounded bg-slate-100" />
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DiscussionBoard } from '@/types/api/guestbook'

const props = defineProps<{ board: DiscussionBoard }>()
const itemLabel = computed(() => props.board === 'announcements' ? '公告' : '留言')
</script>
