<template>
  <div class="bg-white shadow-md rounded-lg overflow-hidden">
    <div class="p-6 border-b border-gray-200">
      <div class="relative">
        <input
          type="text"
          placeholder="搜索课程、评价或用户..."
          class="w-full py-3 pl-12 pr-4 text-gray-700 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
          v-model="searchQuery"
          @input="()=> debouncedSearch()"
          @keyup.enter="()=> handleSearch()"
        />
        <div class="absolute top-3 left-3">
          <Search v-if="!searchLoading" class="w-6 h-6 text-gray-400" />
          <LoaderCircle v-else class="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      </div>
    </div>
    <div class="p-6">
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
              ? 'bg-white text-blue-600 shadow'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200',
          ]"
        >
          {{ searchTypeTooltip[tab] }}
        </button>
      </nav>
      <div
        v-if="!searchLoading && searchResults?.search_result.length"
        class="space-y-4 max-h-[50vh] overflow-y-auto"
        @scroll="handleScroll"
        ref="scrollContainer"
      >
        <template v-if="activeTab === searchEnums.review">
          <SearchResultReview
            v-for="result in searchResults.search_result"
            :key="result.id"
            @close="$emit('close')"
            :review="result as ReviewSearchResult"
            class="bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
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
            :key="result.id"
            @close="$emit('close')"
            :resource="result as ResourceSearchResult"
            class="bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
          />
        </template>
        <div v-if="scrollLoading" class="text-center py-4">
          <LoaderCircle class="w-8 h-8 mx-auto text-blue-500 animate-spin" />
        </div>
      </div>
      <div v-else class="text-center py-12">
        <template v-if="searchLoading">
          <LoaderCircle
            class="w-16 h-16 mx-auto mb-4 text-blue-500 animate-spin"
          />
          <p class="text-lg font-medium text-gray-600">搜索中...</p>
        </template>
        <template v-else-if="searchQuery">
          <Search class="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p class="text-lg font-medium text-gray-600">未找到结果</p>
          <p class="text-sm mt-2 text-gray-500">请尝试调整搜索关键词</p>
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
import { ref, onMounted } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { LoaderCircle, Search } from 'lucide-vue-next'
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

const searchQuery = ref('')
const activeTab = ref<SearchType>(searchEnums.review)

const searchResults = ref<APISearch['response'] | null>(null)
const searchLoading = ref(false)
const scrollLoading = ref(false)

const handleSearch = async (loadMore = false) => {
  if (!searchQuery.value.trim() && !loadMore) {
    searchResults.value = null
    return
  }

  if (!loadMore) {
    searchLoading.value = true
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
    const response = await api.post({
      url: '/api/search/',
      query: requestQueryData,
    })
    if (loadMore && searchResults.value) {
      searchResults.value.search_result = [
        ...searchResults.value.search_result,
        ...response.content.search_result,
      ]
    } else {
      searchResults.value = response.content
    }
    totalPage.value = response.content.total_pages
  } catch (error) {
    console.error('Search failed:', error)
  } finally {
    searchLoading.value = false
    scrollLoading.value = false
  }
}

const debouncedSearch = useDebounceFn(handleSearch, 500)

const handleTabClick = (tab: SearchType) => {
  if (activeTab.value === tab) return
  activeTab.value = tab
  currentPage.value = 1
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
  if (scrollContainer.value) {
    scrollContainer.value.addEventListener('scroll', handleScroll)
  }
})
</script>
