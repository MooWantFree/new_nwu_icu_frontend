<template>
  <div class="flex max-h-[min(36rem,calc(100dvh-2rem))] min-h-[min(22rem,calc(100dvh-2rem))] flex-col overflow-hidden rounded-xl bg-white text-zinc-950">
    <header class="shrink-0 border-b border-zinc-200 px-4 py-3 sm:px-5">
      <h2 class="sr-only">全局搜索</h2>
      <div class="flex items-center gap-3">
        <form class="relative min-w-0 flex-1" role="search" @submit.prevent="submitSearch">
          <Search class="pointer-events-none absolute left-0 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
          <input
            ref="searchInput"
            v-model="searchQuery"
            type="search"
            aria-label="搜索关键词"
            placeholder="搜索课程、评价、教师或资源…"
            class="h-10 w-full rounded-md bg-white pl-8 pr-2 text-sm outline-none placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-200 disabled:opacity-50"
            enterkeyhint="search"
            autocomplete="off"
            :disabled="showAddCourseModal || checkingLogin"
            @input="scheduleSearch"
            @keydown.enter="handleSearchKeydown"
          />
        </form>
        <button type="button" aria-label="关闭搜索" :disabled="showAddCourseModal || checkingLogin"
          class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50"
          @click="closeSearch">
          <X class="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </header>
    <div class="shrink-0 border-b border-zinc-100 px-4 py-3 sm:px-5">
      <div role="tablist" aria-label="搜索分类" class="flex gap-1 rounded-md bg-zinc-100 p-1">
        <button v-for="tab in searchTabs" :id="`${searchId}-tab-${tab}`" :key="tab" type="button" role="tab"
          :aria-selected="activeTab === tab" :aria-controls="`${searchId}-results`" :tabindex="activeTab === tab ? 0 : -1"
          :disabled="showAddCourseModal || checkingLogin"
          :class="['inline-flex h-8 min-w-0 flex-1 items-center justify-center rounded-sm px-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400', activeTab === tab ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-500 hover:text-zinc-950']"
          @click="handleTabClick(tab)" @keydown="handleTabKeydown($event, tab)">
          {{ searchTypeTooltip[tab] }}
        </button>
      </div>
      <div v-if="activeTab === searchEnums.resource" class="mt-3">
        <div role="group" aria-label="资源类型" class="flex gap-1">
          <button v-for="kind in resourceKinds" :key="kind.value" type="button" :aria-pressed="resourceKind === kind.value"
            :class="['inline-flex h-7 items-center rounded-md border px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400', resourceKind === kind.value ? 'border-zinc-950 bg-zinc-950 text-white' : 'border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 hover:text-zinc-950']"
            @click="handleResourceKindClick(kind.value)">{{ kind.label }}</button>
        </div>
      </div>
    </div>
    <div :id="`${searchId}-results`" role="tabpanel" :aria-labelledby="`${searchId}-tab-${activeTab}`" :aria-busy="searchLoading || scrollLoading"
      class="flex min-h-0 flex-1 flex-col">
      <div v-if="!searchLoading && searchResults?.search_result.length" ref="scrollContainer" role="region" aria-label="搜索结果"
        class="min-h-0 flex-1 divide-y divide-zinc-100 overflow-y-auto overscroll-contain" @scroll="handleScroll">
        <template v-if="activeTab === searchEnums.review">
          <SearchResultReview v-for="result in searchResults.search_result" :key="result.id" :review="result as ReviewSearchResult" @close="closeSearch" />
        </template>
        <template v-if="activeTab === searchEnums.course">
          <SearchResultCourse v-for="result in searchResults.search_result" :key="result.id" :course="result as CourseSearchResult" @close="closeSearch" />
        </template>
        <template v-if="activeTab === searchEnums.teacher">
          <SearchResultTeacher v-for="result in searchResults.search_result" :key="result.id" :teacher="result as TeacherSearchResult" @close="closeSearch" />
        </template>
        <template v-if="activeTab === searchEnums.resource">
          <SearchResultResource v-for="result in searchResults.search_result" :key="`${(result as ResourceSearchResult).path}/${(result as ResourceSearchResult).name}`" :resource="result as ResourceSearchResult" @close="closeSearch" />
        </template>
        <div v-if="scrollLoading" class="flex items-center justify-center gap-2 px-4 py-4 text-xs text-zinc-500" role="status">
          <LoaderCircle class="h-4 w-4 animate-spin" aria-hidden="true" />加载更多…
        </div>
        <div v-else-if="searchError" class="flex items-center justify-between gap-3 px-4 py-4 text-sm" role="alert">
          <span class="text-red-600">{{ searchError }}</span>
          <button type="button" class="shrink-0 rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400" @click="handleSearch(true)">重试</button>
        </div>
      </div>
      <div v-else class="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-8 text-center">
        <div v-if="searchLoading" class="space-y-3" role="status">
          <LoaderCircle class="mx-auto h-6 w-6 animate-spin text-zinc-400" aria-hidden="true" />
          <p class="text-sm text-zinc-500">搜索中…</p>
        </div>
        <div v-else-if="searchError" class="max-w-sm space-y-3" role="alert">
          <CircleAlert class="mx-auto h-6 w-6 text-red-500" aria-hidden="true" />
          <p class="text-sm font-medium">搜索暂时不可用</p>
          <p class="text-xs leading-5 text-zinc-500">{{ searchError }}</p>
          <button type="button" class="inline-flex h-9 items-center justify-center rounded-md border border-zinc-200 px-3 text-sm font-medium shadow-sm hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400" @click="submitSearch">重新搜索</button>
        </div>
        <div v-else-if="searchPending" class="space-y-3" role="status">
          <Search class="mx-auto h-6 w-6 text-zinc-400" aria-hidden="true" />
          <p class="text-sm text-zinc-500">输入完成后自动搜索</p>
        </div>
        <div v-else-if="searchQuery.trim()" class="space-y-3">
          <Search class="mx-auto h-6 w-6 text-zinc-400" aria-hidden="true" />
          <p class="text-sm font-medium">未找到结果</p>
          <p class="text-xs text-zinc-500">试试其他关键词</p>
          <button v-if="activeTab === searchEnums.course" type="button" :disabled="checkingLogin" class="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-zinc-200 px-3 text-sm font-medium shadow-sm hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50" @click="handleAddCourse">
            <LoaderCircle v-if="checkingLogin" class="h-4 w-4 animate-spin" aria-hidden="true" /><Plus v-else class="h-4 w-4" aria-hidden="true" />添加新课程
          </button>
        </div>
        <div v-else class="space-y-3">
          <span class="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50"><Search class="h-5 w-5 text-zinc-400" aria-hidden="true" /></span>
          <p class="text-sm font-medium">输入关键词开始搜索</p>
          <p class="text-xs text-zinc-500">查找课程、评价、教师和学习资源</p>
        </div>
      </div>
    </div>
    <footer class="flex shrink-0 items-center justify-between gap-3 border-t border-zinc-100 px-4 py-3 text-xs text-zinc-500 sm:px-5">
      <span aria-live="polite">{{ !searchLoading && searchResults ? `共 ${searchResults.total_count ?? searchResults.search_result.length} 条结果` : '输入关键词自动搜索' }}</span>
      <span class="hidden items-center gap-3 sm:inline-flex">
        <span class="inline-flex items-center gap-1.5"><kbd class="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px]">Enter</kbd>搜索</span>
        <span class="inline-flex items-center gap-1.5"><kbd class="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px]">Esc</kbd>关闭</span>
      </span>
    </footer>
  </div>
  <AddCourseModal v-model="showAddCourseModal" />
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, useId, watch } from 'vue'
import { useRoute } from 'vue-router'
import { CircleAlert, LoaderCircle, Search, Plus, X } from 'lucide-vue-next'
import { api } from '@/lib/requests'
import { useCreationLogin } from '@/lib/useCreationLogin'
import { searchEnums, searchTabs, type SearchType, searchTypeTooltip } from './enums'
import type { APISearch, CourseSearchResult, ReviewSearchResult, TeacherSearchResult, ResourceSearchResult } from '@/types/api/search/search'
import SearchResultCourse from './results/SearchResultCourse.vue'
import SearchResultReview from './results/SearchResultReview.vue'
import SearchResultTeacher from './results/SearchResultTeacher.vue'
import SearchResultResource from './results/SearchResultResource.vue'
import AddCourseModal from '../courseReview/course/AddCourseModal.vue'

