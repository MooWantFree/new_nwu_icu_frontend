<template>
  <div v-if="loading" class="animate-pulse px-5 py-6 sm:px-7" aria-label="正在加载最新公告">
    <div class="h-5 w-2/5 rounded bg-slate-200 sm:w-1/4" />
    <div class="mt-3 h-4 w-40 rounded bg-slate-100" />
    <div class="mt-6 space-y-3">
      <div class="h-4 rounded bg-slate-100" />
      <div class="h-4 w-5/6 rounded bg-slate-100" />
    </div>
  </div>

  <RouterLink
    v-else-if="announcement"
    :to="`/announcements/${announcement.id}`"
    class="group block px-5 py-6 transition-colors hover:bg-blue-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 sm:px-7"
  >
    <div class="relative min-h-7 text-center">
      <h3 class="px-16 text-lg font-semibold leading-7 text-slate-900 group-hover:text-blue-700 sm:px-24">
        {{ announcement.title || '公告' }}
      </h3>
      <Time :time="announcement.created_at" class="absolute right-0 top-0 whitespace-nowrap" />
    </div>

    <div
      class="announcement-preview-content mt-5 break-words text-center text-sm leading-7 text-slate-600"
      v-html="sanitizeAnnouncementHtml(announcement.content)"
    />

  </RouterLink>

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
.announcement-preview-content img { display: block; height: auto; margin: 0.75rem auto; max-height: 24rem; max-width: 100%; border-radius: 0.5rem; object-fit: contain; }
</style>
