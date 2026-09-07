<template>
  <section class="space-y-4" aria-label="资料文件管理">
    <div class="surface-card p-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div><h2 class="text-lg font-semibold">资料管理</h2><p class="mt-1 text-sm text-gray-500">管理已发布的资料。上传直接发布，删除后可从回收站恢复。</p></div>
        <div class="flex gap-2">
          <button :disabled="busy" class="btn-secondary disabled:opacity-40" @click="switchTrash">{{ showTrash ? '返回文件' : '回收站' }}</button>
          <button :disabled="busy || loading" class="btn-secondary disabled:opacity-40" @click="refresh">刷新</button>
        </div>
      </div>
      <p v-if="error" role="alert" class="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
      <p v-if="message" role="status" class="mt-4 text-sm text-emerald-700">{{ message }}</p>
      <fieldset v-if="!showTrash" :disabled="busy || loading" class="mt-5 min-w-0 disabled:opacity-60">
        <div class="flex flex-wrap items-center gap-3 text-sm">
          <button class="text-blue-700 hover:underline" @click="loadFiles('/')">根目录</button>
          <button :disabled="currentPath === '/'" class="text-blue-700 hover:underline disabled:opacity-40" @click="loadFiles(parent(currentPath))">上一级</button>
          <span class="min-w-0 flex-1 break-all text-gray-600">{{ currentPath }}</span>
          <a :href="resourcePageUrl(currentPath)" target="_blank" rel="noopener noreferrer" class="text-blue-700 hover:underline">查看公开页面</a>
          <button class="btn-secondary" @click="openDialog({ action: 'mkdir', name: '', path: currentPath })">新建文件夹</button>
        </div>
        <div class="mt-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
          <label class="block text-sm font-medium">上传到当前目录
            <input ref="fileInput" type="file" multiple class="mt-3 block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-blue-100 file:px-3 file:py-2 file:text-blue-700" @change="chooseFiles" />
          </label>
          <p class="mt-2 text-xs text-gray-500">每次最多 {{ maxFiles }} 个文件，单个不超过 {{ formatResourceSize(maxFileSize) }}。同名文件不覆盖。</p>
          <ul v-if="selectedFiles.length" class="mt-3 max-h-32 overflow-y-auto text-sm text-gray-600"><li v-for="file in selectedFiles" :key="file.name" class="break-all">{{ file.name }} · {{ formatResourceSize(file.size) }}</li></ul>
          <button v-if="selectedFiles.length" type="button" class="btn-primary mt-3" @click="upload">上传并发布 {{ selectedFiles.length }} 个文件</button>
        </div>
      </fieldset>
      <p v-if="busy" role="status" class="mt-4 text-sm text-blue-700">{{ uploading ? `正在上传 ${progress}%…` : '正在处理…' }}</p>
    </div>

    <ResourceTools v-show="!showTrash" :path="currentPath" @session-expired="emit('session-expired')" @changed="refresh" />

    <div class="surface-card overflow-hidden">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-4">
        <h3 class="font-medium">{{ showTrash ? '回收站' : '当前目录' }} <span class="text-sm font-normal text-gray-400">{{ filteredItems.length }} 项</span></h3>
        <input v-model="filter" type="search" :disabled="busy" aria-label="筛选管理文件" placeholder="按名称筛选…" class="max-w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
      </div>
      <div v-if="showTrash" class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 text-sm"><span class="text-gray-500">回收站占用 {{ formatResourceSize(trash.reduce((total, item) => total + item.size, 0)) }} · {{ trash.length }} 个文件</span><button :disabled="busy || loading || !trash.length" class="btn-danger disabled:opacity-40" @click="askPurge(trash)">清空回收站</button></div>
      <div v-else class="flex flex-wrap items-center gap-3 border-b border-gray-100 px-4 py-3 text-sm"><label class="flex items-center gap-2"><input type="checkbox" :disabled="busy || loading" :checked="pageSelected" @change="selectPage" />选择本页文件</label><span class="text-gray-500">已选 {{ selectedRows.length }} 个（最多 100 个）</span><button :disabled="busy || !selectedRows.length" class="btn-secondary disabled:opacity-40" @click="askBatch('move')">批量移动</button><button :disabled="busy || !selectedRows.length" class="btn-danger disabled:opacity-40" @click="askBatch('delete')">批量删除</button></div>
      <p v-if="loading" role="status" class="p-10 text-center text-sm text-gray-500">正在读取文件…</p>
      <template v-else>
        <ul v-if="showTrash" class="divide-y divide-gray-100">
          <li v-for="item in pagedTrash" :key="item.id" class="flex flex-wrap items-center gap-3 p-4">
            <div class="min-w-0 flex-1"><p class="break-all text-sm font-medium">{{ item.name }}</p><p class="mt-1 break-all text-xs text-gray-500">原位置：{{ item.path }}</p><p class="mt-1 text-xs text-gray-400">{{ formatResourceSize(item.size) }} · {{ new Date(item.deleted_at).toLocaleString('zh-CN') }}</p></div>
            <button :disabled="busy" class="btn-secondary shrink-0 disabled:opacity-40" :aria-label="`恢复 ${item.name}`" @click="askRestore(item)">恢复</button>
            <button :disabled="busy" class="btn-danger shrink-0 disabled:opacity-40" :aria-label="`永久删除 ${item.name}`" @click="askPurge([item])">永久删除</button>
          </li>
        </ul>
        <ul v-else class="divide-y divide-gray-100">
          <li v-for="item in pagedFiles" :key="item.path" class="flex flex-wrap items-center gap-3 p-4">
            <input v-if="item.type === 'file'" v-model="selectedRows" type="checkbox" :value="item.path" :aria-label="`选择 ${item.name}`" :disabled="busy || (selectedRows.length >= 100 && !selectedRows.includes(item.path))" />
            <component :is="item.type === 'directory' ? Folder : FileText" class="h-5 w-5 shrink-0" :class="item.type === 'directory' ? 'text-blue-500' : 'text-gray-400'" />
            <div class="min-w-0 flex-1">
              <button v-if="item.type === 'directory'" :disabled="busy" class="break-all text-left text-sm font-medium text-blue-700 hover:underline" @click="loadFiles(item.path)">{{ item.name }}</button>
              <p v-else class="break-all text-sm font-medium">{{ item.name }} <span v-if="item.name.toLowerCase() === 'readme.md'" class="text-xs font-normal text-amber-700">目录说明</span></p>
              <p class="mt-1 text-xs text-gray-400">{{ formatResourceSize(item.size) }} · {{ new Date(item.modified_at).toLocaleString('zh-CN') }}</p>
            </div>
            <div v-if="item.type === 'file'" class="flex shrink-0 gap-2">
              <button :disabled="busy" class="btn-secondary disabled:opacity-40" :aria-label="`重命名 ${item.name}`" @click="openDialog({ ...item, action: 'rename' })">重命名</button>
              <button :disabled="busy" class="btn-secondary disabled:opacity-40" :aria-label="`移动 ${item.name}`" @click="askMove(item)">移动</button>
              <button :disabled="busy" class="btn-danger disabled:opacity-40" :aria-label="`删除 ${item.name}`" @click="askDelete(item)">删除</button>
            </div>
          </li>
        </ul>
        <p v-if="!filteredItems.length" class="p-10 text-center text-sm text-gray-500">{{ filter ? '没有匹配的文件。' : showTrash ? '回收站为空。' : '此目录为空。' }}</p>
        <div v-if="pageCount > 1" class="flex items-center justify-center gap-4 border-t border-gray-100 p-4 text-sm"><button :disabled="page === 1 || busy" @click="page--">上一页</button><span>{{ page }} / {{ pageCount }}</span><button :disabled="page === pageCount || busy" @click="page++">下一页</button></div>
      </template>
    </div>

    <dialog ref="dialog" aria-labelledby="file-action-title" class="m-auto max-h-[85vh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-xl border border-gray-200 bg-white p-5 shadow-xl backdrop:bg-black/40" @cancel="cancelDialog">
      <template v-if="pending">
        <h3 id="file-action-title" class="text-lg font-semibold">{{ actionTitles[pending.action] }}</h3>
        <p class="mt-3 break-all text-sm text-gray-700">{{ pending.name }}</p>
        <ul v-if="pending.items" class="mt-3 max-h-32 overflow-y-auto text-xs text-gray-500"><li v-for="item in pending.items" :key="item.path" class="break-all">{{ item.name }}</li></ul>
        <label v-if="pending.action === 'rename' || pending.action === 'mkdir'" class="mt-4 block text-sm">{{ pending.action === 'rename' ? '新文件名' : '文件夹名称' }}<input v-model="newName" :disabled="busy" maxlength="255" class="mt-2 block w-full rounded-lg border border-gray-300 p-3" /></label>
        <div v-if="pending.action === 'purge'" class="mt-4 space-y-3 text-sm"><p class="text-red-700">将永久删除 {{ pending.trash_ids?.length }} 个文件（{{ formatResourceSize(pending.size || 0) }}），此操作无法恢复。</p><label class="block">输入“永久删除”确认<input v-model="confirmation" :disabled="busy" autocomplete="off" class="mt-2 block w-full rounded-lg border border-gray-300 p-3" /></label></div>
        <p v-if="pending.action === 'delete'" class="mt-3 text-sm leading-6 text-gray-600">文件将从公开目录移入回收站，之后可以恢复。</p>
        <p v-if="pending.action === 'restore'" class="mt-3 break-all text-sm leading-6 text-gray-600">恢复到 {{ pending.path }}。原位置已有同名文件时不会覆盖。</p>
        <fieldset v-if="pending.action === 'move'" :disabled="busy || targetLoading" class="mt-4 min-w-0 rounded-lg border border-gray-200">
          <div class="flex flex-wrap items-center gap-3 border-b border-gray-100 p-3 text-sm"><button class="text-blue-700" @click="loadTarget('/')">根目录</button><button :disabled="targetPath === '/'" class="text-blue-700 disabled:opacity-40" @click="loadTarget(parent(targetPath))">上一级</button><span class="min-w-0 break-all text-gray-500">{{ targetPath }}</span></div>
          <p v-if="targetLoading" role="status" class="p-4 text-sm text-gray-500">正在读取目标目录…</p>
          <ul v-else class="max-h-52 overflow-y-auto"><li v-for="item in targetDirectories" :key="item.path"><button class="flex w-full items-center gap-2 p-3 text-left text-sm text-blue-700 hover:bg-blue-50" @click="loadTarget(item.path)"><Folder class="h-4 w-4 shrink-0" /><span class="break-all">{{ item.name }}</span></button></li></ul>
          <p class="border-t border-gray-100 p-3 text-xs text-gray-500">选择文件夹后，点击下方“移动到此目录”。</p>
        </fieldset>
        <p v-if="dialogError" role="alert" class="mt-3 text-sm text-red-700">{{ dialogError }}</p>
        <div class="mt-6 flex justify-end gap-3"><button :disabled="busy" class="btn-secondary" @click="closeDialog">取消</button><button :disabled="busy || targetLoading || (pending.action === 'move' && (!targetReady || targetPath === parent(pending.path))) || (pending.action === 'purge' && confirmation !== '永久删除') || (['rename', 'mkdir'].includes(pending.action) && !newName.trim())" :class="['delete', 'purge'].includes(pending.action) ? 'btn-danger disabled:opacity-40' : 'btn-primary disabled:opacity-40'" @click="confirmAction">{{ busy ? '处理中…' : actionButtons[pending.action] }}</button></div>
      </template>
    </dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { FileText, Folder } from 'lucide-vue-next'
import ResourceTools from './ResourceTools.vue'
import { api } from '@/lib/requests'
import { formatResourceSize, resourcePageUrl } from '@/lib/resourceBrowser'
import type { ManagedResourceFile, ResourceFileAction, ResourceTrashEntry } from '@/types/api/management'

const emit = defineEmits<{ (event: 'session-expired'): void }>()
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
const dialog = ref<HTMLDialogElement>()
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
async function openDialog(value: Pending) { pending.value = value; dialogError.value = ''; newName.value = value.action === 'rename' ? value.name : ''; confirmation.value = ''; await nextTick(); dialog.value?.showModal() }
function closeDialog() { dialog.value?.close(); pending.value = null; targetVersion++; targetLoading.value = false }
function cancelDialog(event: Event) { if (busy.value) event.preventDefault(); else closeDialog() }
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
    closeDialog(); await refresh()
  } catch (cause) { dialogError.value = cause instanceof Error ? cause.message : '操作失败。' }
  finally { busy.value = false }
}
watch(filter, () => { page.value = 1 })
onMounted(refresh)
onBeforeUnmount(() => { requestVersion++; targetVersion++; dialog.value?.close() })
</script>
