<template>
  <div v-if="control.state.error && !control.state.panel" role="alert" class="my-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700">
    <CircleAlert class="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
    <p>{{ control.state.error }}</p>
  </div>
  <div v-if="control.state.selecting" class="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white/95 px-4 pt-3 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] backdrop-blur-sm" style="padding-bottom: max(12px, env(safe-area-inset-bottom))">
    <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-sm text-zinc-950">
      <div class="flex items-center gap-3">
        <span class="inline-flex h-9 w-9 items-center justify-center rounded-md bg-zinc-100 text-zinc-600"><Files class="h-4 w-4" aria-hidden="true" /></span>
        <p><span class="font-medium">已选 {{ control.state.selected.length }} 个</span><span class="ml-2 text-zinc-500">· {{ formatResourceSize(control.selectedBytes) }}</span></p>
      </div>
      <button type="button" :disabled="!control.state.selected.length || control.state.busy" class="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" @click="control.submit()">
        <LoaderCircle v-if="control.state.busy" class="h-4 w-4 animate-spin" aria-hidden="true" />
        <Archive v-else class="h-4 w-4" aria-hidden="true" />
        {{ control.state.busy ? '正在提交…' : '打包下载' }}
      </button>
    </div>
  </div>
  <Teleport to="body">
    <div v-if="control.state.panel" class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4" @keydown.esc.stop.prevent>
      <section ref="panel" role="dialog" aria-modal="true" :aria-labelledby="titleId" :aria-describedby="descriptionId" tabindex="-1" class="flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col rounded-xl border border-zinc-200 bg-white text-zinc-950 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.25)] outline-none" @keydown.tab="trapFocus">
        <header class="flex shrink-0 items-start justify-between gap-4 px-5 pt-5 sm:px-6 sm:pt-6">
          <div>
            <h2 :id="titleId" class="text-lg font-semibold tracking-tight">打包下载</h2>
            <p :id="descriptionId" class="mt-1.5 text-sm leading-6 text-zinc-500">将所选文件整理为 ZIP 资料包。</p>
          </div>
          <button type="button" aria-label="关闭打包窗口" class="-mr-1 -mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400" @click="control.state.panel = false"><X class="h-4 w-4" aria-hidden="true" /></button>
        </header>
        <div class="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
          <div v-if="control.state.error" role="alert" class="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700">
            <CircleAlert class="mt-1 h-4 w-4 shrink-0" aria-hidden="true" /><p>{{ control.state.error }}</p>
          </div>
          <div v-if="control.state.message" role="status" class="flex items-start gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm leading-6 text-zinc-600">
            <CircleCheck class="mt-1 h-4 w-4 shrink-0" aria-hidden="true" /><p>{{ control.state.message }}</p>
          </div>
          <div v-if="!control.state.tasks.length" role="status" class="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500">
            <LoaderCircle v-if="control.state.busy || control.state.loading" class="h-5 w-5 animate-spin text-zinc-400" aria-hidden="true" />
            <span v-else class="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100"><Archive class="h-5 w-5" aria-hidden="true" /></span>
            <p>{{ control.state.busy ? '正在提交打包任务…' : control.state.loading ? '正在查询…' : '暂无资料包，选择文件后即可打包。' }}</p>
          </div>
          <article v-for="task in control.state.tasks" :key="task.id" class="rounded-xl border border-zinc-200 p-4">
            <div class="flex items-start gap-3">
              <span class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600"><FileArchive class="h-5 w-5" aria-hidden="true" /></span>
              <div class="min-w-0 flex-1">
                <p class="break-all text-sm font-medium leading-6">{{ task.filename }}</p>
                <p class="mt-0.5 text-xs leading-5 text-zinc-500">{{ task.file_count }} 个文件 · {{ formatResourceSize(task.status === 'ready' ? task.zip_bytes : task.source_bytes) }}</p>
              </div>
            </div>
            <div role="status" class="mt-4 flex items-start gap-2 text-sm leading-6" :class="task.status === 'failed' ? 'text-red-700' : 'text-zinc-600'">
              <CircleAlert v-if="task.status === 'failed'" class="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
              <CircleCheck v-else-if="task.status === 'ready'" class="mt-1 h-4 w-4 shrink-0 text-zinc-950" aria-hidden="true" />
              <LoaderCircle v-else-if="activeArchive(task)" class="mt-1 h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
              <p>{{ archiveLabel(task) }}</p>
            </div>
            <progress v-if="task.status === 'running'" class="archive-progress mt-3 block h-2 w-full overflow-hidden rounded-full" :value="task.processed_bytes" :max="Math.max(task.source_bytes, 1)" aria-label="资料包处理进度" />
            <div class="mt-4 flex flex-wrap gap-2">
              <button v-if="task.status === 'ready'" type="button" :disabled="control.state.busy" class="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-zinc-950 px-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" @click="control.download(task)"><Download class="h-4 w-4" aria-hidden="true" />下载 ZIP</button>
              <button v-else-if="task.status === 'queued' || task.status === 'running'" type="button" :disabled="control.state.busy" class="inline-flex h-9 items-center justify-center rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" @click="control.cancel(task)">{{ task.status === 'queued' ? '取消排队' : '取消打包' }}</button>
              <button v-else-if="!activeArchive(task)" type="button" :disabled="control.state.busy" class="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" @click="control.submit(task.paths)"><RotateCcw class="h-4 w-4" aria-hidden="true" />重新打包</button>
            </div>
          </article>
          <details open class="rounded-lg bg-zinc-50 p-3 text-xs leading-6 text-zinc-500">
            <summary class="cursor-pointer font-medium text-zinc-700 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400">下载后如何打开？</summary>
            <div class="mt-2 space-y-1">
              <p>iPhone：在“文件”中找到 ZIP，点击解压。</p>
              <p>安卓：在文件管理器的“下载”中找到 ZIP，使用解压功能。</p>
              <p>微信内无法下载时，请从菜单选择在系统浏览器打开。</p>
            </div>
          </details>
        </div>
        <footer class="flex shrink-0 justify-end px-5 pb-5 sm:px-6 sm:pb-6">
          <button type="button" class="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 sm:w-auto" :disabled="control.state.loading || control.state.busy || !control.state.tasks.length" @click="control.refresh()"><RefreshCw class="h-4 w-4" :class="{ 'animate-spin': control.state.loading }" aria-hidden="true" />{{ control.state.loading ? '刷新中…' : '刷新进度' }}</button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { Archive, CircleAlert, CircleCheck, Download, FileArchive, Files, LoaderCircle, RefreshCw, RotateCcw, X } from 'lucide-vue-next'
