<template>
  <AppPageLayout title="资料下载" appearance="shadcn" :class="{ 'pb-28': archives.state.selecting }">
    <template #actions>
      <RouterLink to="/upload" class="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2">
        <Upload class="h-4 w-4" aria-hidden="true" />分享资料
      </RouterLink>
    </template>
    <nav aria-label="资料目录" class="mb-5 flex items-start justify-between gap-3">
      <ol class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-2 text-sm">
        <li><RouterLink to="/disk" class="inline-flex items-center gap-1.5 rounded-sm text-zinc-500 transition-colors hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"><House class="h-4 w-4" aria-hidden="true" />全部资料</RouterLink></li>
        <li v-for="(crumb, index) in breadcrumbs" :key="crumb.path" class="flex min-w-0 items-center gap-2">
          <ChevronRight class="h-4 w-4 shrink-0 text-zinc-400" />
          <span v-if="index === breadcrumbs.length - 1" aria-current="page" class="break-all text-zinc-700">{{ crumb.name }}</span>
          <RouterLink v-else :to="resourcePageUrl(crumb.path)" class="break-all rounded-sm text-zinc-500 transition-colors hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400">{{ crumb.name }}</RouterLink>
        </li>
      </ol>
      <button type="button" class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-500 shadow-sm transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" aria-label="刷新目录" :disabled="loading" @click="loadContents">
        <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
      </button>
    </nav>
    <div v-if="loading" role="status" class="flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white text-sm text-zinc-500">
      <LoaderCircle class="h-5 w-5 animate-spin" aria-hidden="true" />正在加载资料…
    </div>
    <section v-else-if="error" role="alert" class="rounded-xl border border-zinc-200 bg-white px-5 py-14 text-center shadow-sm">
      <CircleAlert class="mx-auto h-6 w-6 text-red-500" aria-hidden="true" />
      <p class="mt-4 text-sm font-medium text-zinc-950">{{ error }}</p>
      <div class="mt-6 flex flex-wrap justify-center gap-2 text-sm">
        <RouterLink v-if="loginRequired" :to="{ path: '/login', query: { redirect: route.fullPath } }" class="inline-flex h-10 items-center justify-center rounded-md bg-zinc-950 px-4 font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2">登录后访问</RouterLink>
        <button type="button" class="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-4 font-medium shadow-sm transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2" @click="loadContents"><RefreshCw class="h-4 w-4" aria-hidden="true" />重新加载</button>
        <RouterLink to="/disk" class="inline-flex h-10 items-center justify-center rounded-md border border-zinc-200 bg-white px-4 font-medium shadow-sm transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2">返回全部资料</RouterLink>
      </div>
    </section>
    <template v-else-if="contents">
      <section v-if="readmeHtml" aria-label="目录说明" class="mb-6 rounded-xl border border-zinc-200 bg-white px-5 py-4 shadow-sm sm:px-7 sm:py-5">
        <div class="flex items-center justify-between gap-3">
          <h2 class="inline-flex items-center gap-2 text-sm font-medium text-zinc-900"><BookOpen class="h-4 w-4 text-zinc-500" aria-hidden="true" />目录说明</h2>
          <button type="button" :aria-expanded="!readmeCollapsed" aria-controls="resource-readme-content" class="inline-flex h-8 shrink-0 items-center gap-1 rounded-md px-2 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400" @click="toggleReadme">
            {{ readmeCollapsed ? '展开' : '收起' }}
            <ChevronDown aria-hidden="true" class="h-4 w-4 transition-transform" :class="{ 'rotate-180': !readmeCollapsed }" />
          </button>
        </div>
        <div v-show="!readmeCollapsed" id="resource-readme-content" class="resource-readme prose prose-sm prose-zinc mt-4 max-w-none prose-headings:font-semibold prose-a:text-zinc-900 prose-a:underline-offset-4" v-html="readmeHtml" @click="followReadmeLink" />
      </section>
      <p v-if="contents.readme_warning" role="status" class="mb-4 rounded-md border border-amber-200 bg-amber-50/50 px-4 py-3 text-sm text-amber-700">{{ contents.readme_warning }}</p>
      <section v-if="contents.type === 'directory'" aria-label="文件列表" class="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 p-4 sm:px-5">
          <div class="flex flex-wrap items-center gap-3 text-sm">
            <span class="text-zinc-500">{{ directoryCount }} 个文件夹 · {{ fileCount }} 个文件</span>
            <template v-if="archives.state.selecting">
              <button type="button" :disabled="archives.state.busy" class="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" @click="archives.state.selecting = false; archives.state.selected = []"><X aria-hidden="true" class="h-4 w-4 shrink-0" />取消选择</button>
            </template>
            <button v-else type="button" class="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2" @click="archives.startSelection()"><Download aria-hidden="true" class="h-4 w-4 shrink-0" />批量下载</button>
          </div>
          <div class="flex w-full items-center gap-2 sm:w-auto">
            <div class="relative min-w-0 flex-1 sm:w-60">
              <Search class="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input :value="filter" type="search" maxlength="200" aria-label="全局搜索资料" placeholder="搜索资料…" class="h-9 w-full rounded-md border border-zinc-200 bg-white pl-9 pr-3 text-sm shadow-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2" @input="updateFilter" @keydown.enter.prevent="queueSearch(0)" />
            </div>
          </div>
        </div>
        <div class="resource-row min-h-11 border-b border-zinc-200 bg-zinc-50/70 px-4 text-xs font-medium text-zinc-500 sm:px-5">
          <div v-for="column in sortColumns" :key="column.key" class="flex min-w-0 items-center gap-2" :class="{ 'justify-end': column.key === 'size' }">
            <input v-if="column.key === 'name' && archives.state.selecting" type="checkbox" class="h-4 w-4 shrink-0 rounded border-zinc-300 accent-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2" aria-label="全选本页文件" :checked="archives.pageSelected" :indeterminate="archives.pagePartiallySelected" :disabled="archives.state.busy || !pagedEntries.some(entry => entry.type === 'file')" @change="toggleArchivePage" />
            <button type="button" :data-sort="column.key" :aria-label="sortLabel(column.key, column.label)" class="inline-flex min-h-11 items-center gap-0.5 whitespace-nowrap rounded transition-colors hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400" :class="{ 'text-zinc-950': sort === column.key }" @click="toggleSort(column.key)">
              {{ column.label }}<component :is="sort === column.key ? (sortDirection === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown" aria-hidden="true" class="h-3 w-3 shrink-0" :class="{ 'text-zinc-400': sort !== column.key }" />
            </button>
          </div><span />
        </div>
        <RouterLink v-if="currentPath !== '/'" :to="resourcePageUrl(parentPath)" class="flex items-center gap-3 border-b border-zinc-100 px-4 py-3 text-sm text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-400 sm:px-5">
          <CornerLeftUp class="h-5 w-5" />返回上一级
        </RouterLink>
        <p v-if="searching && searchLoading" role="status" class="px-5 py-8 text-center text-sm text-zinc-500">正在搜索全部资料…</p>
        <div v-else-if="searching && searchError" role="alert" class="px-5 py-8 text-center text-sm text-red-600">{{ searchError }} <button type="button" class="ml-2 rounded-sm font-medium text-zinc-700 underline underline-offset-4 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400" @click="queueSearch(0)">重试搜索</button></div>
        <ul v-else>
          <li v-for="entry in pagedEntries" :key="entry.path" class="resource-row resource-entry group border-b border-zinc-100 px-4 py-3 transition-colors last:border-b-0 hover:bg-zinc-50 sm:px-5">
            <label v-if="archives.state.selecting && entry.type === 'file'" class="resource-entry-name flex min-h-9 min-w-0 cursor-pointer items-center gap-3 text-sm text-zinc-900">
              <input type="checkbox" class="h-4 w-4 shrink-0 rounded border-zinc-300 accent-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2" :aria-label="`选择 ${entry.name}`" :checked="archives.state.selected.some(item => item.path === entry.path)" :disabled="archives.state.busy" @change="toggleArchiveFile($event, entry)" />
              <span class="min-w-0 break-all">{{ entry.name }}<span v-if="searching" class="mt-1 block text-xs text-zinc-500">{{ entryParent(entry.path) }}</span></span>
            </label>
            <RouterLink v-else :to="resourcePageUrl(entry.path)" class="resource-entry-name flex min-h-9 min-w-0 items-center gap-3 rounded-sm text-sm text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400">
              <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100"><component :is="entry.type === 'directory' ? Folder : FileText" class="h-4 w-4 text-zinc-500" aria-hidden="true" /></span>
              <span class="min-w-0 break-all">{{ entry.name }}<span v-if="searching" class="mt-1 block text-xs text-zinc-500">{{ entryParent(entry.path) === currentPath ? '当前目录' : entryParent(entry.path) }}</span></span>
            </RouterLink>
            <div class="resource-entry-meta" :class="{ 'resource-selection-meta': archives.state.selecting && entry.type === 'file' }">
              <time :datetime="entry.modified_at" class="text-xs text-zinc-500">{{ formatDate(entry.modified_at) }}</time>
              <span class="text-right text-xs tabular-nums text-zinc-500">{{ formatResourceSize(entry.size) }}</span>
            </div>
            <button v-if="entry.type === 'file'" type="button" :aria-label="`下载 ${entry.name}`" class="resource-entry-action inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400" @click="openResource(entry.path, false)"><Download class="h-4 w-4" aria-hidden="true" /></button>
            <ChevronRight v-else class="resource-entry-action h-4 w-4 justify-self-center text-zinc-400" aria-hidden="true" />
          </li>
        </ul>
        <div v-if="!totalEntries && !searchLoading && !searchError" role="status" class="flex flex-col items-center justify-center px-5 py-14 text-sm text-zinc-500">
          <FolderOpen class="mb-3 h-6 w-6 text-zinc-400" aria-hidden="true" />{{ filter ? '没有找到匹配的资料，试试其他关键词。' : '这个目录还没有资料。' }}
        </div>
        <div class="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 px-5 py-4 text-xs text-zinc-500">
          <span>{{ searching ? (searchLoading ? '搜索中…' : searchError ? '搜索未完成' : `全局找到 ${totalEntries} 项`) : '资料仅供学习交流，请勿用于商业用途。' }}</span>
        </div>
      </section>
      <div v-if="contents.type === 'directory' && pageCount > 1" class="mt-8 flex justify-center"><ReviewPagination :page="page" :page-count="pageCount" @update:page="changePage" /></div>
      <section v-if="contents.type === 'file'" aria-label="文件详情" class="rounded-xl border border-zinc-200 bg-white p-6 text-center shadow-sm sm:p-12">
        <span class="mx-auto flex h-16 w-16 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50"><FileText class="h-7 w-7 text-zinc-500" aria-hidden="true" /></span>
        <h2 class="mt-5 break-all text-xl font-semibold text-zinc-900">{{ contents.name }}</h2>
        <p class="mt-3 text-sm text-zinc-500">{{ formatResourceSize(contents.size) }} · {{ formatDate(contents.modified_at) }}</p>
        <div class="mt-7 flex flex-wrap justify-center gap-3">
          <button type="button" class="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2" @click="openResource(contents.path, false)"><Download class="h-4 w-4" aria-hidden="true" />下载文件</button>
          <button v-if="canPreview" type="button" class="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2" @click="openResource(contents.path, true)"><ExternalLink class="h-4 w-4" aria-hidden="true" />打开预览</button>
          <button type="button" class="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2" @click="copyLink"><Link class="h-4 w-4" aria-hidden="true" />复制链接</button>
        </div>
        <p v-if="previewError" role="status" class="mx-auto mt-5 max-w-lg rounded-md border border-amber-200 bg-amber-50/50 px-4 py-3 text-sm text-amber-700">{{ previewError }}</p>
        <p v-if="!canPreview" class="mt-5 text-sm text-zinc-400">此格式请下载后使用相应软件打开。</p>
        <img v-if="isImage && imagePreviewUrl" :src="imagePreviewUrl" :alt="contents.name" class="mx-auto mt-8 max-h-[70vh] max-w-full rounded-md object-contain" />
      </section>
    </template>
    <ResourceArchivePanel :control="archives" />
  </AppPageLayout>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowDown, ArrowUp, ArrowUpDown, BookOpen, ChevronDown, ChevronRight, CircleAlert, CornerLeftUp, Download, ExternalLink, FileText, Folder, FolderOpen, House, Link, LoaderCircle, RefreshCw, Search, Upload, X } from 'lucide-vue-next'
