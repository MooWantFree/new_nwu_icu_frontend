<template>
  <!-- TODO: Not Reviewed -->
  <div class="container mx-auto py-8 px-4">
    <h1 class="text-3xl font-bold mb-6 text-gray-800">课程列表</h1>
    
    <div class="mb-6 flex justify-end">
      <n-select v-model:value="sortBy" :options="sortOptions" class="w-48" />
    </div>

    <div v-if="loading" class="space-y-4">
      <div v-for="i in 5" :key="i" class="bg-gray-200 rounded-md h-6 w-full animate-pulse"></div>
    </div>

    <div v-else-if="courses.length === 0" class="text-center text-gray-500">
      未找到课程。
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="course in paginatedCourses" :key="course.id" class="bg-white rounded-lg shadow-md p-6 transition duration-300 hover:shadow-lg">
        <h2 class="text-xl font-semibold mb-2">
          <router-link :to="`/review/course/${course.id}`" class="text-blue-600 hover:text-blue-800 transition duration-300">
            {{ course.name }}
          </router-link>
        </h2>
        <p class="text-gray-600 mb-2">教师: {{ course.teacher }}</p>
        <p class="text-gray-600 mb-2">学期: {{ course.semester }}</p>
        <div class="flex items-center mb-2">
          <n-rate readonly :value="course.average_rating" :allow-half="true" />
          <span class="ml-2 text-gray-600">{{ course.average_rating.toFixed(1) }} ({{ course.review_count }} 条评价)</span>
        </div>
        <div class="text-sm text-gray-500">
          标准化评分: {{ course.normalized_rating.toFixed(2) }}
        </div>
      </div>
    </div>

    <n-pagination
      v-if="totalPages > 1"
      v-model:page="currentPage"
      :page-count="totalPages"
      :on-update:page="handlePageChange"
      class="mt-8"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useMessage } from 'naive-ui'
import { api } from '@/lib/requests'
import { CourseDataInCourseList, CourseListResponse } from '@/types/api/course'

const message = useMessage()

const courses = ref<CourseDataInCourseList[]>([])
const loading = ref(true)
const sortBy = ref('name')
const currentPage = ref(1)
const itemsPerPage = 12

const sortOptions = [
  { label: '名称', value: 'name' },
  { label: '评分', value: 'rating' },
  { label: '评价数', value: 'reviews' },
]

const fetchCourses = async () => {
  loading.value = true
  try {
    const response = await api.get<CourseListResponse>('/api/assessment/courselist/')
    courses.value = response.content.courses
  } catch (error) {
    console.error('Error fetching courses:', error)
    message.error('Failed to load courses. Please try again.')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchCourses()
})

const sortedCourses = computed(() => {
  return [...courses.value].sort((a, b) => {
    if (sortBy.value === 'name') {
      return a.name.localeCompare(b.name)
    } else if (sortBy.value === 'rating') {
      return b.average_rating - a.average_rating
    } else if (sortBy.value === 'reviews') {
      return b.review_count - a.review_count
    }
    return 0
  })
})

const totalPages = computed(() => Math.ceil(sortedCourses.value.length / itemsPerPage))

const paginatedCourses = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return sortedCourses.value.slice(start, end)
})

const handlePageChange = (page: number) => {
  currentPage.value = page
}
</script>
