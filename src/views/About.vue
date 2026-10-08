<template>
  <main class="min-h-[calc(100vh-7rem)] bg-zinc-50 text-zinc-950">
    <div class="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <header class="mb-8">
        <h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">关于本站</h1>
      </header>

      <section :aria-busy="loading" class="min-w-0 rounded-xl border border-zinc-200 bg-white px-5 py-6 shadow-sm sm:px-6">
        <div v-if="loading" class="min-h-40 space-y-4 motion-safe:animate-pulse" role="status" aria-label="正在加载关于本站">
          <span class="sr-only">正在加载关于本站</span>
          <div class="h-4 w-full rounded bg-zinc-100" aria-hidden="true" />
          <div class="h-4 w-11/12 rounded bg-zinc-100" aria-hidden="true" />
          <div class="h-4 w-4/5 rounded bg-zinc-100" aria-hidden="true" />
          <div class="h-4 w-2/3 rounded bg-zinc-100" aria-hidden="true" />
        </div>

        <div v-else-if="error" role="alert" class="rounded-lg border border-red-200 bg-white p-4">
          <div class="flex items-start gap-3">
            <CircleAlert class="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
            <div class="min-w-0">
              <p class="text-sm font-medium text-zinc-950">加载失败</p>
              <p class="mt-1 break-words text-sm leading-6 text-zinc-500">{{ error }}</p>
            </div>
          </div>
          <button
            type="button"
            :disabled="loading"
            class="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-zinc-950 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-50"
            @click="fetchContent"
          >
            重试
          </button>
        </div>

        <div v-else-if="content?.trim()" class="about-content min-w-0 break-words text-sm leading-7 text-zinc-600 [overflow-wrap:anywhere] sm:text-base" v-html="sanitizeAnnouncementHtml(content || '')" />
        <p v-else class="py-6 text-center text-sm leading-6 text-zinc-500">内容正在完善。</p>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { CircleAlert } from 'lucide-vue-next'
import { api } from '@/lib/requests'
import { sanitizeAnnouncementHtml } from '@/lib/guestbook'

const content = ref<string | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
let fetching = false
let active = true

const fetchContent = async () => {
  if (fetching || !active) return
  fetching = true
  try {
    loading.value = true
    error.value = null
    const res = await api.get({ url: '/api/about/' })
    if (!active) return
    if (res.status !== 200) throw new Error('关于本站加载失败，请稍后重试。')
    content.value = res.content.about
  } catch (e) {
    if (active) error.value = e instanceof Error ? e.message : '未知错误'
  } finally {
    fetching = false
    if (active) loading.value = false
  }
}

onMounted(() => { void fetchContent() })
onBeforeUnmount(() => { active = false })
</script>

<style scoped>
.about-content :deep(p) { margin: 0 0 1rem; }
.about-content :deep(p:last-child) { margin-bottom: 0; }
.about-content :deep(strong) { color: #18181b; font-weight: 600; }
.about-content :deep(a) { color: #18181b; text-decoration: underline; text-decoration-color: #a1a1aa; text-underline-offset: 0.2em; }
.about-content :deep(a:hover) { text-decoration-color: #18181b; }
.about-content :deep(a:focus-visible) { border-radius: 0.125rem; outline: 2px solid #a1a1aa; outline-offset: 2px; }
.about-content :deep(img) { display: block; height: auto; margin: 1rem auto; max-width: 100%; border-radius: 0.5rem; }
.about-content :deep(img[data-size="25"]) { width: 25%; }
.about-content :deep(img[data-size="50"]) { width: 50%; }
.about-content :deep(img[data-size="75"]) { width: 75%; }
.about-content :deep(img[data-size="100"]) { width: 100%; }
</style>
