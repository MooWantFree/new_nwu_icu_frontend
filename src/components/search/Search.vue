<template>
  <div class="flex h-[min(40rem,calc(100dvh-2rem))] flex-col overflow-hidden rounded-lg bg-white shadow-md">
    <div class="p-6 border-b border-gray-200">
      <div class="flex items-center gap-2">
        <form class="relative min-w-0 flex-1" @submit.prevent="submitSearch">
          <input
            type="text"
            placeholder="搜索课程、评价、教师及资源..."
            class="w-full py-3 pl-12 pr-4 text-gray-700 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
            v-model="searchQuery"
            ref="searchInput"
            enterkeyhint="search"
            @input="scheduleSearch"
            @keydown.enter="handleSearchKeydown"
          />
          <div class="absolute top-3 left-3">
            <Search v-if="!searchLoading" class="w-6 h-6 text-gray-400" />
            <LoaderCircle v-else class="w-6 h-6 text-blue-700 animate-spin" />
          </div>
        </form>
        <button
          type="button"
          class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="关闭搜索"
          title="关闭搜索"
          @click="$emit('close')"
        >
          <X class="h-5 w-5" />
        </button>
      </div>
    </div>
    <div class="flex min-h-0 flex-1 flex-col p-6">
      <nav
        class="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg"
        aria-label="Tabs"
      >
        <button
          v-for="tab in searchEnums"
          :key="tab"
          @click="handleTabClick(tab)"
          :class="[
            'flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200',
            activeTab === tab
              ? 'bg-white text-blue-700 shadow'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200',
          ]"
        >
          {{ searchTypeTooltip[tab] }}
        </button>
      </nav>
      <div v-if="activeTab === searchEnums.resource" role="group" aria-label="资源类型" class="mb-3 flex gap-1 rounded-lg bg-gray-100 p-1">
        <button
          v-for="kind in resourceKinds"
          :key="kind.value"
          type="button"
          :aria-pressed="resourceKind === kind.value"
          :class="['flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500', resourceKind === kind.value ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700']"
          @click="handleResourceKindClick(kind.value)"
        >{{ kind.label }}</button>
      </div>
      <p v-if="activeTab === searchEnums.resource" class="mb-3 text-xs text-gray-500">全局搜索资料，当前资料目录的匹配项优先；点击结果在本页打开。</p>
      <p v-if="searchError" role="alert" class="mb-3 text-sm text-red-700">{{ searchError }}</p>
      <div
        v-if="!searchLoading && searchResults?.search_result.length"
        :class="[
          'min-h-0 flex-1 overflow-y-auto',
          activeTab === searchEnums.review ? '' : 'space-y-4',
        ]"
        @scroll="handleScroll"
        ref="scrollContainer"
      >
        <template v-if="activeTab === searchEnums.review">
          <SearchResultReview
            v-for="result in searchResults.search_result"
            :key="result.id"
            @close="$emit('close')"
            :review="result as ReviewSearchResult"
            class="border-b border-slate-200 last:border-b-0"
          />
        </template>
        <template v-if="activeTab === searchEnums.course">
          <SearchResultCourse
            v-for="result in searchResults.search_result"
            :key="result.id"
            @close="$emit('close')"
            :course="result as CourseSearchResult"
            class="bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
          />
        </template>
        <template v-if="activeTab === searchEnums.teacher">
          <SearchResultTeacher
            v-for="result in searchResults.search_result"
            :key="result.id"
            @close="$emit('close')"
            :teacher="result as TeacherSearchResult"
            class="bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
          />
        </template>
        <template v-if="activeTab === searchEnums.resource">
          <SearchResultResource
            v-for="result in searchResults.search_result"
            :key="`${(result as ResourceSearchResult).path}/${(result as ResourceSearchResult).name}`"
            @close="$emit('close')"
            :resource="result as ResourceSearchResult"
            class="bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
          />
        </template>
        <div v-if="scrollLoading" class="text-center py-4">
          <LoaderCircle class="w-8 h-8 mx-auto text-blue-700 animate-spin" />
        </div>
      </div>
      <div v-else class="flex flex-1 flex-col items-center justify-center text-center py-12">
        <template v-if="searchLoading">
          <LoaderCircle
            class="w-16 h-16 mx-auto mb-4 text-blue-700 animate-spin"
          />
          <p class="text-lg font-medium text-gray-600">搜索中...</p>
        </template>
        <template v-else-if="searchPending">
          <Search class="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p class="text-lg font-medium text-gray-600">输入完成后自动搜索</p>
        </template>
        <template v-else-if="searchQuery">
          <Search class="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p class="text-lg font-medium text-gray-600">未找到结果</p>
          <p class="text-sm mt-2 text-gray-500">请尝试调整搜索关键词</p>
          <div v-if="activeTab === searchEnums.course" class="mt-3">
            <div class="border-t border-gray-200 my-4"></div>
            <p class="text-sm text-gray-500 mb-3">找不到课程？添加一个新的</p>
            <button
              type="button"
              @click="showAddCourseModal = true"
              class="btn-primary w-full"
            >
              <PlusCircle class="w-5 h-5 mr-2" />
              添加新课程
            </button>
            <AddCourseModal v-model="showAddCourseModal" />
          </div>
        </template>
        <template v-else>
          <Search class="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p class="text-lg font-medium text-gray-600">输入关键词开始搜索</p>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { LoaderCircle, Search, PlusCircle, X } from 'lucide-vue-next'
