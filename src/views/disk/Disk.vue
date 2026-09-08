<template>
  <AppPageLayout title="资料下载" description="前人栽树，后人乘凉。把知识与经验留给后来者。">
    <template #actions>
      <RouterLink to="/upload" class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
        <Upload class="h-4 w-4" />分享资料
      </RouterLink>
    </template>
    <nav aria-label="资料目录" class="mb-5 flex items-start justify-between gap-3">
      <ol class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-2 text-sm">
        <li><RouterLink to="/disk" class="inline-flex items-center gap-1.5 text-blue-700 hover:underline"><House class="h-4 w-4" />全部资料</RouterLink></li>
        <li v-for="(crumb, index) in breadcrumbs" :key="crumb.path" class="flex min-w-0 items-center gap-2">
          <ChevronRight class="h-4 w-4 shrink-0 text-gray-400" />
          <span v-if="index === breadcrumbs.length - 1" aria-current="page" class="break-all text-gray-700">{{ crumb.name }}</span>
          <RouterLink v-else :to="resourcePageUrl(crumb.path)" class="break-all text-blue-700 hover:underline">{{ crumb.name }}</RouterLink>
        </li>
      </ol>
      <button type="button" class="shrink-0 rounded-lg p-2 text-gray-500 hover:bg-gray-200 disabled:opacity-50" aria-label="刷新目录" :disabled="loading" @click="loadContents">
        <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
      </button>
    </nav>
    <div v-if="loading" role="status" class="rounded-xl border border-gray-200 bg-white p-12 text-center text-gray-500">正在加载资料…</div>
    <section v-else-if="error" role="alert" class="rounded-xl border border-red-100 bg-white p-10 text-center">
      <p class="text-red-700">{{ error }}</p>
      <div class="mt-5 flex justify-center gap-5 text-sm text-blue-700">
        <RouterLink v-if="loginRequired" :to="{ path: '/login', query: { redirect: route.fullPath } }">登录后访问</RouterLink>
        <button type="button" @click="loadContents">重新加载</button>
        <RouterLink to="/disk">返回全部资料</RouterLink>
      </div>
    </section>
    <template v-else-if="contents">
      <section v-if="readmeHtml" aria-label="目录说明" class="mb-6 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm sm:px-7 sm:py-5">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-sm font-medium text-gray-700">目录说明</h2>
          <button type="button" :aria-expanded="!readmeCollapsed" aria-controls="resource-readme-content" class="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-sm text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="toggleReadme">
            {{ readmeCollapsed ? '展开' : '收起' }}
            <ChevronDown aria-hidden="true" class="h-4 w-4 transition-transform" :class="{ 'rotate-180': !readmeCollapsed }" />
          </button>
        </div>
        <div v-show="!readmeCollapsed" id="resource-readme-content" class="resource-readme prose prose-slate mt-4 max-w-none prose-a:text-blue-600" v-html="readmeHtml" @click="followReadmeLink" />
      </section>
      <p v-if="contents.readme_warning" role="status" class="mb-4 text-sm text-amber-700">{{ contents.readme_warning }}</p>
      <section v-if="contents.type === 'directory'" aria-label="文件列表" class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-4 sm:px-5">
          <span class="text-sm text-gray-500">{{ directoryCount }} 个文件夹 · {{ fileCount }} 个文件</span>
          <div class="flex w-full items-center gap-2 sm:w-auto">
            <div class="relative min-w-0 flex-1 sm:w-60">
              <Search class="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input v-model="filter" type="search" maxlength="200" aria-label="全局搜索资料" placeholder="全局搜索资料…" class="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" @keydown.enter.prevent="queueSearch(0)" />
            </div>
            <select v-model="sort" aria-label="排序方式" class="max-w-36 rounded-lg border border-gray-200 px-2 py-2 text-sm text-gray-600 focus:outline-blue-500">
              <option value="name">名称排序</option><option value="modified">最近更新</option><option value="size">文件大小</option>
            </select>
          </div>
        </div>
        <div class="resource-row border-b border-gray-100 px-4 py-3 text-xs font-medium text-gray-500 sm:px-5" aria-hidden="true">
          <span>名称</span><span class="hidden sm:block">修改时间</span><span class="text-right">大小</span><span />
        </div>
        <RouterLink v-if="currentPath !== '/'" :to="resourcePageUrl(parentPath)" class="flex items-center gap-3 border-b border-gray-50 px-4 py-3 text-sm text-gray-500 hover:bg-blue-50 sm:px-5">
          <CornerLeftUp class="h-5 w-5" />返回上一级
        </RouterLink>
        <p v-if="searching" class="border-b border-gray-100 px-5 py-3 text-xs text-gray-500">搜索全部可访问资料，当前目录下的文件和文件夹优先。</p>
        <p v-if="searching && searchLoading" role="status" class="px-5 py-8 text-center text-sm text-gray-500">正在搜索全部资料…</p>
        <div v-else-if="searching && searchError" role="alert" class="px-5 py-8 text-center text-sm text-red-700">{{ searchError }} <button class="ml-2 text-blue-700 hover:underline" @click="queueSearch(0)">重试搜索</button></div>
        <ul v-else>
          <li v-for="entry in pagedEntries" :key="entry.path" class="resource-row group border-b border-gray-50 px-4 py-3 hover:bg-blue-50/60 sm:px-5">
            <RouterLink :to="resourcePageUrl(entry.path)" class="flex min-w-0 items-center gap-3 text-sm text-gray-800 group-hover:text-blue-700">
              <component :is="entry.type === 'directory' ? Folder : FileText" class="h-6 w-6 shrink-0" :class="entry.type === 'directory' ? 'fill-blue-100 text-blue-500' : 'text-gray-400'" />
              <span class="min-w-0 break-all">{{ entry.name }}<span v-if="searching" class="mt-1 block text-xs text-gray-500">{{ entryParent(entry.path) === currentPath ? '当前目录' : entryParent(entry.path) }}</span></span>
            </RouterLink>
            <time :datetime="entry.modified_at" class="hidden text-xs text-gray-400 sm:block">{{ formatDate(entry.modified_at) }}</time>
            <span class="text-right text-xs tabular-nums text-gray-500">{{ formatResourceSize(entry.size) }}</span>
            <button v-if="entry.type === 'file'" type="button" :aria-label="`下载 ${entry.name}`" class="rounded-md p-1 text-gray-400 hover:bg-blue-100 hover:text-blue-700" @click="openResource(entry.path, false)"><Download class="h-4 w-4" /></button>
            <ChevronRight v-else class="h-4 w-4 text-gray-300" />
          </li>
        </ul>
        <div v-if="!totalEntries && !searchLoading && !searchError" role="status" class="px-5 py-12 text-center text-sm text-gray-500">
          {{ filter ? '没有找到匹配的资料，试试其他关键词。' : '这个目录还没有资料。' }}
        </div>
        <div class="flex items-center justify-between gap-3 px-5 py-4 text-xs text-gray-400">
          <span>{{ searching ? (searchLoading ? '搜索中…' : searchError ? '搜索未完成' : `全局找到 ${totalEntries} 项`) : '资料仅供学习交流，请勿用于商业用途。' }}</span>
          <div v-if="pageCount > 1" class="flex shrink-0 items-center gap-3 text-gray-600">
            <button :disabled="page === 1" class="disabled:opacity-30" @click="page--">上一页</button><span>{{ page }} / {{ pageCount }}</span><button :disabled="page === pageCount" class="disabled:opacity-30" @click="page++">下一页</button>
          </div>
        </div>
      </section>
      <section v-else aria-label="文件详情" class="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm sm:p-12">
        <FileText class="mx-auto h-20 w-20 text-blue-500" />
        <h2 class="mt-5 break-all text-xl font-semibold text-gray-900">{{ contents.name }}</h2>
        <p class="mt-3 text-sm text-gray-500">{{ formatResourceSize(contents.size) }} · {{ formatDate(contents.modified_at) }}</p>
        <div class="mt-7 flex flex-wrap justify-center gap-3">
          <button type="button" class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700" @click="openResource(contents.path, false)"><Download class="h-4 w-4" />下载文件</button>
          <button v-if="canPreview" type="button" class="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-50" @click="openResource(contents.path, true)"><ExternalLink class="h-4 w-4" />打开预览</button>
          <button type="button" class="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-50" @click="copyLink"><Link class="h-4 w-4" />复制链接</button>
        </div>
        <p role="status" class="mt-3 text-sm text-gray-500">{{ copyMessage }}</p>
        <p v-if="!canPreview" class="mt-5 text-sm text-gray-400">此格式请下载后使用相应软件打开。</p>
        <img v-if="isImage && imagePreviewUrl" :src="imagePreviewUrl" :alt="contents.name" class="mx-auto mt-8 max-h-[70vh] max-w-full rounded-lg object-contain" />
      </section>
    </template>
  </AppPageLayout>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronDown, ChevronRight, CornerLeftUp, Download, ExternalLink, FileText, Folder, House, Link, RefreshCw, Search, Upload } from 'lucide-vue-next'
