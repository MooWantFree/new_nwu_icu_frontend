<template>
  <div class="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
    <h1 class="text-4xl font-bold mb-8 text-gray-900">课程列表</h1>

    <div v-if="loading" class="space-y-6">
      <div v-for="i in 5" :key="i" class="bg-white rounded-xl shadow-md p-6 animate-pulse">
        <div class="h-7 bg-gray-200 rounded-full w-3/4 mb-4"></div>
        <div class="h-5 bg-gray-200 rounded-full w-1/2 mb-3"></div>
        <div class="h-5 bg-gray-200 rounded-full w-2/3 mb-3"></div>
        <div class="flex justify-between items-center mt-5">
          <div class="h-9 bg-gray-200 rounded-full w-28"></div>
          <div class="h-5 bg-gray-200 rounded-full w-20"></div>
        </div>
      </div>
    </div>

    <div v-else-if="courses.length === 0" class="text-center text-xl text-gray-500 my-12">
      暂无数据
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      <div
        v-for="course in courses"
        :key="course.id"
        class="bg-white rounded-xl shadow-md p-6 transition duration-300 hover:shadow-xl hover:transform hover:-translate-y-1"
      >
        <h2 class="text-2xl font-semibold mb-3">
          <router-link
            :to="`/review/course/${course.id}`"
            class="text-blue-600 hover:text-blue-800 transition duration-300"
          >
            {{ course.name }}
          </router-link>
        </h2>
        <p class="text-gray-700 mb-2">教师: {{ course.teacher }}</p>
        <p class="text-gray-700 mb-3">学期: {{ course.semester }}</p>
        <div class="flex items-center mb-3">
          <n-rate readonly :value="course.average_rating" :allow-half="true" size="medium" />
          <span class="ml-3 text-gray-700 font-medium">
            {{ course.average_rating.toFixed(1) }}
            <span class="text-sm text-gray-500">({{ course.review_count }} 条评价)</span>
          </span>
        </div>
        <div class="text-sm font-medium text-gray-600">
          标准化评分: {{ course.normalized_rating.toFixed(2) }}
        </div>
      </div>
    </div>

    <div class="flex justify-center mt-12" v-if="totalPages > 1">
      <n-pagination
        v-model:page="currentPage"
        :page-count="totalPages"
        :on-update:page="handlePageChange"
        :page-slot="5"
        show-quick-jumper
      >
        <template #prefix>
          第 {{ currentPage }} 页 / 共 {{ totalPages }} 页
        </template>
      </n-pagination>
    </div>
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
