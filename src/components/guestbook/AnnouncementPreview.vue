<template>
  <div v-if="loading" class="px-5 py-6 sm:px-7" aria-label="正在加载最新公告" role="status">
    <span class="sr-only">正在加载最新公告</span>
    <div class="motion-safe:animate-pulse" aria-hidden="true">
      <div class="relative min-h-7">
        <div class="mx-auto h-5 w-2/5 max-w-64 rounded-md bg-slate-200 sm:w-1/4" />
        <div class="absolute right-0 top-0 h-4 w-12 rounded-md bg-slate-100" />
      </div>
      <div class="mx-auto mt-5 h-4 w-5/6 rounded-md bg-slate-100" />
      <div class="mx-auto mt-3 h-4 w-2/3 rounded-md bg-slate-100" />
    </div>
  </div>

  <article
    v-else-if="announcement"
    class="group px-5 py-6 transition-colors hover:bg-blue-50/50 sm:px-7"
  >
    <div class="relative min-h-7 text-center">
      <h3 class="px-16 text-lg font-semibold leading-7 sm:px-24">
        <RouterLink :to="`/announcements/${announcement.id}`" class="text-slate-900 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
          {{ announcement.title || '公告' }}
        </RouterLink>
      </h3>
      <Time :time="announcement.updated_at" class="absolute right-0 top-0 whitespace-nowrap" />
    </div>

    <div
      class="announcement-preview-content mt-5 break-words text-center text-sm leading-7 text-slate-600"
      v-html="sanitizeAnnouncementHtml(announcement.content)"
    />
  </article>

  <div v-else-if="failed" class="px-5 py-12 text-center sm:px-7" role="alert">
    <p class="text-sm text-slate-500">公告加载失败。</p>
    <button
      type="button"
      class="mt-3 min-h-11 rounded-lg px-4 text-sm font-medium text-blue-700 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      @click="load"
    >
      重新加载
    </button>
  </div>

  <p v-else class="px-5 py-12 text-center text-sm text-slate-500 sm:px-7">
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

<style>
.announcement-preview-content p { margin: 0 0 0.5rem; }
.announcement-preview-content p:last-child { margin-bottom: 0; }
.announcement-preview-content a { color: #1d4ed8; text-decoration: underline; text-underline-offset: 0.2em; }
.announcement-preview-content img { display: block; height: auto; margin: 0.75rem auto; max-height: 24rem; max-width: 100%; border-radius: 0.5rem; object-fit: contain; }
.announcement-preview-content img[data-size="25"] { width: 25%; }
.announcement-preview-content img[data-size="50"] { width: 50%; }
.announcement-preview-content img[data-size="75"] { width: 75%; }
.announcement-preview-content img[data-size="100"] { width: 100%; }
</style>
