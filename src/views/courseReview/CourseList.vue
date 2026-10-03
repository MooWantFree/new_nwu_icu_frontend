<template>
  <main class="course-directory min-h-[calc(100vh-7rem)] bg-zinc-50 text-zinc-950">
    <div class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <header class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">课程目录</h1>
          <span v-if="totalCourses > 0" class="text-sm text-zinc-500">共 {{ totalCourses }} 门课程</span>
        </div>
        <ReviewDirectoryNav active="course" />
      </header>

      <AddCourseModal v-model="showAddCourseModal" />

      <section class="mb-5 flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-2.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div class="grid grid-cols-2 gap-2 sm:flex sm:items-center" aria-label="课程筛选">
          <label class="relative min-w-0 sm:w-36">
            <span class="sr-only">课程类型</span>
            <Tags class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden="true" />
            <select
              :value="courseType"
              class="h-10 w-full appearance-none rounded-md border border-zinc-200 bg-white py-2 pl-9 pr-8 text-sm text-zinc-700 shadow-sm transition-colors hover:border-zinc-300 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
              @change="handleFilterChange('course_type', $event)"
            >
              <option v-for="option in courseTypeOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
            <ChevronDown class="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
          </label>
          <label class="relative min-w-0 sm:w-36">
            <span class="sr-only">排序方式</span>
            <ArrowUpDown class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden="true" />
            <select
              :value="orderBy"
              class="h-10 w-full appearance-none rounded-md border border-zinc-200 bg-white py-2 pl-9 pr-8 text-sm text-zinc-700 shadow-sm transition-colors hover:border-zinc-300 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
              @change="handleFilterChange('order_by', $event)"
            >
              <option v-for="option in orderByOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
            <ChevronDown class="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
          </label>
        </div>
        <button
          type="button"
          @click="handleAddCourse"
          class="inline-flex min-h-11 w-fit items-center justify-center gap-2 self-end rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 sm:self-auto"
        >
          <PlusCircle class="h-4 w-4" aria-hidden="true" />
          添加课程
        </button>
      </section>

      <div v-if="loading" class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div
          v-for="i in 12"
          :key="i"
          class="course-card h-[172px] p-4 motion-safe:animate-pulse"
        >
          <div class="mb-3 h-5 w-2/3 rounded bg-zinc-200"></div>
          <div class="mb-2 h-3 w-1/2 rounded bg-zinc-100"></div>
          <div class="h-3 w-1/3 rounded bg-zinc-100"></div>
          <div class="mt-6 flex justify-between">
            <div class="h-5 w-20 rounded bg-zinc-200"></div>
            <div class="h-5 w-16 rounded bg-zinc-100"></div>
          </div>
        </div>
      </div>

      <div
        v-else-if="courses && courses.length === 0"
        class="course-card py-16 text-center"
      >
        <BookOpen class="mx-auto mb-3 h-8 w-8 text-zinc-400" aria-hidden="true" />
        <p class="font-medium text-zinc-700">没有找到课程</p>
        <p class="mt-1 text-sm text-zinc-500">试试切换课程类型，或添加一门新课程。</p>
      </div>

      <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <RouterLink
          v-for="course in courses"
          :key="course.id"
          :to="`/review/course/${course.id}`"
          class="group course-card flex min-h-[172px] flex-col gap-4 p-4 transition-colors hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
        >
          <div class="flex min-w-0 items-start justify-between gap-3">
            <div class="min-w-0">
              <h2 class="line-clamp-2 text-base font-semibold leading-6 text-zinc-950 underline-offset-4 group-hover:underline">
                {{ course.name }}
              </h2>
              <p class="mt-1.5 truncate text-sm text-zinc-600">{{ course.teacher || '教师待补充' }}</p>
            </div>
            <span class="shrink-0 rounded-md border border-zinc-200 bg-zinc-100 px-2 py-1 text-[11px] font-medium text-zinc-600">
              {{ courseTypeLabel(course.classification) }}
            </span>
          </div>

          <div class="mt-auto flex items-end justify-between gap-3 border-t border-zinc-100 pt-3">
            <div class="min-w-0">
              <div class="flex items-center gap-1.5 text-sm">
                <Star class="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                <strong class="font-semibold text-zinc-900">{{ course.average_rating.toFixed(1) }}</strong>
                <span class="text-xs text-zinc-500">{{ course.review_count }} 条评价</span>
              </div>
              <p class="mt-1 truncate text-xs text-zinc-500">{{ course.semester || '学期待补充' }}</p>
            </div>
            <div class="shrink-0 text-right">
              <p class="text-[11px] text-zinc-500">标准化评分</p>
              <p class="text-sm font-semibold tabular-nums text-zinc-700">{{ course.normalized_rating.toFixed(2) }}</p>
            </div>
          </div>
        </RouterLink>
      </div>

      <div class="mt-6 flex min-w-0 justify-center" v-if="totalPages > 1">
        <ReviewPagination
          :page="currentPage"
          :page-count="totalPages"
          @update:page="handlePageChange"
        />
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { api } from '@/lib/requests'
import { APICourseList, APICourseListQuery } from '@/types/api/courseReview/course'
import { ArrowUpDown, BookOpen, ChevronDown, PlusCircle, Star, Tags } from 'lucide-vue-next'
import AddCourseModal from '@/components/courseReview/course/AddCourseModal.vue'
import ReviewDirectoryNav from '@/components/courseReview/ReviewDirectoryNav.vue'
import ReviewPagination from '@/components/courseReview/ReviewPagination.vue'

