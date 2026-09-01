<template>
  <div v-if="loading" class="space-y-4"><div v-for="index in 3" :key="index" class="h-24 animate-pulse rounded-xl bg-gray-100" /></div>
  <div v-else-if="entries.length" class="space-y-4">
    <RouterLink v-for="entry in entries" :key="entry.id" :to="`/guestbook/${entry.id}`" class="block rounded-xl border border-gray-100 p-4 hover:border-blue-200 hover:bg-blue-50/30">
      <div class="flex flex-wrap items-center gap-2 text-sm">
        <img v-if="entry.anonymous" :src="`/api/download/${entry.author.avatar}/`" alt="匿名用户头像" class="h-8 w-8 rounded-full" />
        <UserAvatar v-else :avatar="entry.author.avatar" :uuid="entry.author.uuid" :has-avatar="entry.author.has_avatar" class="h-8 w-8 rounded-full" />
        <span class="font-medium text-gray-800">{{ entry.author.nickname }}</span><Time :time="entry.created_at" class="text-xs text-gray-500" />
      </div>
      <p class="mt-2 line-clamp-3 text-sm text-gray-600">{{ guestbookPlainText(entry.content) }}</p>
      <p class="mt-2 text-xs text-gray-400"><span v-if="!entry.is_deleted">{{ entry.like_count }} 赞 · </span>{{ entry.reply_count || 0 }} 回复</p>
    </RouterLink>
  </div>
  <p v-else-if="failed" class="py-10 text-center text-gray-500">留言加载失败。<button class="text-blue-700" @click="load">重试</button></p>
  <p v-else class="py-10 text-center text-gray-500">还没有留言。</p>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
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
    entries.value = response.content.results
  } catch { failed.value = true } finally { loading.value = false }
}
onMounted(load)
</script>
