<template>
  <article :id="`guestbook-${entry.id}`" class="rounded-xl border bg-white shadow-sm"
    :class="[
      isAnnouncement ? ['announcement-entry border-zinc-200', isAnnouncementRoot ? 'px-5 py-5 sm:px-6' : 'p-4 sm:p-5'] : 'border-gray-200 p-4',
      highlighted ? isAnnouncement ? 'ring-2 ring-zinc-300' : 'ring-2 ring-blue-300' : '',
    ]">
    <div class="flex gap-3">
      <template v-if="showAvatar">
        <img v-if="entry.anonymous" :src="`/api/download/${entry.author.avatar}/`" alt="匿名用户头像" class="h-10 w-10 rounded-full border" :class="isAnnouncement ? 'shrink-0 border-zinc-200' : 'border-gray-200'" />
        <UserAvatar v-else :avatar="entry.author.avatar" :uuid="entry.author.uuid" :has-avatar="entry.author.has_avatar" class="h-10 w-10 rounded-full" :class="{ 'shrink-0': isAnnouncement }" />
      </template>
      <div class="min-w-0 flex-1">
        <div v-if="isAnnouncementRoot">
          <h2 class="break-words text-xl font-semibold leading-snug tracking-tight text-zinc-950">
            <RouterLink v-if="linkTitle" :to="`/announcements/${entry.id}`" class="rounded-sm hover:underline hover:underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400">{{ entry.title || '公告' }}</RouterLink>
            <template v-else>{{ entry.title || '公告' }}</template>
          </h2>
          <div class="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
            <RouterLink v-if="entry.author.id" :to="`/user/${entry.author.id}`" class="min-w-0 break-words rounded-sm hover:text-zinc-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400">{{ entry.author.nickname }}</RouterLink>
            <span v-else class="min-w-0 break-words">{{ entry.author.nickname }}</span>
            <span aria-hidden="true" class="text-zinc-300">·</span>
            <span class="inline-flex items-center gap-1">更新于 <Time :time="entry.updated_at" /></span>
            <span v-if="entry.is_deleted" class="text-xs">已删除</span>
          </div>
        </div>
        <div v-else class="flex items-start justify-between gap-3" :class="{ 'flex-wrap': isAnnouncement }">
          <div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <RouterLink v-if="entry.author.id" :to="`/user/${entry.author.id}`" class="font-semibold hover:underline" :class="isAnnouncement ? 'break-words rounded-sm text-sm text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400' : 'truncate text-blue-700'">{{ entry.author.nickname }}</RouterLink>
            <span v-else class="font-semibold" :class="isAnnouncement ? 'break-words text-sm text-zinc-700' : 'truncate text-gray-700'">{{ entry.author.nickname }}</span>
            <span v-if="entry.is_deleted" class="text-xs" :class="isAnnouncement ? 'text-zinc-500' : 'text-gray-400'">已删除</span>
          </div>
          <Time :time="entry.created_at" class="shrink-0" />
        </div>
        <div class="guestbook-content break-words" :class="isAnnouncement ? 'mt-5 text-sm leading-7 text-zinc-700' : 'mt-3 text-gray-700'" v-html="isAnnouncementRoot ? sanitizeAnnouncementHtml(entry.content) : sanitizeGuestbookHtml(entry.content)" />
        <div class="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 text-sm" :class="isAnnouncement ? 'mt-5 border-t border-zinc-100 pt-3 text-zinc-500' : 'mt-4 text-gray-600'">
          <div class="flex flex-wrap items-center" :class="isAnnouncement ? 'gap-1' : 'gap-3'">
            <button v-if="!entry.is_deleted" type="button" :disabled="likePending" :aria-pressed="entry.liked_by_me" aria-label="点赞" class="inline-flex items-center gap-1 disabled:cursor-not-allowed disabled:opacity-50" :class="[actionClass, entry.liked_by_me ? isAnnouncement ? 'bg-zinc-100 text-zinc-950' : 'text-blue-700' : '']" @click="$emit('like', entry)">
              <ThumbsUp class="h-4 w-4" aria-hidden="true" /> {{ entry.like_count }}
            </button>
            <button v-if="!entry.is_deleted" type="button" :disabled="likePending" class="inline-flex items-center gap-1" :class="actionClass" @click="$emit('reply', entry)"><MessageCircle class="h-4 w-4" aria-hidden="true" /> 回复</button>
            <span v-if="entry.parent_id === null && (entry.reply_count || 0) > 0" class="inline-flex items-center gap-1" :class="{ 'px-2 text-xs': isAnnouncement }"><MessagesSquare class="h-4 w-4" aria-hidden="true" /> {{ entry.reply_count }} 条回复</span>
          </div>
          <div class="ml-auto flex items-center" :class="isAnnouncement ? 'gap-1' : 'gap-3'">
            <button v-if="!entry.is_deleted && (board !== 'announcements' || entry.parent_id !== null)" type="button" :disabled="likePending" :aria-expanded="showReport" :aria-controls="`guestbook-report-${entry.id}`" :class="isAnnouncement ? actionClass : 'text-gray-400 hover:text-red-600'" @click="showReport = !showReport">举报</button>
            <button v-if="entry.is_me && !entry.is_deleted && !isAnnouncementRoot" type="button" :disabled="likePending || confirmPending" :class="isAnnouncement ? 'h-8 rounded-md px-2 text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:cursor-not-allowed disabled:opacity-50' : 'text-gray-400 hover:text-red-600'" @click="remove">删除</button>
          </div>
        </div>
        <div v-if="showReport && !entry.is_deleted" :id="`guestbook-report-${entry.id}`" class="mt-3 flex flex-wrap items-center gap-2 rounded-lg p-3 text-sm" :class="isAnnouncement ? 'border border-zinc-200 bg-zinc-50' : 'bg-gray-50'">
          <span :class="isAnnouncement ? 'text-zinc-500' : 'text-gray-600'">举报原因：</span>
          <button v-for="reason in reportReasons" :key="reason.value" type="button" class="rounded border px-2 py-1" :class="isAnnouncement ? 'border-zinc-200 bg-white text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400' : 'border-gray-300 hover:border-red-400 hover:text-red-600'" @click="report(reason.value)">{{ reason.label }}</button>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { MessageCircle, MessagesSquare, ThumbsUp } from 'lucide-vue-next'
