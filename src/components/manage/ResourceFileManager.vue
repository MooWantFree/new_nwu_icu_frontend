<template>
  <section class="min-w-0 space-y-4 text-zinc-950" aria-label="资料文件管理">
    <div class="rounded-xl border border-zinc-200 bg-white p-5 sm:p-6">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="min-w-0">
          <h2 class="text-lg font-semibold tracking-tight">资料管理</h2>
          <p class="mt-1 text-sm leading-6 text-zinc-500">管理已发布的资料。上传直接发布，删除后可从回收站恢复。</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button type="button" :disabled="busy" :class="secondaryButton" @click="switchTrash"><component :is="showTrash ? FolderOpen : Trash2" class="h-4 w-4" aria-hidden="true" />{{ showTrash ? '返回文件' : '回收站' }}</button>
          <button type="button" :disabled="busy || loading" :class="secondaryButton" @click="refresh"><RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" aria-hidden="true" />刷新</button>
        </div>
      </div>
      <div v-if="error" role="alert" class="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700"><CircleAlert class="mt-1 h-4 w-4 shrink-0" aria-hidden="true" /><p>{{ error }}</p></div>
      <div v-if="message" role="status" class="mt-4 flex items-start gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm leading-6 text-zinc-600"><CircleCheck class="mt-1 h-4 w-4 shrink-0" aria-hidden="true" /><p>{{ message }}</p></div>
      <fieldset v-if="!showTrash" :disabled="busy || loading" class="mt-5 min-w-0 disabled:opacity-60">
        <div class="flex flex-wrap items-center gap-2 text-sm">
          <button type="button" :class="secondaryButton" @click="loadFiles('/')"><House class="h-4 w-4" aria-hidden="true" />根目录</button>
          <button type="button" :disabled="currentPath === '/'" :class="secondaryButton" @click="loadFiles(parent(currentPath))"><ArrowUp class="h-4 w-4" aria-hidden="true" />上一级</button>
          <span class="min-w-0 flex-1 break-all px-1 font-mono text-xs leading-6 text-zinc-500">{{ currentPath }}</span>
          <a :href="resourcePageUrl(currentPath)" target="_blank" rel="noopener noreferrer" :class="secondaryButton">查看公开页面<ExternalLink class="h-3.5 w-3.5" aria-hidden="true" /></a>
          <button type="button" :class="secondaryButton" @click="openDialog({ action: 'mkdir', name: '', path: currentPath })"><FolderPlus class="h-4 w-4" aria-hidden="true" />新建文件夹</button>
        </div>
        <div class="mt-4 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/70 p-4">
          <label class="block text-sm font-medium">上传到当前目录
            <input ref="fileInput" type="file" multiple class="mt-3 block w-full min-w-0 text-sm text-zinc-500 file:mr-3 file:cursor-pointer file:rounded-md file:border file:border-zinc-200 file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium file:text-zinc-950 focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2" @change="chooseFiles" />
          </label>
          <p class="mt-2 text-xs leading-5 text-zinc-500">每次最多 {{ maxFiles }} 个文件，单个不超过 {{ formatResourceSize(maxFileSize) }}。同名文件不覆盖。</p>
          <ul v-if="selectedFiles.length" class="mt-3 max-h-32 space-y-1 overflow-y-auto overscroll-contain rounded-lg border border-zinc-200 bg-white p-3 text-sm text-zinc-600"><li v-for="file in selectedFiles" :key="file.name" class="break-all">{{ file.name }} · {{ formatResourceSize(file.size) }}</li></ul>
          <button v-if="selectedFiles.length" type="button" :class="primaryButton" class="mt-3" @click="upload"><Upload class="h-4 w-4" aria-hidden="true" />上传并发布 {{ selectedFiles.length }} 个文件</button>
        </div>
      </fieldset>
      <div v-if="busy" role="status" class="mt-4 space-y-2">
        <p class="flex items-center gap-2 text-sm text-zinc-500"><LoaderCircle class="h-4 w-4 animate-spin" aria-hidden="true" />{{ uploading ? `正在上传 ${progress}%…` : '正在处理…' }}</p>
        <div v-if="uploading" role="progressbar" :aria-valuenow="progress" aria-valuemin="0" aria-valuemax="100" aria-label="文件上传进度" class="h-2 overflow-hidden rounded-full bg-zinc-100"><div class="h-full rounded-full bg-zinc-950 transition-[width]" :style="{ width: `${progress}%` }" /></div>
      </div>
    </div>

    <slot name="settings" />
    <ResourceTools v-show="!showTrash" :path="currentPath" @session-expired="emit('session-expired')" @changed="refresh" />

    <div class="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 p-4 sm:px-5">
        <h3 class="flex items-center gap-2 font-semibold">{{ showTrash ? '回收站' : '当前目录' }}<span class="rounded-md border border-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-500">{{ filteredItems.length }} 项</span></h3>
        <label class="relative w-full sm:w-64"><Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden="true" /><input v-model="filter" type="search" :disabled="busy" aria-label="筛选管理文件" placeholder="按名称筛选…" :class="inputClass" class="pl-9" /></label>
      </div>
      <div v-if="showTrash" class="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm sm:px-5"><span class="text-zinc-500">回收站占用 {{ formatResourceSize(trash.reduce((total, item) => total + item.size, 0)) }} · {{ trash.length }} 个文件</span><button type="button" :disabled="busy || loading || !trash.length" :class="dangerButton" @click="askPurge(trash)"><Trash2 class="h-4 w-4" aria-hidden="true" />清空回收站</button></div>
      <div v-else class="flex flex-wrap items-center gap-3 border-b border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm sm:px-5"><label class="flex cursor-pointer items-center gap-2"><input type="checkbox" :class="checkboxClass" :disabled="busy || loading" :checked="pageSelected" @change="selectPage" />选择本页文件</label><span class="text-xs text-zinc-500">已选 {{ selectedRows.length }} 个（最多 100 个）</span><div class="flex flex-wrap gap-2 sm:ml-auto"><button type="button" :disabled="busy || !selectedRows.length" :class="secondaryButton" @click="askBatch('move')">批量移动</button><button type="button" :disabled="busy || !selectedRows.length" :class="dangerButton" @click="askBatch('delete')">批量删除</button></div></div>
      <p v-if="loading" role="status" class="flex items-center justify-center gap-2 p-10 text-sm text-zinc-500"><LoaderCircle class="h-4 w-4 animate-spin" aria-hidden="true" />正在读取文件…</p>
      <template v-else>
        <ul v-if="showTrash" class="divide-y divide-zinc-200">
          <li v-for="item in pagedTrash" :key="item.id" class="flex flex-wrap items-center gap-3 p-4 transition-colors hover:bg-zinc-50/70 sm:px-5">
            <span class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500"><FileText class="h-5 w-5" aria-hidden="true" /></span>
            <div class="min-w-0 flex-1"><p class="break-all text-sm font-medium">{{ item.name }}</p><p class="mt-1 break-all text-xs leading-5 text-zinc-500">原位置：{{ item.path }}</p><p class="mt-1 text-xs leading-5 text-zinc-400">{{ formatResourceSize(item.size) }} · {{ new Date(item.deleted_at).toLocaleString('zh-CN') }}</p></div>
            <div class="flex w-full flex-wrap justify-end gap-2 sm:w-auto"><button type="button" :disabled="busy" :class="secondaryButton" :aria-label="`恢复 ${item.name}`" @click="askRestore(item)"><RotateCcw class="h-3.5 w-3.5" aria-hidden="true" />恢复</button><button type="button" :disabled="busy" :class="dangerButton" :aria-label="`永久删除 ${item.name}`" @click="askPurge([item])">永久删除</button></div>
          </li>
        </ul>
        <ul v-else class="divide-y divide-zinc-200">
          <li v-for="item in pagedFiles" :key="item.path" class="flex flex-wrap items-center gap-3 p-4 transition-colors hover:bg-zinc-50/70 sm:px-5">
            <input v-if="item.type === 'file'" v-model="selectedRows" type="checkbox" :class="checkboxClass" :value="item.path" :aria-label="`选择 ${item.name}`" :disabled="busy || (selectedRows.length >= 100 && !selectedRows.includes(item.path))" />
            <span class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500"><component :is="item.type === 'directory' ? Folder : FileText" class="h-5 w-5" aria-hidden="true" /></span>
            <div class="min-w-0 flex-1">
              <button v-if="item.type === 'directory'" type="button" :disabled="busy" class="break-all rounded text-left text-sm font-medium text-zinc-950 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:opacity-50" @click="loadFiles(item.path)">{{ item.name }}</button>
              <p v-else class="break-all text-sm font-medium leading-6">{{ item.name }} <span v-if="item.name.toLowerCase() === 'readme.md'" class="ml-1 inline-flex rounded-md border border-zinc-200 bg-zinc-50 px-1.5 text-xs font-normal text-zinc-500">目录说明</span></p>
              <p class="mt-1 text-xs leading-5 text-zinc-400">{{ formatResourceSize(item.size) }} · {{ new Date(item.modified_at).toLocaleString('zh-CN') }}</p>
            </div>
            <div v-if="item.type === 'file'" class="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
              <button type="button" :disabled="busy" :class="secondaryButton" :aria-label="`重命名 ${item.name}`" @click="openDialog({ ...item, action: 'rename' })">重命名</button>
              <button type="button" :disabled="busy" :class="secondaryButton" :aria-label="`移动 ${item.name}`" @click="askMove(item)">移动</button>
              <button type="button" :disabled="busy" :class="dangerButton" :aria-label="`删除 ${item.name}`" @click="askDelete(item)">删除</button>
            </div>
          </li>
        </ul>
        <div v-if="!filteredItems.length" role="status" class="flex flex-col items-center gap-3 px-4 py-12 text-center"><span class="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400"><component :is="showTrash ? Trash2 : filter ? Search : FolderOpen" class="h-6 w-6" aria-hidden="true" /></span><p class="text-sm text-zinc-500">{{ filter ? '没有匹配的文件。' : showTrash ? '回收站为空。' : '此目录为空。' }}</p></div>
        <fieldset v-if="pageCount > 1" :disabled="busy" class="min-w-0 border-t border-zinc-200 p-4 disabled:opacity-60"><ReviewPagination v-model:page="page" :page-count="pageCount" /></fieldset>
      </template>
    </div>

    <ShadcnModal :show="!!pending" :title="pending ? actionTitles[pending.action] : '文件操作'" :busy="busy" :auto-focus="false" @update:show="updateDialogVisibility" @after-enter="focusActionField">
      <section ref="actionPanel" tabindex="-1" :aria-busy="busy" class="flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-lg flex-col rounded-xl border border-zinc-200 bg-white text-zinc-950 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.25)] outline-none">
        <template v-if="pending">
          <header class="flex shrink-0 items-start justify-between gap-4 px-5 pt-5 sm:px-6 sm:pt-6"><h3 class="text-lg font-semibold tracking-tight">{{ actionTitles[pending.action] }}</h3><button type="button" :disabled="busy" :aria-label="`关闭${actionTitles[pending.action]}窗口`" class="-mr-1 -mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-50" @click="closeDialog"><X class="h-4 w-4" aria-hidden="true" /></button></header>
          <div class="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
            <p v-if="pending.name" class="break-all text-sm leading-6 text-zinc-600">{{ pending.name }}</p>
            <ul v-if="pending.items" class="max-h-32 space-y-1 overflow-y-auto overscroll-contain rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs leading-5 text-zinc-500"><li v-for="item in pending.items" :key="item.path" class="break-all">{{ item.name }}</li></ul>
            <label v-if="pending.action === 'rename' || pending.action === 'mkdir'" class="block text-sm font-medium">{{ pending.action === 'rename' ? '新文件名' : '文件夹名称' }}<input v-model="newName" :disabled="busy" maxlength="255" :class="inputClass" class="mt-2" /></label>
            <div v-if="pending.action === 'purge'" class="space-y-4 text-sm"><p class="rounded-lg border border-red-200 bg-red-50 p-3 leading-6 text-red-700">将永久删除 {{ pending.trash_ids?.length }} 个文件（{{ formatResourceSize(pending.size || 0) }}），此操作无法恢复。</p><label class="block font-medium">输入“永久删除”确认<input v-model="confirmation" :disabled="busy" autocomplete="off" :class="inputClass" class="mt-2" /></label></div>
            <p v-if="pending.action === 'delete'" class="text-sm leading-6 text-zinc-500">文件将从公开目录移入回收站，之后可以恢复。</p>
            <p v-if="pending.action === 'restore'" class="break-all text-sm leading-6 text-zinc-500">恢复到 {{ pending.path }}。原位置已有同名文件时不会覆盖。</p>
            <fieldset v-if="pending.action === 'move'" :disabled="busy || targetLoading" class="min-w-0 overflow-hidden rounded-lg border border-zinc-200 disabled:opacity-60">
              <div class="flex flex-wrap items-center gap-2 border-b border-zinc-200 bg-zinc-50 p-3 text-sm"><button type="button" :class="secondaryButton" @click="loadTarget('/')">根目录</button><button type="button" :disabled="targetPath === '/'" :class="secondaryButton" @click="loadTarget(parent(targetPath))">上一级</button><span class="min-w-0 break-all font-mono text-xs text-zinc-500">{{ targetPath }}</span></div>
              <p v-if="targetLoading" role="status" class="flex items-center gap-2 p-4 text-sm text-zinc-500"><LoaderCircle class="h-4 w-4 animate-spin" aria-hidden="true" />正在读取目标目录…</p>
              <ul v-else class="max-h-52 divide-y divide-zinc-100 overflow-y-auto overscroll-contain"><li v-for="item in targetDirectories" :key="item.path"><button type="button" class="flex w-full items-center gap-2 p-3 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-400" @click="loadTarget(item.path)"><Folder class="h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" /><span class="break-all">{{ item.name }}</span></button></li></ul>
              <p class="border-t border-zinc-200 bg-zinc-50 p-3 text-xs leading-5 text-zinc-500">选择文件夹后，点击下方“移动到此目录”。</p>
            </fieldset>
            <p v-if="dialogError" role="alert" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700">{{ dialogError }}</p>
          </div>
          <footer class="flex shrink-0 flex-col-reverse gap-2 px-5 pb-5 sm:flex-row sm:justify-end sm:px-6 sm:pb-6"><button type="button" :disabled="busy" :class="secondaryButton" @click="closeDialog">取消</button><button type="button" :disabled="busy || targetLoading || (pending.action === 'move' && (!targetReady || targetPath === parent(pending.path))) || (pending.action === 'purge' && confirmation !== '永久删除') || (['rename', 'mkdir'].includes(pending.action) && !newName.trim())" :class="['delete', 'purge'].includes(pending.action) ? destructiveButton : primaryButton" @click="confirmAction"><LoaderCircle v-if="busy" class="h-4 w-4 animate-spin" aria-hidden="true" />{{ busy ? '处理中…' : actionButtons[pending.action] }}</button></footer>
        </template>
      </section>
    </ShadcnModal>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ArrowUp, CircleAlert, CircleCheck, ExternalLink, FileText, Folder, FolderOpen, FolderPlus, House, LoaderCircle, RefreshCw, RotateCcw, Search, Trash2, Upload, X } from 'lucide-vue-next'
