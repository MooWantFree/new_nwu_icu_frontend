<template>
  <p v-if="control.state.error && !control.state.panel" role="alert" class="my-3 text-sm text-red-700">{{ control.state.error }}</p>
  <div v-if="control.state.selecting" class="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white px-4 pt-3 shadow-lg" style="padding-bottom: max(12px, env(safe-area-inset-bottom))">
    <div class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 text-sm">
      <span>已选 {{ control.state.selected.length }} 个 · {{ formatResourceSize(control.selectedBytes) }}</span>
      <button :disabled="!control.state.selected.length || control.state.busy" class="min-h-11 rounded-lg bg-blue-600 px-4 text-white disabled:opacity-50" @click="control.submit()">{{ control.state.busy ? '正在提交…' : '打包下载' }}</button>
    </div>
  </div>
  <Teleport to="body">
    <div v-if="control.state.panel" class="fixed inset-0 z-40 flex items-end justify-center bg-black/35 sm:items-center" @keydown.esc.stop.prevent>
      <section ref="panel" role="dialog" aria-modal="true" aria-labelledby="archive-panel-title" tabindex="-1" class="flex max-h-[85dvh] w-full flex-col rounded-t-2xl bg-white p-5 shadow-xl sm:max-w-lg sm:rounded-2xl" @keydown.tab="trapFocus">
        <div class="flex items-center justify-between gap-3">
          <h2 id="archive-panel-title" class="text-lg font-semibold">打包下载</h2>
          <button type="button" aria-label="关闭打包窗口" class="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100" @click="control.state.panel = false"><X class="h-5 w-5" aria-hidden="true" /></button>
        </div>
        <p v-if="control.state.error" role="alert" class="mt-3 text-sm text-red-700">{{ control.state.error }}</p>
        <p v-if="control.state.message" role="status" class="mt-3 text-sm text-blue-700">{{ control.state.message }}</p>
        <div class="mt-4 overflow-y-auto overscroll-contain">
          <p v-if="!control.state.tasks.length" role="status" class="py-8 text-center text-sm text-gray-500">{{ control.state.busy ? '正在提交打包任务…' : control.state.loading ? '正在查询…' : '暂无资料包，选择文件后即可打包。' }}</p>
          <article v-for="task in control.state.tasks" :key="task.id" class="mb-3 rounded-xl border border-gray-200 p-4">
            <p class="break-all text-sm font-medium">{{ task.filename }}</p>
            <p class="mt-1 text-xs text-gray-500">{{ task.file_count }} 个文件 · {{ formatResourceSize(task.status === 'ready' ? task.zip_bytes : task.source_bytes) }}</p>
            <p role="status" class="mt-3 text-sm" :class="task.status === 'failed' ? 'text-red-700' : 'text-gray-700'">{{ archiveLabel(task) }}</p>
            <progress v-if="task.status === 'running'" class="mt-2 w-full" :value="task.processed_bytes" :max="Math.max(task.source_bytes, 1)" aria-label="资料包处理进度" />
            <div class="mt-3 flex gap-3 text-sm">
              <button v-if="task.status === 'ready'" :disabled="control.state.busy" class="min-h-11 rounded-lg bg-blue-600 px-4 text-white disabled:opacity-50" @click="control.download(task)">下载 ZIP</button>
              <button v-else-if="task.status === 'queued' || task.status === 'running'" :disabled="control.state.busy" class="min-h-11 text-gray-600 disabled:opacity-50" @click="control.cancel(task)">{{ task.status === 'queued' ? '取消排队' : '取消打包' }}</button>
              <button v-else-if="!activeArchive(task)" :disabled="control.state.busy" class="min-h-11 text-blue-700 disabled:opacity-50" @click="control.submit(task.paths)">重新打包</button>
            </div>
          </article>
        </div>
        <details open class="mt-3 text-xs leading-6 text-gray-500">
          <summary class="min-h-8 cursor-pointer">下载后如何打开？</summary>
          <p>iPhone：在“文件”中找到 ZIP，点击解压。</p>
          <p>安卓：在文件管理器的“下载”中找到 ZIP，使用解压功能。</p>
          <p><strong>微信内无法下载时，请从菜单选择在系统浏览器打开。</strong></p>
        </details>
        <button type="button" class="mt-3 min-h-11 rounded-lg border border-blue-200 bg-blue-50 px-4 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50" :disabled="control.state.loading || control.state.busy || !control.state.tasks.length" @click="control.refresh()">{{ control.state.loading ? '刷新中…' : '刷新进度' }}</button>
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import { activeArchive, archiveLabel, type ArchiveController } from '@/lib/useResourceArchives'
import { formatResourceSize } from '@/lib/resourceBrowser'
const props = defineProps<{ control: ArchiveController }>()
const panel = ref<HTMLElement>()
let previousFocus: HTMLElement | null = null
let oldOverflow = ''
watch(() => props.control.state.panel, async (open) => {
  if (open) {
    previousFocus = document.activeElement as HTMLElement
    oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    await nextTick(); panel.value?.focus()
  } else { document.body.style.overflow = oldOverflow; previousFocus?.focus() }
})
function trapFocus(event: KeyboardEvent) {
  const nodes = panel.value?.querySelectorAll<HTMLElement>('button:not(:disabled), summary, [href]')
  if (!nodes?.length) return
  const first = nodes[0], last = nodes[nodes.length - 1]
  if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.value)) { event.preventDefault(); last.focus() }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
}
onBeforeUnmount(() => { if (props.control.state.panel) document.body.style.overflow = oldOverflow })
</script>
