<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="fixed inset-0 bg-black bg-opacity-50" @click="closeModal"></div>
    <div class="w-full max-w-md mx-auto bg-white rounded-lg shadow-xl z-10">
      <div class="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 class="text-lg font-medium">选择教师</h3>
        <button class="p-1 text-gray-500 hover:text-gray-700 focus:outline-none" @click="closeModal">
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="p-4 space-y-4">
        <div class="relative">
          <input type="text" placeholder="搜索教师"
            class="w-full py-3 pl-12 pr-4 text-gray-700 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
            v-model="searchQuery" @input="() => debouncedSearch()" @keyup.enter="() => handleSearch()" />
          <div class="absolute top-3 left-3">
            <Search v-if="!searchLoading" class="w-6 h-6 text-gray-400" />
            <LoaderCircle v-else class="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        </div>

        <div v-if="!searchLoading && teachers.length > 0" class="space-y-2 max-h-[50vh] overflow-y-auto"
          ref="scrollContainer">
          <div v-for="teacher in teachers" :key="teacher.id"
            class="bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
            @click="selectTeacher(teacher)">
            <div class="flex items-center">
              <div class="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                <img v-if="teacher.avatar_uuid" :src="`/api/download/${teacher.avatar_uuid}`"
                  class="w-full h-full object-cover" @error="handleAvatarError($event, teacher)" />
                <div v-else :class="[
                  'w-full h-full flex justify-center items-center text-white text-sm font-bold',
                  [
                    'bg-indigo-500',
                    'bg-teal-600',
                    'bg-orange-600',
                    'bg-pink-600',
                    'bg-cyan-600',
                  ][teacher.name.charCodeAt(0) % 5],
                ]">
                  {{ teacher.name.charAt(0).toUpperCase() }}
                </div>
              </div>
              <div class="ml-3">
                <div class="text-base font-medium text-blue-600">{{ teacher.name }}</div>
                <div class="text-sm text-gray-600">{{ teacher.school }}</div>
              </div>
            </div>
          </div>

          <div v-if="scrollLoading" class="text-center py-4">
            <LoaderCircle class="w-8 h-8 mx-auto text-blue-500 animate-spin" />
          </div>
        </div>

        <div v-else class="text-center py-8">
          <template v-if="searchLoading">
            <LoaderCircle class="w-12 h-12 mx-auto mb-4 text-blue-500 animate-spin" />
            <p class="text-lg font-medium text-gray-600">搜索中...</p>
          </template>
          <template v-else-if="searchQuery">
            <Search class="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p class="text-lg font-medium text-gray-600">未找到教师</p>
            <p class="text-sm mt-2 text-gray-500">请尝试调整搜索关键词</p>
          </template>
          <template v-else>
            <Search class="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p class="text-lg font-medium text-gray-600">输入关键词开始搜索</p>
          </template>
        </div>
      </div>

      <div class="p-4 border-t border-gray-200 flex justify-end gap-2">
        <button @click="closeModal"
          class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors duration-200">
          取消
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { LoaderCircle, Search, X } from 'lucide-vue-next'
import { api } from '@/lib/requests'
import { TeacherSearchResult } from '@/types/api/search/search'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'select', teacher: TeacherSearchResult): void
}>()

const show = ref(props.modelValue)
const searchQuery = ref('')
const teachers = ref<TeacherSearchResult[]>([])
const searchLoading = ref(false)
const scrollLoading = ref(false)
const currentPage = ref(1)
const totalPage = ref(1)
const scrollContainer = ref<HTMLElement | null>(null)

watch(() => props.modelValue, (newVal) => {
  show.value = newVal
})

watch(() => show.value, (newVal) => {
  emit('update:modelValue', newVal)
})

const handleSearch = async (loadMore = false) => {
  if (!loadMore) {
    searchLoading.value = true
    teachers.value = []
    currentPage.value = 1
  } else {
    scrollLoading.value = true
  }

  try {
    // Type system workaround
    type Teacher = 'teacher'
    const teacher: Teacher = 'teacher'
    const requestQueryData = {
      keyword: searchQuery.value,
      type: teacher,
      current_page: currentPage.value,
      page_size: 10
    }
    const response = await api.post({
      url: '/api/search/',
      query: requestQueryData
    })

    const results = response.data.contents.search_result || []
    
    if (loadMore) {
      // @ts-expect-error The type of teachers.value is TeacherSearchResult[]
      teachers.value = [...teachers.value, ...results]
    } else {
      // @ts-expect-error The type of teachers.value is TeacherSearchResult[]
      teachers.value = results
    }

    // API response might not have total_pages property, so we need to handle it safely
    totalPage.value = (response.data as any).total_pages || 1
  } catch (error) {
    console.error('搜索教师失败', error)
  } finally {
    searchLoading.value = false
    scrollLoading.value = false
  }
}

const debouncedSearch = useDebounceFn(handleSearch, 300)

const handleScroll = () => {
  if (!scrollContainer.value) return

  const { scrollTop, scrollHeight, clientHeight } = scrollContainer.value

  // Load more when user scrolls to bottom (with a small threshold)
  if (scrollHeight - scrollTop - clientHeight < 50 &&
    !scrollLoading.value &&
    currentPage.value < totalPage.value) {
    currentPage.value++
    handleSearch(true)
  }
}

function selectTeacher(teacher: TeacherSearchResult) {
  emit('select', teacher)
  closeModal()
}

function closeModal() {
  show.value = false
}

function handleAvatarError(event: Event, teacher: TeacherSearchResult) {
  const target = event.target as HTMLImageElement
  if (target && target.parentElement) {
    // Create a fallback with the first character of the teacher's name
    const fallbackEl = document.createElement('div');
    fallbackEl.className = [
      'w-full h-full flex justify-center items-center text-white text-2xl font-semibold',
      [
        'bg-indigo-500',
        'bg-teal-600',
        'bg-orange-600',
        'bg-pink-600',
        'bg-cyan-600',
      ][teacher.name.charCodeAt(0) % 5],
    ].join(' ')
    fallbackEl.textContent = teacher.name.split(' ').pop()?.charAt(0).toUpperCase() || teacher.name.charAt(0).toUpperCase()
    target.parentElement.appendChild(fallbackEl)
    target.parentElement.removeChild(target)
  }
}

onMounted(() => {
  if (show.value) {
    handleSearch()
  }

  if (scrollContainer.value) {
    scrollContainer.value.addEventListener('scroll', handleScroll)
  }
})
</script>
