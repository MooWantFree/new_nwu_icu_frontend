<template>
  <div v-if="loading" class="divide-y divide-slate-200" aria-label="正在加载留言">
    <div v-for="index in 3" :key="index" class="animate-pulse px-5 py-5 sm:px-6">
      <div class="flex gap-3">
        <div class="h-10 w-10 shrink-0 rounded-full bg-slate-200" />
        <div class="min-w-0 flex-1 space-y-3">
          <div class="flex justify-between gap-3">
            <div class="h-4 w-24 rounded bg-slate-200" />
            <div class="h-4 w-14 rounded bg-slate-100" />
          </div>
          <div class="h-4 rounded bg-slate-100" />
          <div class="h-4 w-4/5 rounded bg-slate-100" />
        </div>
      </div>
    </div>
  </div>

  <div v-else-if="entries.length" class="divide-y divide-slate-200">
    <RouterLink
      v-for="entry in entries"
      :key="entry.id"
      :to="`/guestbook/${entry.id}`"
      class="block px-5 py-5 transition-colors hover:bg-blue-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 sm:px-6"
    >
      <div class="flex gap-3">
        <img
          v-if="entry.anonymous"
          :src="`/api/download/${entry.author.avatar}/`"
          alt="匿名用户头像"
          class="h-10 w-10 shrink-0 rounded-full object-cover"
        />
        <UserAvatar
          v-else
          :avatar="entry.author.avatar"
          :uuid="entry.author.uuid"
          :has-avatar="entry.author.has_avatar"
          :alt="entry.author.nickname"
          class="h-10 w-10 shrink-0 rounded-full object-cover"
        />

        <div class="min-w-0 flex-1">
          <div class="flex items-start justify-between gap-3">
            <span class="truncate text-sm font-semibold text-slate-800">{{ entry.author.nickname }}</span>
            <Time :time="entry.created_at" class="shrink-0 whitespace-nowrap" />
          </div>
          <p class="mt-2 line-clamp-1 break-words text-sm leading-6 text-slate-600">
            {{ guestbookPlainText(entry.content) }}
          </p>
          <div class="mt-3 flex items-center gap-4 text-xs text-slate-400">
            <span v-if="!entry.is_deleted" class="inline-flex items-center gap-1">
              <ThumbsUp class="h-4 w-4" aria-hidden="true" />
              {{ entry.like_count }}
            </span>
            <span class="inline-flex items-center gap-1">
              <MessageCircle class="h-4 w-4" aria-hidden="true" />
              {{ entry.reply_count || 0 }}
            </span>
          </div>
        </div>
      </div>
    </RouterLink>
  </div>

  <div v-else-if="failed" class="px-5 py-16 text-center sm:px-6" role="alert">
    <p class="text-sm text-slate-500">留言加载失败。</p>
    <button
      type="button"
      class="mt-3 min-h-11 rounded-lg px-4 text-sm font-medium text-blue-700 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      @click="load"
    >
      重新加载
    </button>
  </div>

  <p v-else class="px-5 py-16 text-center text-sm text-slate-500 sm:px-6">
    还没有留言。
  </p>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { MessageCircle, ThumbsUp } from 'lucide-vue-next'
import Time from '@/components/tinyComponents/Time.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import { guestbookPlainText } from '@/lib/guestbook'
import { api } from '@/lib/requests'
import type { GuestbookEntry } from '@/types/api/guestbook'

const entries = ref<GuestbookEntry[]>([])
const loading = ref(true)
const failed = ref(false)

const load = async () => {
  loading.value = true
  failed.value = false

  try {
    const response = await api.get({ url: '/api/guestbook/', query: { page: 1, pageSize: 3 } })
    if (response.status !== 200) throw new Error('获取留言失败')
    entries.value = response.content.results.slice(0, 3)
  } catch {
    failed.value = true
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