import AppPageLayout from '@/components/layout/AppPageLayout.vue'
import ReviewPagination from '@/components/courseReview/ReviewPagination.vue'
import ResourceArchivePanel from '@/components/disk/ResourceArchivePanel.vue'
import { useResourceArchives } from '@/lib/useResourceArchives'
import { formatResourceSize, renderResourceReadme, resourceFileUrl, resourcePageUrl, resourceMetadata, takeResourceBootstrap, type ResourceContents, type ResourceEntry } from '@/lib/resourceBrowser'
import { setPageMetadata } from '@/lib/pageMetadata'
import { api } from '@/lib/requests'
import { useShadcnToast } from '@/lib/useShadcnToast'

const route = useRoute()
const router = useRouter()
const toast = useShadcnToast()
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
type SortKey = 'name' | 'modified' | 'size'
const sortColumns: { key: SortKey; label: string }[] = [{ key: 'name', label: '名称' }, { key: 'modified', label: '修改时间' }, { key: 'size', label: '大小' }]
const sort = ref<SortKey>('name')
const sortDirection = ref<'asc' | 'desc'>('asc')
function toggleSort(key: SortKey) {
  sortDirection.value = sort.value === key ? (sortDirection.value === 'asc' ? 'desc' : 'asc') : (key === 'name' ? 'asc' : 'desc')
  sort.value = key
  page.value = 1
  saveListingLocation()
}
function sortLabel(key: SortKey, label: string) {
  return sort.value === key ? `${label}，当前${sortDirection.value === 'asc' ? '正序' : '倒序'}，点击切换` : `按${label}排序`
}
const page = ref(1)
function saveListingLocation() {
  const query = { ...route.query }
  for (const key of ['q', 'sort', 'direction', 'page']) delete query[key]
  if (filter.value) query.q = filter.value
  if (sort.value !== 'name') query.sort = sort.value
  if (sortDirection.value !== (sort.value === 'name' ? 'asc' : 'desc')) query.direction = sortDirection.value
  if (page.value > 1) query.page = String(page.value)
  // Update this listing's history entry; opening a result pushes a separate entry.
  void router.replace({ path: route.path, query, hash: route.hash })
}
function updateFilter(event: Event) {
  filter.value = (event.target as HTMLInputElement).value
  page.value = 1
  saveListingLocation()
}
function changePage(value: number) {
  page.value = value
  saveListingLocation()
}
const previewError = ref('')
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

