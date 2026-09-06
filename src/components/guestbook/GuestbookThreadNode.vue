<template>
  <div v-if="entry" class="min-w-0">
    <div v-if="!state.collapsed" class="flex min-w-0 items-stretch">
      <button type="button"
        class="group relative min-h-6 w-5 shrink-0 cursor-pointer self-stretch focus-visible:outline-none"
        aria-label="折叠这条回复" :aria-expanded="true" @click="toggleCollapsed">
        <span aria-hidden="true"
          class="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gray-200 transition-colors group-hover:bg-gray-400 group-focus-visible:bg-blue-600" />
      </button>
      <div class="min-w-0 flex-1 space-y-3 pl-1 sm:pl-2">
        <GuestbookEntryCard :entry="entry" :highlighted="focusId === entry.id" :like-pending="pending.has(entry.id)" :board="board"
          @like="emit('like', $event)" @reply="emit('reply', $event)" @delete="emit('delete', $event)"
          @report="(item, reason) => emit('report', item, reason)" />
        <GuestbookReplyComposer v-if="replyTargetId === entry.id && replyUserId" :user-id="replyUserId" :parent="entry" :board="board"
          @close="emit('cancelReply')" @created="emit('replyCreated', $event)" />
        <div v-if="entry.children_count || state.ids.length" class="space-y-3">
          <GuestbookThreadNode v-for="id in state.ids" :key="id" :entry-id="id" :thread="thread" :level="level + 1" :focus-id="focusId" :pending="pending"
            :reply-target-id="replyTargetId" :reply-user-id="replyUserId" :board="board"
            @like="emit('like', $event)" @reply="emit('reply', $event)" @delete="emit('delete', $event)"
            @report="(item, reason) => emit('report', item, reason)" @cancel-reply="emit('cancelReply')"
            @reply-created="emit('replyCreated', $event)" />
          <p v-if="state.loading" class="py-2 text-sm text-gray-500">加载回复中…</p>
          <button v-else-if="state.page < state.maxPage" class="text-sm text-blue-700 hover:underline" @click="load">
            {{ state.page ? '加载更多回复' : '加载回复' }}
          </button>
        </div>
      </div>
    </div>
    <div v-else class="flex min-h-8 min-w-0 items-center gap-2 py-1 text-sm">
      <button type="button" class="shrink-0 rounded-full text-gray-700 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        aria-label="展开这条回复" :aria-expanded="false" @click="toggleCollapsed">
        <CirclePlus class="h-5 w-5" aria-hidden="true" />
      </button>
      <RouterLink v-if="entry.author.id" :to="`/user/${entry.author.id}`" class="truncate font-semibold text-blue-700 hover:underline">
        {{ entry.author.nickname }}
      </RouterLink>
      <span v-else class="truncate font-semibold text-gray-700">{{ entry.author.nickname }}</span>
      <span aria-hidden="true" class="text-gray-400">·</span>
      <Time :time="entry.created_at" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMessage } from 'naive-ui'
import { CirclePlus } from 'lucide-vue-next'
import GuestbookEntryCard from './GuestbookEntryCard.vue'
import GuestbookReplyComposer from './GuestbookReplyComposer.vue'
import Time from '@/components/tinyComponents/Time.vue'
import type { GuestbookThread } from '@/lib/useGuestbookThread'
import type { DiscussionBoard, GuestbookEntry, APIReportGuestbook } from '@/types/api/guestbook'

defineOptions({ name: 'GuestbookThreadNode' })
const props = defineProps<{
  entryId: number
  thread: GuestbookThread
  level: number
  focusId?: number
  pending: Set<number>
  replyTargetId?: number | null
  replyUserId?: number
  board?: DiscussionBoard
}>()
const emit = defineEmits<{
  (event: 'like' | 'reply' | 'delete', entry: GuestbookEntry): void
  (event: 'report', entry: GuestbookEntry, reason: APIReportGuestbook['query']['reason']): void
  (event: 'cancelReply'): void
  (event: 'replyCreated', entry: GuestbookEntry): void
}>()
const message = useMessage()
const entry = computed(() => props.thread.entries[props.entryId])
const state = computed(() => props.thread.branch(props.entryId))
const load = async () => {
  try { await props.thread.load(props.entryId) } catch { message.error('获取回复失败，请重试') }
}
const toggleCollapsed = () => {
  state.value.collapsed = !state.value.collapsed
  if (!state.value.collapsed && !state.value.page && entry.value.children_count) void load()
}
</script>
