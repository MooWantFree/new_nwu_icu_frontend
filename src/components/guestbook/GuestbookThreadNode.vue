<template>
  <div class="space-y-3">
    <GuestbookEntryCard
      :entry="entry"
      :show-thread-link="false"
      :highlighted="focusId === entry.id"
      :like-pending="likePending"
      @like="setLike"
      @reply="startReply"
      @delete="remove"
      @report="report"
    />
    <div class="ml-5 border-l border-gray-200 pl-4">
      <p v-if="entry.is_deleted" class="py-3 text-sm text-gray-500">该楼层已删除，不能继续回复。</p>
      <GuestbookComposerModal v-if="replying" :user-id="userId" :parent-id="entry.id" @close="replying = false" @created="replyCreated" />
      <div v-if="loading" class="py-3 text-sm text-gray-500">加载回复中…</div>
      <template v-else-if="replies.length">
        <button class="mb-3 text-sm text-blue-700 hover:underline" @click="expanded = !expanded">{{ expanded ? '折叠本层回复' : `展开 ${replies.length} 条回复` }}</button>
        <div v-if="expanded" class="space-y-3">
          <GuestbookThreadNode
            v-for="reply in replies"
            :key="reply.id"
            :entry="reply"
            :level="level + 1"
            :user-id="userId"
            :focus-id="focusId"
            :open-path="openPath"
            @changed="$emit('changed')"
          />
          <button v-if="hasMore" class="text-sm text-blue-700 hover:underline" @click="loadReplies">加载更多回复</button>
        </div>
      </template>
      <button v-else-if="!loaded && ((entry.reply_count || 0) > 0 || level === 0)" class="mt-3 text-sm text-blue-700 hover:underline" @click="loadReplies">查看回复</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useMessage } from 'naive-ui'

import GuestbookComposerModal from './GuestbookComposerModal.vue'
import GuestbookEntryCard from './GuestbookEntryCard.vue'
import { api } from '@/lib/requests'
import type { GuestbookEntry } from '@/types/api/guestbook'

defineOptions({ name: 'GuestbookThreadNode' })
const props = defineProps<{ entry: GuestbookEntry; level: number; userId: number; focusId?: number; openPath: number[] }>()
const emit = defineEmits<{ (event: 'changed'): void }>()
const message = useMessage()
const replies = ref<GuestbookEntry[]>([])
const page = ref(1)
const hasMore = ref(false)
const loading = ref(false)
const loaded = ref(false)
const expanded = ref(props.level === 0 || props.openPath.includes(props.entry.id))
const replying = ref(false)
const likePending = ref(false)

const loadReplies = async () => {
  if (loading.value) return
  loading.value = true
  try {
    const response = await api.get({ url: '/api/guestbook/:id/replies/', params: { id: props.entry.id }, query: { page: page.value, pageSize: 10 } })
    if (response.status !== 200) throw new Error('获取回复失败')
    replies.value.push(...response.content.results)
    hasMore.value = page.value < response.content.max_page
    page.value += 1
    loaded.value = true
    expanded.value = true
  } catch (error) {
    message.error(error instanceof Error ? error.message : '获取回复失败')
  } finally {
    loading.value = false
  }
}

const startReply = () => { replying.value = true }
const replyCreated = (entry: GuestbookEntry) => {
  replies.value.push(entry)
  replying.value = false
  expanded.value = true
  emit('changed')
}
const setLike = async (entry: GuestbookEntry) => {
  likePending.value = true
  try {
    const response = await api.put({ url: '/api/guestbook/:id/like/', params: { id: entry.id }, query: { liked: !entry.liked_by_me } })
    if (response.status !== 200) throw new Error('点赞失败')
    entry.liked_by_me = response.content.liked
    entry.like_count = response.content.like_count
  } catch {
    message.error('点赞失败，请稍后重试')
  } finally {
    likePending.value = false
  }
}
const remove = async (entry: GuestbookEntry) => {
  const response = await api.delete({ url: '/api/guestbook/:id/', params: { id: entry.id } })
  if (response.status === 200) {
    entry.is_deleted = true
    entry.content = '[内容已删除]'
    emit('changed')
  } else message.error('删除失败，请稍后重试')
}
const report = async (entry: GuestbookEntry, reason: 'spam' | 'abuse' | 'privacy' | 'other') => {
  const detail = reason === 'other' ? (prompt('请补充举报说明（可选，最多 500 字）：') || '') : ''
  const response = await api.post({ url: '/api/guestbook/:id/reports/', params: { id: entry.id }, query: { reason, detail } })
  if (response.status < 300) message.success(response.content.created ? '举报已提交' : '你已经举报过此内容')
  else message.error('举报失败，请稍后重试')
}

onMounted(() => { if (expanded.value && !loaded.value) void loadReplies() })
</script>