const message = useMessage()
const route = useRoute()
const router = useRouter()

enum OrderBy {
  Rating = 'rating',
  Popular = 'popular',
}

const CourseType = APICourseListQuery.shape.course_type.enum 

const courses = ref<APICourseList['response']['results']>([])
const courseType = computed(() => {
  const parsed = APICourseListQuery.shape.course_type.safeParse(route.query.course_type)
  return parsed.success ? parsed.data : CourseType.all
})
const orderBy = computed(() => route.query.order_by === OrderBy.Popular ? OrderBy.Popular : OrderBy.Rating)
const totalCourses = ref(0)
const data = ref<APICourseList['response'] | null>(null)
const loading = ref(true)
const currentPage = computed(() => {
  const page = Number(route.query.page)
  return Number.isSafeInteger(page) && page > 0 ? page : 1
})
const showAddCourseModal = ref(false)
const coursePageSize = 12

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

const fetchCourses = async (isCurrent: () => boolean) => {
  loading.value = true
  courses.value = []
  totalCourses.value = 0
  data.value = null

  try {
    const response = await api.get({
      url: '/api/assessment/courselist/',
      query: {
        order_by: orderBy.value,
        course_type: courseType.value,
        page: currentPage.value,
        pageSize: coursePageSize,
      },
    })
    if (!isCurrent()) return
    if (response.status !== 200) throw new Error('Failed to fetch courses')
    courses.value = response.content.results
    totalCourses.value = response.content.count
    data.value = response.content
  } catch (error) {
    if (!isCurrent()) return
    console.error('Error fetching courses:', error)
    message.error('网络错误，请重试')
  } finally {
    if (isCurrent()) loading.value = false
  }
}

watch([courseType, orderBy, currentPage], (_state, _oldState, onCleanup) => {
  let current = true
  onCleanup(() => { current = false })
  void fetchCourses(() => current)
}, { immediate: true })

const totalPages = computed(() => data.value?.max_page || 1)
const handlePageChange = (page: number) => router.push({
  query: { ...route.query, page: page.toString() },
})
const handleFilterChange = (key: 'course_type' | 'order_by', event: Event) => router.push({
  query: { ...route.query, [key]: (event.target as HTMLSelectElement).value, page: '1' },
})
</script>

<style scoped>
.course-card {
  border: 1px solid #e4e4e7;
  border-radius: 0.75rem;
  background: #fff;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.025);
}

.course-card[href]:hover {
  border-color: #d4d4d8;
  background: #fafafa;
}

</style>