import AppPageLayout from '@/components/layout/AppPageLayout.vue'
import { formatResourceSize, renderResourceReadme, resourceFileUrl, resourcePageUrl, type ResourceContents, type ResourceEntry } from '@/lib/resourceBrowser'
import { api } from '@/lib/requests'

const route = useRoute()
const router = useRouter()
const currentPath = computed(() => {
  const parts = route.params.path
  return '/' + (Array.isArray(parts) ? parts.join('/') : parts || '')
})
const parentPath = computed(() => currentPath.value.slice(0, currentPath.value.lastIndexOf('/')) || '/')
const breadcrumbs = computed(() => {
  const parts = currentPath.value.split('/').filter(Boolean)
  return parts.map((name, index) => ({ name, path: '/' + parts.slice(0, index + 1).join('/') }))
})
const contents = ref<ResourceContents | null>(null)
const readmeHtml = ref('')
const readmePreferenceKey = 'nwuicu:resource-readme-collapsed'
function readReadmePreference() {
  try { return localStorage.getItem(readmePreferenceKey) === 'true' } catch { return false }
}
const readmeCollapsed = ref(readReadmePreference())
function toggleReadme() {
  readmeCollapsed.value = !readmeCollapsed.value
  try { localStorage.setItem(readmePreferenceKey, String(readmeCollapsed.value)) } catch {
    // Keep the toggle usable when the browser blocks persistent storage.
  }
}
const error = ref('')
const loginRequired = ref(false)
const loading = ref(true)
const filter = ref('')
const sort = ref('name')
const page = ref(1)
const copyMessage = ref('')
const imagePreviewUrl = ref('')
let controller: AbortController | undefined
let loadVersion = 0
const searching = computed(() => !!filter.value.trim())
const searchEntries = ref<ResourceEntry[]>([])
const searchTotal = ref(0)
const searchLoading = ref(false)
const searchError = ref('')
let searchController: AbortController | undefined
let searchVersion = 0
let searchTimer: ReturnType<typeof setTimeout> | undefined
const entryParent = (path: string) => path.slice(0, path.lastIndexOf('/')) || '/'