import UserAvatar from '@/components/common/UserAvatar.vue'
import Time from '@/components/tinyComponents/Time.vue'
import { sanitizeAnnouncementHtml, sanitizeGuestbookHtml } from '@/lib/guestbook'
import { useShadcnDialog } from '@/lib/useShadcnDialog'
import type { DiscussionBoard, GuestbookEntry } from '@/types/api/guestbook'

const props = withDefaults(defineProps<{ entry: GuestbookEntry; highlighted?: boolean; likePending?: boolean; board?: DiscussionBoard; linkTitle?: boolean }>(), { board: 'guestbook', linkTitle: false })
const emit = defineEmits<{
  (event: 'like', entry: GuestbookEntry): void
  (event: 'reply', entry: GuestbookEntry): void
  (event: 'delete', entry: GuestbookEntry): void
  (event: 'report', entry: GuestbookEntry, reason: 'spam' | 'abuse' | 'privacy' | 'other'): void
}>()
const showReport = ref(false)
const confirmPending = ref(false)
const dialog = useShadcnDialog()
let disposed = false
onBeforeUnmount(() => { disposed = true })
const isAnnouncement = computed(() => props.board === 'announcements')
const isAnnouncementRoot = computed(() => isAnnouncement.value && props.entry.parent_id === null)
const showAvatar = computed(() => !isAnnouncementRoot.value)
const actionClass = computed(() => isAnnouncement.value
  ? 'h-8 rounded-md px-2 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50'
  : 'hover:text-blue-700')
const reportReasons = [
  { label: '垃圾广告', value: 'spam' as const }, { label: '攻击辱骂', value: 'abuse' as const },
  { label: '泄露隐私', value: 'privacy' as const }, { label: '其他', value: 'other' as const },
]
const remove = async () => {
  if (confirmPending.value || props.likePending) return
  if (!isAnnouncement.value) {
    if (confirm('删除后其他用户将看到“内容已删除”，但下级回复会保留。确定删除吗？')) emit('delete', props.entry)
    return
  }
  const entry = props.entry
  confirmPending.value = true
  try {
    const confirmed = await dialog.confirm({
      title: '删除回复',
      description: '删除后其他用户将看到“内容已删除”，下级回复会保留。',
      confirmText: '删除回复',
      cancelText: '取消',
      destructive: true,
    })
    if (confirmed && !disposed && isAnnouncement.value && props.entry.id === entry.id && !props.entry.is_deleted) emit('delete', entry)
  } finally {
    confirmPending.value = false
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
.guestbook-content a { color: #1d4ed8; text-decoration: underline; text-underline-offset: 0.2em; }
.guestbook-content img { display: block; height: auto; margin: 0.75rem auto; max-width: 100%; border-radius: 0.5rem; }
.guestbook-content img[data-size="25"] { width: 25%; }
.guestbook-content img[data-size="50"] { width: 50%; }
.guestbook-content img[data-size="75"] { width: 75%; }
.guestbook-content img[data-size="100"] { width: 100%; }
article.announcement-entry .guestbook-content a { color: #18181b; }
article.announcement-entry .app-time { color: #71717a; }
article.announcement-entry .app-time:hover { color: #18181b; }
</style>
