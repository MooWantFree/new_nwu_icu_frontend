<template>
  <div class="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-4xl font-bold text-gray-900">课程列表</h1>
      <button
        class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center"
      >
        <PlusCircle class="w-5 h-5 mr-2" />
        添加课程
      </button>
    </div>

    <div class="mb-8 flex flex-wrap items-center justify-end gap-4">
      <select
        v-model="courseType"
        class="w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="" disabled selected>选择课程类型</option>
        <option
          v-for="option in courseTypeOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
      <select
        v-model="orderBy"
        class="w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="" disabled selected>选择排序方式</option>
        <option
          v-for="option in orderByOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
      <button
        @click="handlePageChange(1)"
        :disabled="loading"
        class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ loading ? '加载中...' : '应用筛选' }}
      </button>
    </div>

    <div v-if="loading" class="space-y-6">
      <div
        v-for="i in 5"
        :key="i"
        class="bg-white rounded-xl shadow-md p-6 animate-pulse"
      >
        <div class="h-7 bg-gray-200 rounded-full w-3/4 mb-4"></div>
        <div class="h-5 bg-gray-200 rounded-full w-1/2 mb-3"></div>
        <div class="h-5 bg-gray-200 rounded-full w-2/3 mb-3"></div>
        <div class="flex justify-between items-center mt-5">
          <div class="h-9 bg-gray-200 rounded-full w-28"></div>
          <div class="h-5 bg-gray-200 rounded-full w-20"></div>
        </div>
      </div>
    </div>

    <div
      v-else-if="courses && courses.length === 0"
      class="text-center text-xl text-gray-500 my-12"
    >
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
          <n-rate
            readonly
            :value="course.average_rating"
            :allow-half="true"
            size="medium"
          />
          <span class="ml-3 text-gray-700 font-medium">
            {{ course.average_rating.toFixed(1) }}
            <span class="text-sm text-gray-500"
              >({{ course.review_count }} 条评价)</span
            >
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
import { APICourseList, APICourseListQuery } from '@/types/api/courseReview/course'
import { z } from 'zod'
import { PlusCircle } from 'lucide-vue-next'

const message = useMessage()

enum OrderBy {
  Rating = 'rating',
  Popular = 'popular',
}

const CourseType = APICourseListQuery.shape.course_type.enum 

const courses = ref<APICourseList['response']['results']>([])
const courseType = ref<z.infer<typeof APICourseListQuery>['course_type']>(CourseType.all)
const orderBy = ref<OrderBy>(OrderBy.Rating)
const data = ref<APICourseList['response'] | null>(null)
const loading = ref(true)
const currentPage = ref(1)

const courseTypeOptions = [
  { label: '全部课程', value: CourseType.all },
  { label: '通识课', value: CourseType.general },
  { label: '体育课', value: CourseType.pe },
  { label: '英语课', value: CourseType.english },
  { label: '专业课', value: CourseType.professional },
  { label: '政治课', value: CourseType.politics },
  { label: '必修课', value: CourseType.required },
  { label: '选修课', value: CourseType.optional },
]

const orderByOptions = [
  { label: '评分排序', value: OrderBy.Rating },
  { label: '热门排序', value: OrderBy.Popular },
]

const fetchCourses = async (page: number = 1) => {
  loading.value = true
  const requestParams = new URLSearchParams()
  requestParams.set('order_by', orderBy.value)
  requestParams.set('course_type', courseType.value)
  requestParams.set('page', page.toString())

  try {
    const response = await api.get({
      url: '/api/assessment/courselist/',
      query: {
        order_by: orderBy.value,
        course_type: courseType.value,
        page,
      },
    })
    courses.value = response.content.results
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

const totalPages = computed(() => data.value?.max_page || 1)
const handlePageChange = async (page: number) => {
  currentPage.value = page
  await fetchCourses(page)
}
</script>
