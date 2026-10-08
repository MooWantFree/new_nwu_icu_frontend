<template>
  <div class="space-y-4" :aria-label="`正在加载${itemLabel}`" aria-busy="true" role="status">
    <article v-for="index in count" :key="index" class="rounded-xl border bg-white shadow-sm" :class="board === 'announcements' ? 'motion-safe:animate-pulse border-zinc-200 px-5 py-5 sm:px-6' : 'animate-pulse border-gray-200 p-4'">
      <div v-if="board === 'announcements'">
        <div class="h-6 w-2/3 rounded bg-zinc-200" />
        <div class="mt-3 flex flex-wrap items-center gap-2">
          <div class="h-3 w-20 rounded bg-zinc-100" />
          <div class="h-3 w-24 rounded bg-zinc-100" />
        </div>
        <div class="mt-5 space-y-2">
          <div class="h-4 w-full rounded bg-zinc-100" />
          <div class="h-4 w-4/5 rounded bg-zinc-100" />
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

      <div class="flex items-center gap-3" :class="board === 'announcements' ? 'mt-5 border-t border-zinc-100 pt-4' : 'mt-4'">
        <div :class="board === 'announcements' ? 'h-8 w-12 rounded-md bg-zinc-100' : 'h-4 w-10 rounded bg-slate-100'" />
        <div :class="board === 'announcements' ? 'h-8 w-12 rounded-md bg-zinc-100' : 'h-4 w-12 rounded bg-slate-100'" />
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DiscussionBoard } from '@/types/api/guestbook'

const props = withDefaults(defineProps<{ board: DiscussionBoard; count?: number }>(), { count: 3 })
const itemLabel = computed(() => props.board === 'announcements' ? '公告' : '留言')
</script>
