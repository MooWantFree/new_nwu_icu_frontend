<template>
  <ShadcnModal :show="show" :busy="busy" :suspended="confirmIntent !== null" title="编辑目录说明" description="编辑当前目录的 README.md，并预览 Markdown 效果。" @update:show="value => { if (!value) requestClose() }">
    <section class="flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-5xl flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white text-zinc-950 shadow-lg" aria-label="编辑目录说明">
      <header class="flex items-start justify-between gap-4 border-b border-zinc-200 px-5 py-4 sm:px-6">
        <div class="min-w-0"><h2 class="text-lg font-semibold tracking-tight">编辑目录说明</h2><p class="mt-1 break-all text-xs text-zinc-500">{{ readme?.path || editingPath }} · README.md</p></div>
        <button type="button" :disabled="busy" aria-label="关闭目录说明编辑器" class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:opacity-40" @click="requestClose"><X class="h-4 w-4" aria-hidden="true" /></button>
      </header>
      <div class="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-5 sm:p-6">
        <div v-if="error" role="alert" class="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><p>{{ error }}</p></div>
        <div v-if="message" role="status" class="flex items-start gap-2.5 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700"><CheckCircle2 class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><p>{{ message }}</p></div>
        <p v-if="busy && !readme" role="status" class="flex min-h-56 items-center justify-center gap-2 text-sm text-zinc-500"><LoaderCircle class="h-5 w-5 animate-spin" aria-hidden="true" />正在加载目录说明…</p>
        <template v-if="readme">
          <p v-if="readme.warning" class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">{{ readme.warning }} 请通过文件管理处理原文件，避免覆盖未加载的内容。</p>
          <p v-if="readme.path !== path" class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">当前保留的是 {{ readme.path }} 的草稿。保存或放弃后再加载新目录。</p>
          <div class="grid gap-4 lg:grid-cols-2">
            <label class="text-sm font-medium">Markdown 源码<textarea v-model="draft" :disabled="busy || !!readme.warning" rows="14" class="mt-2 block min-h-72 w-full resize-y rounded-md border border-zinc-200 bg-white px-3 py-3 font-mono text-sm font-normal leading-6 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" aria-label="目录说明 Markdown" /></label>
            <div class="min-w-0"><p class="text-sm font-medium">预览</p><div class="resource-tools-preview prose prose-sm prose-zinc mt-2 min-h-72 max-w-none overflow-auto rounded-md border border-zinc-200 bg-zinc-50/50 p-4" aria-label="目录说明预览" v-html="preview" /></div>
          </div>
        </template>
      </div>
      <footer class="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 px-5 py-4 sm:px-6">
        <span class="text-xs text-zinc-500">{{ dirty ? '尚未保存' : readme ? '所有修改已保存' : '' }}</span>
        <div class="flex flex-wrap gap-2"><button type="button" :disabled="busy" :class="outlineButtonClass" @click="reloadReadme">{{ dirty ? '放弃草稿并重新加载' : '重新加载' }}</button><button type="button" :disabled="busy || !dirty || !!readme?.warning" :class="primaryButtonClass" @click="saveReadme"><LoaderCircle v-if="busy && readme" class="h-4 w-4 animate-spin" aria-hidden="true" />{{ busy && readme ? '正在保存…' : '保存目录说明' }}</button></div>
      </footer>
    </section>
  </ShadcnModal>
  <ShadcnModal :show="confirmIntent !== null" :busy="busy" title="放弃目录说明草稿" description="尚未保存的修改将被丢弃。" @update:show="value => { if (!value) cancelDiscard() }">
    <div class="w-[calc(100vw-2rem)] max-w-sm rounded-xl border border-zinc-200 bg-white p-6 text-zinc-950 shadow-lg">
      <h3 class="text-lg font-semibold tracking-tight">放弃目录说明草稿？</h3><p class="mt-2 text-sm leading-6 text-zinc-500">{{ confirmIntent === 'reload' ? '尚未保存的修改将被丢弃，并重新加载当前目录的说明。' : confirmIntent === 'navigate' ? '尚未保存的修改将被丢弃并离开当前页面。' : '尚未保存的修改将被丢弃并关闭编辑器。' }}</p>
      <div class="mt-6 flex flex-wrap justify-end gap-2"><button type="button" :disabled="busy" :class="outlineButtonClass" @click="cancelDiscard">保留草稿</button><button type="button" :disabled="busy" :class="primaryButtonClass" @click="confirmDiscard"><LoaderCircle v-if="busy" class="h-4 w-4 animate-spin" aria-hidden="true" />{{ busy ? '正在加载…' : confirmIntent === 'reload' ? '放弃并重新加载' : confirmIntent === 'navigate' ? '放弃并离开' : '放弃并关闭' }}</button></div>
    </div>
  </ShadcnModal>
</template>

