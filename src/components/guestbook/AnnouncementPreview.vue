<template>
  <div v-if="loading" class="px-5 py-5 sm:px-6" aria-label="正在加载最新公告" role="status">
    <span class="sr-only">正在加载最新公告</span>
    <div class="motion-safe:animate-pulse" aria-hidden="true">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div class="h-4 w-2/5 max-w-64 rounded bg-zinc-200 sm:w-1/4" />
        <div class="h-4 w-12 rounded bg-zinc-100" />
      </div>
      <div class="mt-4 h-4 w-5/6 rounded bg-zinc-100" />
      <div class="mt-3 h-4 w-2/3 rounded bg-zinc-100" />
    </div>
  </div>

  <article
    v-else-if="announcement"
    class="group px-5 py-5 transition-colors hover:bg-zinc-50 sm:px-6"
  >
    <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <h3 class="min-w-0 break-words text-sm font-semibold leading-6">
        <RouterLink :to="`/announcements/${announcement.id}`" class="rounded-sm text-zinc-950 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2">
          {{ announcement.title || '公告' }}
        </RouterLink>
      </h3>
      <Time :time="announcement.updated_at" class="shrink-0 whitespace-nowrap text-xs text-zinc-500" />
    </div>

    <div
      class="announcement-preview-content mt-3 break-words text-sm leading-6 text-zinc-600"
      v-html="sanitizeAnnouncementHtml(announcement.content)"
    />
  </article>

  <div v-else-if="failed" class="px-5 py-12 text-center sm:px-6" role="alert">
    <p class="text-sm text-zinc-500">公告加载失败。</p>
    <button
      type="button"
      class="mt-3 min-h-10 rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 shadow-sm transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
      @click="load"
    >
      重新加载
    </button>
  </div>

  <p v-else class="px-5 py-12 text-center text-sm text-zinc-500 sm:px-6">
    暂无公告。
  </p>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Time from '@/components/tinyComponents/Time.vue'
import { sanitizeAnnouncementHtml } from '@/lib/guestbook'
import { api } from '@/lib/requests'
import type { GuestbookEntry } from '@/types/api/guestbook'

const announcement = ref<GuestbookEntry | null>(null)
const loading = ref(true)
const failed = ref(false)

const load = async () => {
  loading.value = true
  failed.value = false

  try {
    const response = await api.get({ url: '/api/announcements/', query: { page: 1, pageSize: 1 } })
    if (response.status !== 200) throw new Error('获取公告失败')
    announcement.value = response.content.results[0] ?? null
  } catch {
    failed.value = true
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
:deep(.app-time) { color: #71717a; }
:deep(.app-time:hover) { color: #18181b; }
</style>

<style>
.announcement-preview-content p { margin: 0 0 0.5rem; }
.announcement-preview-content p:last-child { margin-bottom: 0; }
.announcement-preview-content a { color: #18181b; text-decoration: underline; text-underline-offset: 0.2em; }
.announcement-preview-content img { display: block; height: auto; margin: 0.75rem auto; max-height: 24rem; max-width: 100%; border-radius: 0.5rem; object-fit: contain; }
.announcement-preview-content img[data-size="25"] { width: 25%; }
.announcement-preview-content img[data-size="50"] { width: 50%; }
.announcement-preview-content img[data-size="75"] { width: 75%; }
.announcement-preview-content img[data-size="100"] { width: 100%; }
</style>