function queueSearch(delay = 250) {
  clearTimeout(searchTimer)
  searchController?.abort()
  const version = ++searchVersion
  searchEntries.value = []; searchTotal.value = 0; searchError.value = ''
  searchLoading.value = searching.value
  if (!searching.value) return
  searchTimer = setTimeout(async () => {
    const active = new AbortController(); searchController = active
    try {
      const params = new URLSearchParams({ q: filter.value.trim(), path: currentPath.value, page: String(page.value), sort: sort.value })
      const response = await fetch(`/api/resources/search/?${params}`, { signal: active.signal })
      if (!response.ok) throw new Error(response.status === 401 ? '请登录后重新搜索。' : response.status === 404 ? '当前目录不存在或无权访问，请刷新目录。' : '搜索暂时不可用，请稍后重试。')
      const data = (await response.json()).contents as { entries: ResourceEntry[]; total_count: number }
      if (version !== searchVersion) return
      searchEntries.value = data.entries; searchTotal.value = data.total_count
    } catch (cause) {
      if (version === searchVersion && !active.signal.aborted) searchError.value = cause instanceof Error ? cause.message : '搜索失败。'
    } finally { if (version === searchVersion) searchLoading.value = false }
  }, delay)
}

async function loadContents() {
  const version = ++loadVersion
  controller?.abort()
  controller = new AbortController()
  loading.value = true
  error.value = ''
  loginRequired.value = false
  readmeHtml.value = ''
  copyMessage.value = ''
  imagePreviewUrl.value = ''
  contents.value = null
  try {
    const response = await fetch(`/api/resources/browse/?${new URLSearchParams({ path: currentPath.value })}`, { signal: controller.signal })
    if (!response.ok) {
      loginRequired.value = response.status === 401
      throw new Error(response.status === 401 ? '此目录需要登录后访问。' : response.status === 404 ? '这个资料不存在、已移动或无权访问。' : response.status === 400 ? '资料路径不合法。' : '暂时无法读取资料，请稍后重试。')
    }
    const data = (await response.json()).contents as ResourceContents
    let html = await renderResourceReadme(data.readme || '', data.type === 'directory' ? data.path : parentPath.value)
    if (data.download_gate_enabled) html = await authorizeReadmeImages(html)
    if (version !== loadVersion) return
    contents.value = data
    readmeHtml.value = html
    if (data.type === 'file' && /\.(png|jpe?g|gif|webp|avif)$/i.test(data.name)) {
      imagePreviewUrl.value = data.download_gate_enabled
        ? await authorizedResourceUrl(data.path, true)
        : resourceFileUrl(data.path, true)
    }
    page.value = 1
    if (searching.value) queueSearch(0)
  } catch (reason) {
    if (version === loadVersion && !controller.signal.aborted) error.value = reason instanceof Error ? reason.message : '加载资料失败。'
  } finally {
    if (version === loadVersion) loading.value = false
  }
}

