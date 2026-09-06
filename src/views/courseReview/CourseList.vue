<template>
  <AppPageLayout
    title="课程目录"
    description="聚合课程评分、教师与开课学期，用更少的滚动完成选课比较。"
  >
    <template #meta>
      <span v-if="totalCourses > 0">共 {{ totalCourses }} 门课程</span>
    </template>
    <template #actions>
      <button
        @click="handleAddCourse"
        class="btn-primary"
      >
        <PlusCircle class="w-5 h-5 mr-2" />
        添加课程
      </button>
    </template>

    <AddCourseModal v-model="showAddCourseModal" />

    <section class="surface-card mb-5 flex flex-col gap-3 p-2.5 sm:flex-row sm:items-center sm:justify-between">
      <ReviewDirectoryNav active="course" />
      <div class="grid grid-cols-2 gap-2 sm:flex sm:items-center" aria-label="课程筛选">
        <label class="relative min-w-0 sm:w-36">
          <span class="sr-only">课程类型</span>
          <Tags class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" aria-hidden="true" />
          <select
            v-model="courseType"
            class="h-10 w-full appearance-none rounded-[10px] border border-gray-200 bg-white py-2 pl-9 pr-8 text-sm text-gray-700 transition hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            @change="handlePageChange(1)"
          >
            <option v-for="option in courseTypeOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
          <ChevronDown class="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
        </label>
        <label class="relative min-w-0 sm:w-36">
          <span class="sr-only">排序方式</span>
          <ArrowUpDown class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" aria-hidden="true" />
          <select
            v-model="orderBy"
            class="h-10 w-full appearance-none rounded-[10px] border border-gray-200 bg-white py-2 pl-9 pr-8 text-sm text-gray-700 transition hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            @change="handlePageChange(1)"
          >
            <option v-for="option in orderByOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
          <ChevronDown class="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
        </label>
      </div>
    </section>

    <div v-if="loading" class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <div
        v-for="i in 12"
        :key="i"
        class="surface-card h-[148px] animate-pulse p-4"
      >
        <div class="mb-3 h-5 w-2/3 rounded-full bg-gray-200"></div>
        <div class="mb-2 h-3 w-1/2 rounded-full bg-gray-100"></div>
        <div class="h-3 w-1/3 rounded-full bg-gray-100"></div>
        <div class="mt-6 flex justify-between">
          <div class="h-5 w-20 rounded-full bg-gray-200"></div>
          <div class="h-5 w-16 rounded-full bg-gray-100"></div>
        </div>
      </div>
    </div>

    <div
      v-else-if="courses && courses.length === 0"
      class="surface-card py-16 text-center"
    >
      <BookOpen class="mx-auto mb-3 h-8 w-8 text-gray-400" aria-hidden="true" />
      <p class="font-medium text-gray-700">没有找到课程</p>
      <p class="mt-1 text-sm text-gray-500">试试切换课程类型，或添加一门新课程。</p>
    </div>

    <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <RouterLink
        v-for="course in courses"
        :key="course.id"
        :to="`/review/course/${course.id}`"
        class="group surface-card flex min-h-[148px] flex-col p-4 transition duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
      >
        <div class="flex min-w-0 items-start justify-between gap-3">
          <div class="min-w-0">
            <h2 class="line-clamp-2 text-base font-semibold leading-6 text-gray-900 transition-colors group-hover:text-blue-700">
              {{ course.name }}
            </h2>
            <p class="mt-1.5 truncate text-sm text-gray-600">{{ course.teacher || '教师待补充' }}</p>
          </div>
          <span class="shrink-0 rounded-md bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-600">
            {{ courseTypeLabel(course.classification) }}
          </span>
        </div>

        <div class="mt-auto flex items-end justify-between gap-3 border-t border-gray-100 pt-3">
          <div class="min-w-0">
            <div class="flex items-center gap-1.5 text-sm">
              <Star class="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
              <strong class="font-semibold text-gray-900">{{ course.average_rating.toFixed(1) }}</strong>
              <span class="text-xs text-gray-500">{{ course.review_count }} 条评价</span>
            </div>
            <p class="mt-1 truncate text-xs text-gray-500">{{ course.semester || '学期待补充' }}</p>
          </div>
          <div class="shrink-0 text-right">
            <p class="text-[11px] text-gray-400">标准化评分</p>
            <p class="text-sm font-semibold tabular-nums text-gray-700">{{ course.normalized_rating.toFixed(2) }}</p>
          </div>
        </div>
      </RouterLink>
    </div>

    <div class="mt-6 flex justify-center overflow-x-auto" v-if="totalPages > 1">
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
  </AppPageLayout>
</template>

<script setup lang="ts">
import { onMounted, computed, ref, onUnmounted } from 'vue'
import { useMessage } from 'naive-ui'
import { api } from '@/lib/requests'
import { APICourseList, APICourseListQuery } from '@/types/api/courseReview/course'
import { z } from 'zod'
import { ArrowUpDown, BookOpen, ChevronDown, PlusCircle, Star, Tags } from 'lucide-vue-next'
import AddCourseModal from '@/components/courseReview/course/AddCourseModal.vue'
import AppPageLayout from '@/components/layout/AppPageLayout.vue'
import ReviewDirectoryNav from '@/components/courseReview/ReviewDirectoryNav.vue'

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
const coursePageSize = 12

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

const courseTypeLabels: Record<string, string> = Object.fromEntries(
  courseTypeOptions.map(option => [option.value, option.label.replace('全部课程', '课程')]),
)

const courseTypeLabel = (value: string) => courseTypeLabels[value] || value || '课程'

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
        pageSize: coursePageSize,
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