import { activeArchive, archiveLabel, type ArchiveController } from '@/lib/useResourceArchives'
import { formatResourceSize } from '@/lib/resourceBrowser'

const props = defineProps<{ control: ArchiveController }>()
const panel = ref<HTMLElement>()
const id = useId()
const titleId = `archive-panel-title-${id}`
const descriptionId = `archive-panel-description-${id}`
let previousFocus: HTMLElement | null = null
let oldOverflow = ''
let scrollLocked = false

function restorePage() {
  if (!scrollLocked) return
  document.body.style.overflow = oldOverflow
  scrollLocked = false
  if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true })
}

watch(() => props.control.state.panel, async (open) => {
  if (open) {
    previousFocus = document.activeElement as HTMLElement
    oldOverflow = document.body.style.overflow
    scrollLocked = true
    document.body.style.overflow = 'hidden'
    await nextTick()
    if (props.control.state.panel) panel.value?.focus({ preventScroll: true })
  } else restorePage()
}, { immediate: true })

function trapFocus(event: KeyboardEvent) {
  const nodes = panel.value?.querySelectorAll<HTMLElement>('button:not(:disabled), summary, [href]')
  if (!nodes?.length) { event.preventDefault(); panel.value?.focus(); return }
  const first = nodes[0], last = nodes[nodes.length - 1]
  if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.value)) { event.preventDefault(); last.focus() }
  else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panel.value)) { event.preventDefault(); first.focus() }
}

onBeforeUnmount(restorePage)
</script>

<style scoped>
.archive-progress {
  appearance: none;
  background: #f4f4f5;
  color: #18181b;
}
.archive-progress::-webkit-progress-bar { background: #f4f4f5; border-radius: 9999px; }
.archive-progress::-webkit-progress-value { background: #18181b; border-radius: 9999px; }
.archive-progress::-moz-progress-bar { background: #18181b; border-radius: 9999px; }
</style>
