<template>
  <div class="container mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-7rem-6px)]">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-8">
      <div class="flex items-center">
        <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 relative">
          课程列表
          <span 
            v-if="totalCourses > 0" 
            class="absolute -bottom-1 -right-2 text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded-full transform translate-x-full"
          >
            共 {{ totalCourses }} 门课程
          </span>
        </h1>
      </div>
      <button
        @click="handleAddCourse"
        class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center self-end sm:self-auto"
      >
        <PlusCircle class="w-5 h-5 mr-2" />
        添加课程
      </button>
      <AddCourseModal v-model="showAddCourseModal" />
    </div>

    <div class="mb-8 flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-start sm:justify-end gap-4">
      <select
        v-model="courseType"
        class="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        class="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        class="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ loading ? '加载中...' : '应用筛选' }}
      </button>
    </div>

    <div v-if="loading" class="space-y-6">
      <div
        v-for="i in 3"
        :key="i"
        class="bg-white rounded-xl shadow-md p-4 sm:p-6 animate-pulse"
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

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
      <div
        v-for="course in courses"
        :key="course.id"
        class="bg-white rounded-xl shadow-md p-4 sm:p-6 transition duration-300 hover:shadow-xl hover:transform hover:-translate-y-1"
      >
        <h2 class="text-xl sm:text-2xl font-semibold mb-3">
          <router-link
            :to="`/review/course/${course.id}`"
            class="text-blue-600 hover:text-blue-800 transition duration-300"
          >
            {{ course.name }}
          </router-link>
        </h2>
        <p class="text-gray-700 mb-2">教师: {{ course.teacher }}</p>
        <p class="text-gray-700 mb-3">学期: {{ course.semester }}</p>
        <div class="flex flex-wrap items-center mb-3">
          <n-rate
            readonly
            :value="course.average_rating"
            :allow-half="true"
            size="small"
            class="sm:size-medium"
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

    <div class="flex justify-center mt-8 sm:mt-12 overflow-x-auto" v-if="totalPages > 1">
      <n-pagination
        v-model:page="currentPage"
        :page-count="totalPages"
        :on-update:page="handlePageChange"
        :page-slot="isMobile ? 3 : 5"
        show-quick-jumper
      >
        <template #prefix>
          <span class="hidden sm:inline">第 {{ currentPage }} 页 / 共 {{ totalPages }} 页</span>
          <span class="sm:hidden">{{ currentPage }}/{{ totalPages }}</span>
        </template>
      </n-pagination>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref, onUnmounted } from 'vue'
import { useMessage } from 'naive-ui'
import { api } from '@/lib/requests'
import { APICourseList, APICourseListQuery } from '@/types/api/courseReview/course'
import { z } from 'zod'
import { PlusCircle } from 'lucide-vue-next'
import AddCourseModal from '@/components/courseReview/course/AddCourseModal.vue'
import { useWindowSize } from '@vueuse/core'

const message = useMessage()

enum OrderBy {
  Rating = 'rating',
  Popular = 'popular',
}

const CourseType = APICourseListQuery.shape.course_type.enum 

const courses = ref<APICourseList['response']['results']>([])
const courseType = ref<z.infer<typeof APICourseListQuery>['course_type']>(CourseType.all)
const orderBy = ref<OrderBy>(OrderBy.Rating)
const totalCourses = ref(0)
const data = ref<APICourseList['response'] | null>(null)
const loading = ref(true)
const currentPage = ref(1)
const showAddCourseModal = ref(false)

const isMobile = ref(false)
const handleResize = () => {
  isMobile.value = window.innerWidth < 768
}

const handleAddCourse = () => {
  showAddCourseModal.value = true
}

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
    totalCourses.value = response.content.count
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
  handleResize()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

const totalPages = computed(() => data.value?.max_page || 1)
const handlePageChange = async (page: number) => {
  currentPage.value = page
  await fetchCourses(page)
}
</script>