<script setup lang="ts">
import { computed, inject, onBeforeUnmount, ref, watch } from 'vue'
import { matchedRouteKey, onBeforeRouteLeave, onBeforeRouteUpdate, routeLocationKey } from 'vue-router'
import { AlertCircle, CheckCircle2, LoaderCircle, X } from 'lucide-vue-next'
import ShadcnModal from '@/components/common/ShadcnModal.vue'
import { api } from '@/lib/requests'
import { renderResourceReadme } from '@/lib/resourceBrowser'
import type { ReadmeData } from '@/types/api/resourceTools'

const props = defineProps<{ path: string }>()
const emit = defineEmits<{ (event: 'session-expired'): void; (event: 'changed'): void }>()
const show = ref(false), busy = ref(false), error = ref(''), message = ref('')
const readme = ref<ReadmeData>(), draft = ref(''), preview = ref(''), editingPath = ref('')
const confirmIntent = ref<'close' | 'reload' | 'navigate' | null>(null)
const dirty = computed(() => Boolean(readme.value && draft.value !== readme.value.content))
const buttonClass = 'inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40'
const primaryButtonClass = `${buttonClass} bg-zinc-900 text-white hover:bg-zinc-800`
const outlineButtonClass = `${buttonClass} border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-100`
let generation = 0, previewGeneration = 0
let resolveNavigation: ((allow: boolean) => void) | undefined
function check(result: { status: number; errors?: { err_msg: string }[] }) {
  if ([401, 403].includes(result.status)) emit('session-expired')
  if (result.status !== 200) throw new Error(result.errors?.[0]?.err_msg || '操作失败，请刷新后重试。')
}
async function load() {
  if (busy.value) return
  const current = ++generation, path = props.path
  busy.value = true; error.value = ''; message.value = ''; editingPath.value = path
  readme.value = undefined; draft.value = ''
  try {
    const result = await api.get({ url: '/api/management/resources/readme/', query: { path } }); check(result)
    if (current === generation) { readme.value = result.content; draft.value = result.content.content }
  } catch (cause) { if (current === generation) error.value = cause instanceof Error ? cause.message : '目录说明加载失败。' }
  finally { if (current === generation) busy.value = false }
}
async function open() {
  show.value = true
  if (!dirty.value) await load()
}
function requestClose() {
  if (busy.value || confirmIntent.value !== null) return
  if (dirty.value) { confirmIntent.value = 'close'; return }
  show.value = false
}
async function reloadReadme() {
  if (busy.value || confirmIntent.value !== null) return
  if (dirty.value) { confirmIntent.value = 'reload'; return }
  await load()
}
async function confirmDiscard() {
  if (busy.value) return
  if (confirmIntent.value === 'reload') { await load(); confirmIntent.value = null }
  else { draft.value = readme.value?.content || ''; confirmIntent.value = null; show.value = false; finishNavigation(true) }
}
function finishNavigation(allow: boolean) { const resolve = resolveNavigation; resolveNavigation = undefined; resolve?.(allow) }
function cancelDiscard() { if (busy.value) return; confirmIntent.value = null; finishNavigation(false) }
function confirmNavigation(): boolean | Promise<boolean> {
  if (!show.value) return true
  if (busy.value) return false
  if (!dirty.value) { show.value = false; return true }
  finishNavigation(false)
  confirmIntent.value = 'navigate'
  return new Promise(resolve => { resolveNavigation = resolve })
}
const route = inject(routeLocationKey, undefined)
const matchedRoute = inject(matchedRouteKey, undefined)
if (route && matchedRoute?.value) { onBeforeRouteLeave(confirmNavigation); onBeforeRouteUpdate(confirmNavigation) }
async function saveReadme() {
  if (busy.value || !dirty.value || !readme.value || readme.value.warning) return
  const current = ++generation
  const query = { path: readme.value.path, version: readme.value.version, content: draft.value }
  busy.value = true; error.value = ''; message.value = ''
  try {
    const result = await api.post({ url: '/api/management/resources/readme/', query }); check(result)
    if (current !== generation) return
    readme.value = result.content; draft.value = result.content.content; message.value = '目录说明已保存。'; emit('changed')
  } catch (cause) { if (current === generation) error.value = cause instanceof Error ? cause.message : '目录说明保存失败。' }
  finally { if (current === generation) busy.value = false }
}
watch([draft, () => readme.value?.path], async () => {
  const current = ++previewGeneration
  const html = await renderResourceReadme(draft.value, readme.value?.path || editingPath.value || props.path)
  if (current === previewGeneration) preview.value = html
})
function warnUnsaved(event: BeforeUnloadEvent) { if (dirty.value) { event.preventDefault(); event.returnValue = '' } }
window.addEventListener('beforeunload', warnUnsaved)
onBeforeUnmount(() => { generation++; previewGeneration++; finishNavigation(false); window.removeEventListener('beforeunload', warnUnsaved) })
defineExpose({ open })
</script>

<style scoped>
.resource-tools-preview { overflow-wrap: anywhere; }
.resource-tools-preview :deep(pre) { overflow-x: auto; }
.resource-tools-preview :deep(table) { display: block; max-width: 100%; overflow-x: auto; }
.resource-tools-preview :deep(img) { max-width: 100%; height: auto; }
</style>
