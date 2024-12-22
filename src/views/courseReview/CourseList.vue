<template>
  <div class="container mx-auto py-8 px-4">
    <h1 class="text-3xl font-bold mb-6 text-gray-800">课程列表</h1>

    <div v-if="loading" class="space-y-4">
      <div v-for="i in 5" :key="i" class="mb-6">
        <div class="bg-white rounded-lg shadow-md p-6 animate-pulse">
          <div class="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div class="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div class="h-4 bg-gray-200 rounded w-2/3"></div>
          <div class="flex justify-between items-center mt-4">
            <div class="h-8 bg-gray-200 rounded w-24"></div>
            <div class="h-4 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="courses.length === 0" class="text-center text-gray-500">
      暂无数据
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="course in courses"
        :key="course.id"
        class="bg-white rounded-lg shadow-md p-6 transition duration-300 hover:shadow-lg"
      >
        <h2 class="text-xl font-semibold mb-2">
          <router-link
            :to="`/review/course/${course.id}`"
            class="text-blue-600 hover:text-blue-800 transition duration-300"
          >
            {{ course.name }}
          </router-link>
        </h2>
        <p class="text-gray-600 mb-2">教师: {{ course.teacher }}</p>
        <p class="text-gray-600 mb-2">学期: {{ course.semester }}</p>
        <div class="flex items-center mb-2">
          <n-rate readonly :value="course.average_rating" :allow-half="true" />
          <span class="ml-2 text-gray-600"
            >{{ course.average_rating.toFixed(1) }} ({{
              course.review_count
            }}
            条评价)</span
          >
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

enum OrderBy {
  Rating = 'rating',
  Popular = 'popular',
}

enum CourseType {
  All = 'all',
  General = 'general',
  Pe = 'pe',
  English = 'english',
  Professional = 'professional',
  Politics = 'politics',
  Required = 'required',
  Optional = 'optional',
}

const courses = ref<CourseDataInCourseList[]>([])
const courseType = ref<CourseType>(CourseType.All)
const orderBy = ref<OrderBy>(OrderBy.Rating)
const data = ref<CourseListResponse['success'] | null>(null)
const loading = ref(true)
const currentPage = ref(1)

const fetchCourses = async (page: number = 1) => {
  loading.value = true
  const requestParams = new URLSearchParams()
  requestParams.set('order_by', orderBy.value)
  requestParams.set('course_type', courseType.value)
  requestParams.set('page', page.toString())

  try {
    const response = await api.get<CourseListResponse>(
      '/api/assessment/courselist/?' + requestParams
    )
    courses.value = response.content.courses
    data.value = response.content
  } catch (error) {
    console.error('Error fetching courses:', error)
    message.error('网络错误，请重试')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchCourses()
})

const totalPages = computed(() => data.value?.num_pages || 1)
const handlePageChange = async (page: number) => {
  currentPage.value = page
  await fetchCourses(page)
}
</script>