import { api } from '@/lib/requests'
import { searchEnums, SearchType, searchTypeTooltip } from './enums'
import {
  APISearch,
  CourseSearchResult,
  ReviewSearchResult,
  TeacherSearchResult,
  ResourceSearchResult,
} from '@/types/api/search/search'
import SearchResultCourse from './results/SearchResultCourse.vue'
import SearchResultReview from './results/SearchResultReview.vue'
import SearchResultTeacher from './results/SearchResultTeacher.vue'
import SearchResultResource from './results/SearchResultResource.vue'
import AddCourseModal from '../courseReview/course/AddCourseModal.vue'

const searchQuery = ref('')
const searchInput = ref<HTMLInputElement | null>(null)
const route = useRoute()
const resourceContextPath = computed(() => {
  if (route.name !== 'disk') return '/'
  const parts = route.params.path
  return '/' + (Array.isArray(parts) ? parts.join('/') : parts || '')
})
const activeTab = ref<SearchType>(route.name === 'disk' ? searchEnums.resource : searchEnums.review)
const resourceKinds = [{ value: 'file', label: '文件' }, { value: 'directory', label: '文件夹' }] as const
const resourceKind = ref<'file' | 'directory'>('file')

const searchResults = ref<APISearch['response'] | null>(null)
const searchLoading = ref(false)
const searchPending = ref(false)
const scrollLoading = ref(false)
const searchError = ref('')

const showAddCourseModal = ref(false)
let searchRequestId = 0
let searchDebounceTimer: ReturnType<typeof setTimeout> | undefined

const handleSearch = async (loadMore = false) => {
  searchError.value = ''
  if (!searchQuery.value.trim() && !loadMore) {
    searchRequestId++
    searchPending.value = false
    searchResults.value = null
    return
  }

  const requestId = loadMore ? searchRequestId : ++searchRequestId
  searchPending.value = false

  if (!loadMore) {
    searchLoading.value = true
    scrollLoading.value = false
    searchResults.value = null
    currentPage.value = 1
  } else {
    scrollLoading.value = true
  }

  const requestQueryData = {
    keyword: searchQuery.value,
    type: activeTab.value,
    current_page: currentPage.value,
    page_size: pageSize.value,
  }
  try {
    let content: APISearch['response']
    if (activeTab.value === searchEnums.resource) {
      const response = await api.get({ url: '/api/resources/search/', query: { q: searchQuery.value.trim(), path: resourceContextPath.value, page: currentPage.value, type: resourceKind.value } })
      if (response.status !== 200) throw new Error(response.errors?.[0]?.err_msg || '资料搜索暂时不可用，请重试。')
      const data = response.content
      const pages = Math.ceil(data.total_count / data.page_size)
      content = {
        search_result: data.entries.map(entry => ({ name: entry.name, path: entry.path.slice(0, entry.path.lastIndexOf('/')) || '/', size: entry.size || 0, type: entry.type === 'directory' ? 'dir' : 'file', url: '/disk' })),
        total_pages: pages, current_page: data.page, has_next: data.page < pages, has_previous: data.page > 1, total_count: data.total_count,
      }
    } else {
      const response = await api.post({ url: '/api/search/', query: requestQueryData })
      if (response.status !== 200) throw new Error(response.errors?.[0]?.err_msg || '搜索暂时不可用，请重试。')
      content = response.content
    }
    if (requestId !== searchRequestId) return

    if (loadMore && searchResults.value) {
      searchResults.value.search_result = [
        ...searchResults.value.search_result,
        ...content.search_result,
      ]
    } else {
      searchResults.value = content
    }
    totalPage.value = content.total_pages
  } catch (error) {
    if (requestId === searchRequestId) {
      searchError.value = error instanceof Error ? error.message : '搜索失败，请重试。'
      if (loadMore) currentPage.value = Math.max(1, currentPage.value - 1)
    }
  } finally {
    if (requestId === searchRequestId) {
      searchLoading.value = false
      scrollLoading.value = false
    }
  }
}

const cancelScheduledSearch = () => {
  if (searchDebounceTimer !== undefined) {
    clearTimeout(searchDebounceTimer)
    searchDebounceTimer = undefined
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
    searchResults.value = null
    return
  }

  searchPending.value = true
  searchDebounceTimer = setTimeout(() => {
    searchDebounceTimer = undefined
    void handleSearch()
  }, activeTab.value === searchEnums.resource ? 250 : 1300)
}

const handleSearchKeydown = (event: KeyboardEvent) => {
  if (event.isComposing) return

  event.preventDefault()
  submitSearch()
}

const submitSearch = () => {
  cancelScheduledSearch()
  handleSearch()
}

const handleTabClick = (tab: SearchType) => {
  if (activeTab.value === tab) return
  activeTab.value = tab
  currentPage.value = 1
  cancelScheduledSearch()
  handleSearch()
}

const handleResourceKindClick = (kind: 'file' | 'directory') => {
  if (resourceKind.value === kind) return
  resourceKind.value = kind
  currentPage.value = 1
  cancelScheduledSearch()
  handleSearch()
}

const currentPage = ref(1)
const totalPage = ref(1)
const pageSize = ref(10)

const scrollContainer = ref<HTMLElement | null>(null)

const handleScroll = () => {
  if (!scrollContainer.value) return

  const { scrollTop, scrollHeight, clientHeight } = scrollContainer.value
  if (scrollTop + clientHeight >= scrollHeight - 20 && !scrollLoading.value && currentPage.value < totalPage.value) {
    currentPage.value++
    handleSearch(true)
  }
}

onMounted(() => {
  nextTick(() => searchInput.value?.focus())
})

onUnmounted(() => {
  searchRequestId++
  cancelScheduledSearch()
})
</script>