import ResourceTools from './ResourceTools.vue'
import ShadcnModal from '@/components/common/ShadcnModal.vue'
import ReviewPagination from '@/components/courseReview/ReviewPagination.vue'
import { api } from '@/lib/requests'
import { formatResourceSize, resourcePageUrl } from '@/lib/resourceBrowser'
import type { ManagedResourceFile, ResourceFileAction, ResourceTrashEntry } from '@/types/api/management'

const emit = defineEmits<{ (event: 'session-expired'): void }>()
const buttonClass = 'inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'
const secondaryButton = `${buttonClass} border border-zinc-200 bg-white text-zinc-950 hover:bg-zinc-100`
const primaryButton = `${buttonClass} bg-zinc-950 text-white hover:bg-zinc-800`
const dangerButton = `${buttonClass} border border-zinc-200 bg-white text-red-600 hover:border-red-200 hover:bg-red-50`
const destructiveButton = `${buttonClass} bg-red-600 text-white hover:bg-red-700`
const inputClass = 'h-10 w-full min-w-0 rounded-md border border-zinc-200 bg-white px-3 text-sm font-normal text-zinc-950 shadow-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
const checkboxClass = 'h-4 w-4 shrink-0 cursor-pointer rounded border-zinc-300 accent-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
const currentPath = ref('/')
const files = ref<ManagedResourceFile[]>([])
const trash = ref<ResourceTrashEntry[]>([])
const loading = ref(false)
const busy = ref(false)
const uploading = ref(false)
const progress = ref(0)
const error = ref('')
const message = ref('')
const filter = ref('')
const page = ref(1)
const showTrash = ref(false)
const maxFiles = ref(20)
const maxFileSize = ref(100 * 1024 * 1024)
const selectedFiles = ref<File[]>([])
const fileInput = ref<HTMLInputElement>()
const actionPanel = ref<HTMLElement>()
type Pending = { action: 'move' | 'delete' | 'restore' | 'rename' | 'mkdir' | 'purge'; name: string; path: string; version?: string; trash_id?: string; trash_ids?: string[]; items?: ManagedResourceFile[]; size?: number | null }
const actionTitles = { move: '移动文件', delete: '删除文件', restore: '恢复文件', rename: '重命名文件', mkdir: '新建文件夹', purge: '永久删除' }
const actionButtons = { move: '移动到此目录', delete: '移入回收站', restore: '恢复文件', rename: '保存新名称', mkdir: '创建文件夹', purge: '确认永久删除' }
const newName = ref(''), confirmation = ref('')
const selectedRows = ref<string[]>([])
const pending = ref<Pending | null>(null)
const dialogError = ref('')
const targetPath = ref('/')
const targetDirectories = ref<ManagedResourceFile[]>([])
const targetLoading = ref(false)
const targetReady = ref(false)
let requestVersion = 0
let targetVersion = 0
const parent = (path: string) => path.slice(0, path.lastIndexOf('/')) || '/'
const matches = (item: { name: string }) => item.name.toLowerCase().includes(filter.value.trim().toLowerCase())
const filteredItems = computed(() => showTrash.value ? trash.value.filter(matches) : files.value.filter(matches))
const pageCount = computed(() => Math.max(1, Math.ceil(filteredItems.value.length / 100)))
const pagedFiles = computed(() => files.value.filter(matches).slice((page.value - 1) * 100, page.value * 100))
const pagedTrash = computed(() => trash.value.filter(matches).slice((page.value - 1) * 100, page.value * 100))
const pageSelected = computed(() => pagedFiles.value.some(item => item.type === 'file') && pagedFiles.value.filter(item => item.type === 'file').every(item => selectedRows.value.includes(item.path)))
function selectPage() { selectedRows.value = pageSelected.value ? [] : pagedFiles.value.filter(item => item.type === 'file').map(item => item.path) }
async function askBatch(action: 'move' | 'delete') {
  const items = files.value.filter(item => item.type === 'file' && selectedRows.value.includes(item.path))
  if (!items.length) return
  await openDialog({ action, name: `已选择 ${items.length} 个文件`, path: items[0].path, items })
  if (action === 'move') await loadTarget(currentPath.value)
}
function askPurge(items: ResourceTrashEntry[]) { return openDialog({ action: 'purge', path: '', name: items.length === 1 ? items[0].name : `回收站中的 ${items.length} 个文件`, trash_ids: items.map(item => item.id), size: items.reduce((total, item) => total + item.size, 0) }) }
function check(result: { status: number; errors?: { err_msg: string }[]; data?: { message?: string } }, expected = 200) {
  if (result.status === 401 || result.status === 403 || result.status === 404) {
    if (result.status !== 404 || !result.errors?.length) emit('session-expired')
  }
  if (result.status !== expected) throw new Error(result.errors?.[0]?.err_msg || result.data?.message || (result.status === 409 ? '文件已变化或存在同名文件，请刷新后重试。' : '操作失败，请刷新后重试。'))
}
function clearSelection() { selectedFiles.value = []; if (fileInput.value) fileInput.value.value = '' }
async function loadFiles(path: string) {
  const version = ++requestVersion
  loading.value = true; error.value = ''
  try {
    const result = await api.get({ url: '/api/management/resources/', query: { path } })
    check(result)
    if (version !== requestVersion) return
    if (currentPath.value !== result.content.path) clearSelection()
    currentPath.value = result.content.path; files.value = result.content.entries
    selectedRows.value = []
    maxFiles.value = result.content.max_files; maxFileSize.value = result.content.max_file_size
    page.value = 1
  } catch (cause) { if (version === requestVersion) error.value = String(cause instanceof Error ? cause.message : cause) }
  finally { if (version === requestVersion) loading.value = false }
}
async function refresh() {
  if (!showTrash.value) return loadFiles(currentPath.value)
  const version = ++requestVersion
  loading.value = true; error.value = ''
  try {
    const result = await api.get({ url: '/api/management/resources/trash/' }); check(result)
    if (version === requestVersion) { trash.value = result.content.entries; page.value = 1 }
  } catch (cause) { if (version === requestVersion) error.value = cause instanceof Error ? cause.message : '回收站读取失败。' }
  finally { if (version === requestVersion) loading.value = false }
}
async function switchTrash() { showTrash.value = !showTrash.value; filter.value = ''; clearSelection(); await refresh() }
function chooseFiles(event: Event) {
  const picked = Array.from((event.target as HTMLInputElement).files || [])
  error.value = ''; message.value = ''
  if (picked.length > maxFiles.value || picked.some(file => file.size > maxFileSize.value)) { error.value = '文件数量或大小超过上传限制。'; clearSelection(); return }
  if (new Set(picked.map(file => file.name.toLowerCase())).size !== picked.length) { error.value = '所选文件包含同名文件。'; clearSelection(); return }
  selectedFiles.value = picked
}
async function upload() {
  if (busy.value || !selectedFiles.value.length) return
  busy.value = true; uploading.value = true; progress.value = 0; error.value = ''; message.value = ''
  const data = new FormData(); data.append('path', currentPath.value)
  selectedFiles.value.forEach(file => data.append('files', file))
  try {
    const result = await api.post({ url: '/api/management/resources/upload/', query: data, onUploadProgress: event => { progress.value = event.total ? Math.round(event.loaded / event.total * 100) : 0 } })
    check(result, 201); clearSelection(); message.value = `已发布 ${result.content.uploaded} 个文件。`; await refresh()
  } catch (cause) { error.value = cause instanceof Error ? cause.message : '上传失败，请刷新目录确认结果后再重试。' }
  finally { busy.value = false; uploading.value = false }
}
async function openDialog(value: Pending) { if (busy.value) return; pending.value = value; dialogError.value = ''; newName.value = value.action === 'rename' ? value.name : ''; confirmation.value = ''; targetReady.value = false; await nextTick() }
function clearDialog() { pending.value = null; targetVersion++; targetLoading.value = false; targetReady.value = false }
function closeDialog() { if (!busy.value) clearDialog() }
function updateDialogVisibility(show: boolean) { if (!show) closeDialog() }
function focusActionField() {
  if (!pending.value) return
  const field = actionPanel.value?.querySelector<HTMLElement>('input:not(:disabled)')
  ;(field ?? actionPanel.value)?.focus({ preventScroll: true })
}
async function askMove(file: ManagedResourceFile) { targetReady.value = false; await openDialog({ ...file, action: 'move' }); await loadTarget(parent(file.path)) }
function askDelete(file: ManagedResourceFile) { return openDialog({ ...file, action: 'delete' }) }
function askRestore(file: ResourceTrashEntry) { return openDialog({ ...file, action: 'restore', trash_id: file.id }) }
async function loadTarget(path: string) {
  const version = ++targetVersion
  targetLoading.value = true; targetReady.value = false; dialogError.value = ''
  try {
    const result = await api.get({ url: '/api/management/resources/', query: { path } }); check(result)
    if (version !== targetVersion) return
    targetPath.value = result.content.path; targetDirectories.value = result.content.entries.filter(item => item.type === 'directory'); targetReady.value = true
  } catch (cause) { if (version === targetVersion) dialogError.value = cause instanceof Error ? cause.message : '目标目录加载失败。' }
  finally { if (version === targetVersion) targetLoading.value = false }
}
async function confirmAction() {
  const action = pending.value
  if (!action || busy.value) return
  busy.value = true; dialogError.value = ''; message.value = ''
  try {
    if (action.action === 'mkdir' || action.action === 'purge') {
      const query = action.action === 'mkdir' ? { action: 'mkdir' as const, path: action.path, name: newName.value } : { action: 'purge' as const, trash_ids: action.trash_ids!, confirmation: confirmation.value }
      const r = await api.post({ url: '/api/management/resources/operations/', query }); check(r)
      message.value = `已完成 ${r.content.completed} 项操作。`
      if (r.content.failed.length) {
        action.trash_ids = r.content.failed; await refresh()
        throw new Error(`已完成 ${r.content.completed} 项，另有 ${r.content.failed.length} 项未完成，请刷新回收站确认。`)
      }
    } else if (action.items && (action.action === 'move' || action.action === 'delete')) {
      const failed: ManagedResourceFile[] = [], failures: string[] = []
      let completed = 0
      for (const item of action.items) {
        try {
          const r = await api.post({ url: '/api/management/resources/action/', query: { action: action.action, path: item.path, version: item.version, ...(action.action === 'move' ? { destination: targetPath.value } : {}) } }); check(r); completed++
        } catch (cause) { failed.push(item); failures.push(`${item.name}：${cause instanceof Error ? cause.message : '操作失败'}`) }
      }
      if (failed.length) { action.items = failed; action.name = `剩余 ${failed.length} 个文件`; await refresh(); selectedRows.value = failed.map(item => item.path); throw new Error(`成功 ${completed} 个，失败 ${failed.length} 个。${failures.join('；')}`) }
      message.value = `已处理 ${completed} 个文件。`
    } else {
      const query: ResourceFileAction = action.action === 'restore'
        ? { action: 'restore', trash_id: action.trash_id! }
        : { action: action.action, path: action.path, version: action.version!, ...(action.action === 'move' ? { destination: targetPath.value } : {}), ...(action.action === 'rename' ? { name: newName.value } : {}) }
      const result = await api.post({ url: '/api/management/resources/action/', query }); check(result)
      message.value = action.action === 'delete' ? '文件已移入回收站。' : action.action === 'move' ? '文件已移动。' : action.action === 'rename' ? '文件已重命名。' : '文件已恢复。'
    }
    clearDialog(); await refresh()
  } catch (cause) { dialogError.value = cause instanceof Error ? cause.message : '操作失败。' }
  finally { busy.value = false }
}
watch(filter, () => { page.value = 1 })
onMounted(refresh)
onBeforeUnmount(() => { requestVersion++; targetVersion++ })
</script>