function resetSearch() {
  clearTimeout(searchTimer)
  searchController?.abort()
  const version = ++searchVersion
  searchEntries.value = []; searchTotal.value = 0; searchError.value = ''
  searchLoading.value = searching.value
  return version
}
function queueSearch(delay = 600) {
  const version = resetSearch()
  if (!searching.value) return
  searchTimer = setTimeout(async () => {
    const active = new AbortController(); searchController = active
    try {
      const params = new URLSearchParams({ q: filter.value.trim(), path: currentPath.value, page: String(page.value), sort: sort.value, direction: sortDirection.value })
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
  let noindex = false
  controller?.abort()
  controller = new AbortController()
  loading.value = true
  error.value = ''
  loginRequired.value = false
  readmeHtml.value = ''
  previewError.value = ''
  imagePreviewUrl.value = ''
  contents.value = null
  setPageMetadata({ title: '资料下载' })
  try {
    let data = takeResourceBootstrap(currentPath.value)
    if (!data) {
      const response = await fetch(`/api/resources/browse/?${new URLSearchParams({ path: currentPath.value })}`, { signal: controller.signal })
      if (!response.ok) {
        noindex = [400, 401, 403, 404, 410].includes(response.status)
        loginRequired.value = response.status === 401
        throw new Error(response.status === 401 ? '此目录需要登录后访问。' : response.status === 404 ? '这个资料不存在、已移动或无权访问。' : response.status === 400 ? '资料路径不合法。' : '暂时无法读取资料，请稍后重试。')
      }
      data = (await response.json()).contents as ResourceContents
    }
    let html = await renderResourceReadme(data.readme || '', data.type === 'directory' ? data.path : parentPath.value)
    if (data.download_gate_enabled) html = await authorizeReadmeImages(html)
    if (version !== loadVersion) return
    contents.value = data
    setPageMetadata(resourceMetadata(data))
    readmeHtml.value = html
    if (data.type === 'file' && /\.(png|jpe?g|gif|webp|avif)$/i.test(data.name)) {
      try {
        const previewUrl = data.download_gate_enabled
          ? await authorizedResourceUrl(data.path, true)
          : resourceFileUrl(data.path, true)
        if (version !== loadVersion) return
        imagePreviewUrl.value = previewUrl
      } catch {
        if (version !== loadVersion) return
        previewError.value = '图片预览暂不可用，可点击打开预览重试。'
      }
    }
    if (searching.value) queueSearch(0)
  } catch (reason) {
    if (version === loadVersion && !controller.signal.aborted) {
      error.value = reason instanceof Error ? reason.message : '加载资料失败。'
      setPageMetadata({ title: loginRequired.value ? '资料需要登录' : '资料暂不可用', noindex })
    }
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
  const direction = sortDirection.value === 'asc' ? 1 : -1
  if (sort.value === 'modified') return direction * a.modified_at.localeCompare(b.modified_at) || collator.compare(a.name, b.name)
  if (sort.value === 'size') return direction * ((a.size || 0) - (b.size || 0)) || collator.compare(a.name, b.name)
  return direction * collator.compare(a.name, b.name)
}))
const totalEntries = computed(() => searching.value ? searchTotal.value : filteredEntries.value.length)
const pageCount = computed(() => Math.max(1, Math.ceil(totalEntries.value / 100)))
const pagedEntries = computed(() => searching.value ? searchEntries.value : filteredEntries.value.slice((page.value - 1) * 100, page.value * 100))
const archives = useResourceArchives(pagedEntries, computed(() => `${currentPath.value}\n${filter.value}`))
function toggleArchivePage(event: Event) {
  archives.selectPage()
  const checkbox = event.target as HTMLInputElement
  checkbox.checked = archives.pageSelected
  checkbox.indeterminate = archives.pagePartiallySelected
}
function toggleArchiveFile(event: Event, entry: ResourceEntry) {
  archives.toggle(entry)
  // Restore the native checkbox when a size/count limit rejects the selection.
  ;(event.target as HTMLInputElement).checked = archives.state.selected.some(item => item.path === entry.path)
}
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
    if (path) {
      try { image.setAttribute('src', await authorizedResourceUrl(path, true)) } catch {
        // Optional images must not hide the directory or change its indexing status.
        image.removeAttribute('src')
      }
    }
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
    toast.error(cause instanceof Error ? cause.message : '资料访问失败，请稍后重试')
  }
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    toast.success('链接已复制')
  } catch {
    toast.error('复制失败，请复制浏览器地址栏中的链接。')
  }
}
function followReadmeLink(event: MouseEvent) {
  const anchor = (event.target as Element).closest('a')
  if (!anchor || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
  const href = anchor.getAttribute('href') || ''
  if (href.startsWith('/disk/')) { event.preventDefault(); void router.push(href) }
}
watch(() => route.fullPath, (_fullPath, previous) => {
  const queryText = (key: string) => typeof route.query[key] === 'string' ? route.query[key] as string : ''
  filter.value = queryText('q').slice(0, 200)
  const key = queryText('sort')
  sort.value = key === 'size' || key === 'modified' ? key : 'name'
  const direction = queryText('direction')
  sortDirection.value = direction === 'asc' || direction === 'desc' ? direction : (sort.value === 'name' ? 'asc' : 'desc')
  const requestedPage = Number(queryText('page'))
  page.value = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
  if (previous === undefined || router.resolve(previous).path !== route.path) {
    resetSearch()
    void loadContents()
  } else {
    queueSearch(queryText('page') ? 0 : 600)
  }
}, { immediate: true })
onBeforeUnmount(() => { loadVersion++; controller?.abort(); searchVersion++; searchController?.abort(); clearTimeout(searchTimer) })
</script>

<style scoped>
.resource-row { display: grid; grid-template-columns: minmax(0, 1fr) 64px 56px 32px; align-items: center; gap: 8px; }
.resource-entry-meta { display: contents; }
@media (max-width: 639px) {
  .resource-entry { grid-template-columns: minmax(0, 1fr) 32px; gap: 4px 12px; }
  .resource-entry-name { grid-column: 1; grid-row: 1; }
  .resource-entry-meta { display: flex; grid-column: 1; grid-row: 2; flex-wrap: wrap; gap: 4px 12px; padding-left: 48px; }
  .resource-selection-meta { padding-left: 28px; }
  .resource-entry-action { grid-column: 2; grid-row: 1 / span 2; }
}
@media (min-width: 640px) { .resource-row { grid-template-columns: minmax(0, 1fr) 110px 85px 32px; gap: 20px; } }
.resource-readme { overflow-wrap: anywhere; }
.resource-readme :deep(pre) { overflow-x: auto; }
.resource-readme :deep(table) { display: block; max-width: 100%; overflow-x: auto; }
.resource-readme :deep(img) { max-width: 100%; height: auto; }
</style>