const emit = defineEmits<{ (event: 'close'): void; (event: 'update:creating', value: boolean): void }>()
const searchId = `global-search-${useId()}`
const searchQuery = ref('')
const searchInput = ref<HTMLInputElement | null>(null)
const route = useRoute()
const resourceContextPath = computed(() => {
  if (route.name !== 'disk') return '/'
  const parts = route.params.path
  return '/' + (Array.isArray(parts) ? parts.join('/') : parts || '')
})
const activeTab = ref<SearchType>(route.name === 'disk' ? searchEnums.resource : searchEnums.course)
const resourceKinds = [{ value: 'file', label: '文件' }, { value: 'directory', label: '文件夹' }] as const
const resourceKind = ref<'file' | 'directory'>('file')
const searchResults = ref<APISearch['response'] | null>(null)
const searchLoading = ref(false)
const searchPending = ref(false)
const scrollLoading = ref(false)
const searchError = ref('')
const showAddCourseModal = ref(false)
const { checkingLogin, requireLogin } = useCreationLogin()
const currentPage = ref(1)
const totalPage = ref(1)
const pageSize = 10
const scrollContainer = ref<HTMLElement | null>(null)
let searchRequestId = 0
let searchDebounceTimer: ReturnType<typeof setTimeout> | undefined
let active = true
let closed = false

const handleAddCourse = async () => {
  if (checkingLogin.value || showAddCourseModal.value || closed) return
  if (await requireLogin('添加课程') && active && !closed) showAddCourseModal.value = true
}
watch(showAddCourseModal, value => emit('update:creating', value))

