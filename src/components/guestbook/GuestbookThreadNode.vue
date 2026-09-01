<template>
  <div v-if="entry" class="min-w-0 space-y-3">
    <GuestbookEntryCard :entry="entry" :highlighted="focusId === entry.id" :like-pending="pending.has(entry.id)"
      @like="emit('like', $event)" @reply="emit('reply', $event)" @delete="emit('delete', $event)"
      @report="(item, reason) => emit('report', item, reason)" />
    <div v-if="entry.children_count || state.ids.length" :class="level < 3 ? 'ml-2 border-l border-gray-200 pl-2 sm:ml-4 sm:pl-3' : ''">
      <button class="mb-3 text-sm text-blue-700 hover:underline" :aria-expanded="state.expanded" @click="toggle">
        {{ state.expanded ? '折叠本层回复' : `展开 ${entry.children_count} 条回复` }}
      </button>
      <div v-show="state.expanded" class="space-y-3">
        <GuestbookThreadNode v-for="id in state.ids" :key="id" :entry-id="id" :thread="thread" :level="level + 1" :focus-id="focusId" :pending="pending"
          @like="emit('like', $event)" @reply="emit('reply', $event)" @delete="emit('delete', $event)"
          @report="(item, reason) => emit('report', item, reason)" />
        <p v-if="state.loading" class="py-2 text-sm text-gray-500">加载回复中…</p>
        <button v-else-if="state.page < state.maxPage" class="text-sm text-blue-700 hover:underline" @click="load">
          {{ state.page ? '加载更多回复' : '加载回复' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import GuestbookEntryCard from './GuestbookEntryCard.vue'
import type { GuestbookThread } from '@/lib/useGuestbookThread'
import type { GuestbookEntry, APIReportGuestbook } from '@/types/api/guestbook'

defineOptions({ name: 'GuestbookThreadNode' })
const props = defineProps<{ entryId: number; thread: GuestbookThread; level: number; focusId?: number; pending: Set<number> }>()
const emit = defineEmits<{
  (event: 'like' | 'reply' | 'delete', entry: GuestbookEntry): void
  (event: 'report', entry: GuestbookEntry, reason: APIReportGuestbook['query']['reason']): void
}>()
const message = useMessage()
const entry = computed(() => props.thread.entries[props.entryId])
const state = computed(() => props.thread.branch(props.entryId))
const load = async () => {
  try { await props.thread.load(props.entryId) } catch { message.error('获取回复失败，请重试') }
}
const toggle = () => {
  state.value.expanded = !state.value.expanded
  if (state.value.expanded && !state.value.page) void load()
}
onMounted(() => {
  if (state.value.expanded && !state.value.page && entry.value.children_count) void load()
})
</script>
