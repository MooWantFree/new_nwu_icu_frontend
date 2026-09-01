<template>
  <article :id="`guestbook-${entry.id}`" class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm" :class="{ 'ring-2 ring-blue-300': highlighted }">
    <div class="flex gap-3">
      <img v-if="entry.anonymous" :src="`/api/download/${entry.author.avatar}/`" alt="匿名用户头像" class="h-10 w-10 rounded-full border border-gray-200" />
      <UserAvatar v-else :avatar="entry.author.avatar" :uuid="entry.author.uuid" :has-avatar="entry.author.has_avatar" class="h-10 w-10 rounded-full" />
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
          <RouterLink v-if="entry.author.id" :to="`/user/${entry.author.id}`" class="font-semibold text-blue-700 hover:underline">{{ entry.author.nickname }}</RouterLink>
          <span v-else class="font-semibold text-gray-700">{{ entry.author.nickname }}</span>
          <Time :time="entry.created_at" class="text-xs text-gray-500" />
          <span v-if="entry.is_deleted" class="text-xs text-gray-400">已删除</span>
        </div>
        <div class="guestbook-content mt-3 break-words text-gray-800" v-html="sanitizeGuestbookHtml(entry.content)" />
        <div class="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-600">
          <button v-if="!entry.is_deleted" :disabled="likePending" :aria-pressed="entry.liked_by_me" aria-label="点赞" class="inline-flex items-center gap-1 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50" :class="{ 'text-blue-700': entry.liked_by_me }" @click="$emit('like', entry)">
            <ThumbsUp class="h-4 w-4" /> {{ entry.like_count }}
          </button>
          <button v-if="!entry.is_deleted" :disabled="likePending" class="inline-flex items-center gap-1 hover:text-blue-700" @click="$emit('reply', entry)"><MessageCircle class="h-4 w-4" /> 回复</button>
          <RouterLink v-if="showThreadLink" :to="`/guestbook/${entry.root_id ?? entry.id}`" class="inline-flex items-center gap-1 hover:text-blue-700"><MessagesSquare class="h-4 w-4" /> {{ entry.reply_count || 0 }} 条回复</RouterLink>
          <button v-if="!entry.is_deleted" :disabled="likePending" class="ml-auto text-gray-400 hover:text-red-600" @click="showReport = !showReport">举报</button>
          <button v-if="entry.is_me && !entry.is_deleted" :disabled="likePending" class="text-gray-400 hover:text-red-600" @click="remove">删除</button>
        </div>
        <div v-if="showReport && !entry.is_deleted" class="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-gray-50 p-3 text-sm">
          <span class="text-gray-600">举报原因：</span>
          <button v-for="reason in reportReasons" :key="reason.value" class="rounded border border-gray-300 px-2 py-1 hover:border-red-400 hover:text-red-600" @click="report(reason.value)">{{ reason.label }}</button>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { MessageCircle, MessagesSquare, ThumbsUp } from 'lucide-vue-next'
import UserAvatar from '@/components/common/UserAvatar.vue'
import Time from '@/components/tinyComponents/Time.vue'
import { sanitizeGuestbookHtml } from '@/lib/guestbook'
import type { GuestbookEntry } from '@/types/api/guestbook'

const props = defineProps<{ entry: GuestbookEntry; showThreadLink?: boolean; highlighted?: boolean; likePending?: boolean }>()
const emit = defineEmits<{
  (event: 'like', entry: GuestbookEntry): void
  (event: 'reply', entry: GuestbookEntry): void
  (event: 'delete', entry: GuestbookEntry): void
  (event: 'report', entry: GuestbookEntry, reason: 'spam' | 'abuse' | 'privacy' | 'other'): void
}>()
const showReport = ref(false)
const reportReasons = [
  { label: '垃圾广告', value: 'spam' as const }, { label: '攻击辱骂', value: 'abuse' as const },
  { label: '泄露隐私', value: 'privacy' as const }, { label: '其他', value: 'other' as const },
]
const remove = () => {
  if (confirm('删除后其他用户将看到“内容已删除”，但下级回复会保留。确定删除吗？')) {
    emit('delete', props.entry)
  }
}
const report = (reason: 'spam' | 'abuse' | 'privacy' | 'other') => {
  emit('report', props.entry, reason)
  showReport.value = false
}
</script>

<style>
.guestbook-content p { margin: 0 0 0.5rem; }
.guestbook-content p:last-child { margin-bottom: 0; }
</style>