const entries = computed(() => (contents.value?.entries || []).filter(entry => entry.name.toLowerCase() !== 'readme.md'))
const directoryCount = computed(() => entries.value.filter(entry => entry.type === 'directory').length)
const fileCount = computed(() => entries.value.length - directoryCount.value)
const collator = new Intl.Collator('zh-CN', { numeric: true, sensitivity: 'base' })
const filteredEntries = computed(() => [...entries.value].sort((a, b) => {
  if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
  if (sort.value === 'modified') return b.modified_at.localeCompare(a.modified_at) || collator.compare(a.name, b.name)
  if (sort.value === 'size') return (b.size || 0) - (a.size || 0) || collator.compare(a.name, b.name)
  return collator.compare(a.name, b.name)
}))
const totalEntries = computed(() => searching.value ? searchTotal.value : filteredEntries.value.length)
const pageCount = computed(() => Math.max(1, Math.ceil(totalEntries.value / 100)))
const pagedEntries = computed(() => searching.value ? searchEntries.value : filteredEntries.value.slice((page.value - 1) * 100, page.value * 100))
const canPreview = computed(() => /\.(pdf|png|jpe?g|gif|webp|avif|txt)$/i.test(contents.value?.name || ''))
const isImage = computed(() => /\.(png|jpe?g|gif|webp|avif)$/i.test(contents.value?.name || ''))
const formatDate = (date: string) => new Date(date).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })

async function authorizedResourceUrl(path: string, inline: boolean) {
  const response = await api.post({ url: '/api/resources/file/authorize/', query: { path, inline } })
  if (response.status !== 200) throw new Error(response.errors?.[0]?.err_msg || '资料授权失败，请稍后重试')
  return response.content.url
}

async function authorizeReadmeImages(html: string) {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  for (const image of doc.querySelectorAll('img')) {
    const source = image.getAttribute('src') || ''
    const url = new URL(source, window.location.origin)
    if (url.pathname !== '/api/resources/file/') continue
    const path = url.searchParams.get('path')
    if (path) image.setAttribute('src', await authorizedResourceUrl(path, true))
  }
  return doc.body.innerHTML
}

async function openResource(path: string, inline: boolean) {
  const previewWindow = inline ? window.open('', '_blank') : null
  if (previewWindow) previewWindow.opener = null
  try {
    const url = contents.value?.download_gate_enabled
      ? await authorizedResourceUrl(path, inline)
      : resourceFileUrl(path, inline)
    if (previewWindow) previewWindow.location.href = url
    else window.location.assign(url)
  } catch (cause) {
    previewWindow?.close()
    error.value = cause instanceof Error ? cause.message : '资料访问失败，请稍后重试'
  }
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    copyMessage.value = '链接已复制'
  } catch {
    copyMessage.value = '复制失败，请复制浏览器地址栏中的链接。'
  }
}
function followReadmeLink(event: MouseEvent) {
  const anchor = (event.target as Element).closest('a')
  if (!anchor || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
  const href = anchor.getAttribute('href') || ''
  if (href.startsWith('/disk/')) { event.preventDefault(); void router.push(href) }
}
watch(currentPath, () => { filter.value = ''; queueSearch(); void loadContents() }, { immediate: true })
watch([filter, sort], () => { page.value = 1; queueSearch() })
watch(page, () => { if (searching.value) queueSearch(0) })
onBeforeUnmount(() => { loadVersion++; controller?.abort(); searchVersion++; searchController?.abort(); clearTimeout(searchTimer) })
</script>

<style scoped>
.resource-row { display: grid; grid-template-columns: minmax(0, 1fr) 70px 24px; align-items: center; gap: 12px; }
@media (min-width: 640px) { .resource-row { grid-template-columns: minmax(0, 1fr) 110px 85px 24px; gap: 20px; } }
.resource-readme { overflow-wrap: anywhere; }
.resource-readme :deep(pre) { overflow-x: auto; }
.resource-readme :deep(table) { display: block; max-width: 100%; overflow-x: auto; }
.resource-readme :deep(img) { max-width: 100%; height: auto; }
</style>