const cancelScheduledSearch = () => {
  if (searchDebounceTimer !== undefined) {
    clearTimeout(searchDebounceTimer)
    searchDebounceTimer = undefined
  }
}
const closeSearch = () => {
  if (closed || showAddCourseModal.value || checkingLogin.value) return
  closed = true
  searchRequestId++
  cancelScheduledSearch()
  emit('close')
}
watch(() => route.fullPath, closeSearch)

const handleSearch = async (loadMore = false) => {
  if (!active || closed || showAddCourseModal.value || (loadMore && (searchLoading.value || scrollLoading.value || searchPending.value))) return
  const keyword = searchQuery.value.trim()
  if (!keyword) {
    searchRequestId++
    searchPending.value = false
    searchLoading.value = false
    scrollLoading.value = false
    searchError.value = ''
    searchResults.value = null
    return
  }
  const requestId = ++searchRequestId
  const page = loadMore ? currentPage.value + 1 : 1
  const tab = activeTab.value
  searchError.value = ''
  searchPending.value = false
  if (!loadMore) {
    searchLoading.value = true
    scrollLoading.value = false
    searchResults.value = null
    currentPage.value = 1
    totalPage.value = 1
  } else {
    scrollLoading.value = true
  }
  const isCurrent = () => active && !closed && requestId === searchRequestId
  try {
    let content: APISearch['response']
    if (tab === searchEnums.resource) {
      const response = await api.get({ url: '/api/resources/search/', query: { q: keyword, path: resourceContextPath.value, page, type: resourceKind.value } })
      if (response.status !== 200) throw new Error(response.errors?.[0]?.err_msg || '资料搜索暂时不可用，请重试。')
      const data = response.content
      const pages = Math.ceil(data.total_count / data.page_size)
      content = {
        search_result: data.entries.map(entry => ({ name: entry.name, path: entry.path.slice(0, entry.path.lastIndexOf('/')) || '/', size: entry.size || 0, type: entry.type === 'directory' ? 'dir' : 'file', url: '/disk' })),
        total_pages: pages, current_page: data.page, has_next: data.page < pages, has_previous: data.page > 1, total_count: data.total_count,
      }
    } else {
      const response = await api.post({ url: '/api/search/', query: { keyword, type: tab, current_page: page, page_size: pageSize } })
      if (response.status !== 200) throw new Error(response.errors?.[0]?.err_msg || '搜索暂时不可用，请重试。')
      content = response.content
    }
    if (!isCurrent()) return
    searchResults.value = loadMore && searchResults.value
      ? { ...content, search_result: [...searchResults.value.search_result, ...content.search_result] }
      : content
    currentPage.value = content.current_page || page
    totalPage.value = content.total_pages
  } catch (error) {
    if (isCurrent()) searchError.value = error instanceof Error ? error.message : '搜索失败，请重试。'
  } finally {
    if (isCurrent()) {
      searchLoading.value = false
      scrollLoading.value = false
    }
  }
}
const scheduleSearch = () => {
  searchRequestId++
  searchLoading.value = false
  scrollLoading.value = false
  searchResults.value = null
  searchError.value = ''
  cancelScheduledSearch()
  if (!searchQuery.value.trim()) {
    searchPending.value = false
    return
  }
  searchPending.value = true
  searchDebounceTimer = setTimeout(() => {
    searchDebounceTimer = undefined
    void handleSearch()
  }, 600)
}
const handleSearchKeydown = (event: KeyboardEvent) => {
  if (event.isComposing) return
  event.preventDefault()
  submitSearch()
}
const submitSearch = () => {
  cancelScheduledSearch()
  void handleSearch()
}
const handleTabClick = (tab: SearchType) => {
  if (activeTab.value === tab || showAddCourseModal.value || checkingLogin.value) return
  activeTab.value = tab
  cancelScheduledSearch()
  void handleSearch()
}
const handleTabKeydown = (event: KeyboardEvent, tab: SearchType) => {
  const index = searchTabs.indexOf(tab)
  let next: number
  if (event.key === 'ArrowRight') next = (index + 1) % searchTabs.length
  else if (event.key === 'ArrowLeft') next = (index - 1 + searchTabs.length) % searchTabs.length
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = searchTabs.length - 1
  else return
  event.preventDefault()
  handleTabClick(searchTabs[next])
  const tablist = (event.currentTarget as HTMLElement).parentElement
  void nextTick(() => tablist?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus())
}
const handleResourceKindClick = (kind: 'file' | 'directory') => {
  if (resourceKind.value === kind) return
  resourceKind.value = kind
  cancelScheduledSearch()
  void handleSearch()
}
const handleScroll = () => {
  if (!scrollContainer.value || searchError.value) return
  const { scrollTop, scrollHeight, clientHeight } = scrollContainer.value
  if (scrollTop + clientHeight >= scrollHeight - 20 && currentPage.value < totalPage.value) void handleSearch(true)
}
onMounted(() => { void nextTick(() => searchInput.value?.focus()) })
onUnmounted(() => {
  active = false
  searchRequestId++
  cancelScheduledSearch()
})
</script>

<style scoped>
input[type='search']::-webkit-search-cancel-button {
  appearance: none;
}
</style>
