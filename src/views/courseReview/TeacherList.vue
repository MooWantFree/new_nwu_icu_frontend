<template>
  <main class="teacher-directory min-h-[calc(100vh-7rem-6px)] w-full bg-zinc-50 text-zinc-950">
    <div class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <header class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">教师目录</h1>
          <span v-if="totalTeachers > 0" class="text-sm text-zinc-500">共 {{ totalTeachers }} 位教师</span>
        </div>
        <ReviewDirectoryNav active="teacher" />
      </header>

      <AddTeacherModal v-model="showAddTeacherModal" @add="handleTeacherAdded" />

      <section class="mb-5 flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-2.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div class="grid grid-cols-2 gap-2 sm:flex sm:items-center" aria-label="教师筛选">
          <label class="min-w-0 sm:w-60">
            <span class="sr-only">选择学院</span>
            <n-select
              :value="schoolFilter"
              :options="schoolOptions"
              :loading="schoolOptions.length === 1"
              :theme-overrides="reviewSelectTheme"
              filterable
              size="large"
              aria-label="选择学院"
              @update:value="handleFilterChange('school', $event)"
            />
          </label>
          <label class="min-w-0 sm:w-36">
            <span class="sr-only">排序方式</span>
            <n-select
              :value="orderBy"
              :options="orderByOptions"
              :theme-overrides="reviewSelectTheme"
              size="large"
              aria-label="排序方式"
              @update:value="handleFilterChange('order', $event)"
            />
          </label>
        </div>
        <button
          type="button"
          class="inline-flex min-h-11 w-fit items-center justify-center gap-2 self-end rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 sm:self-auto"
          @click="showAddTeacherModal = true"
        >
          <PlusCircle class="h-4 w-4" aria-hidden="true" />
          添加教师
        </button>
      </section>

      <div v-if="loading" class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label="正在加载教师目录" role="status">
        <span class="sr-only">正在加载教师目录</span>
        <div v-for="i in teacherSkeletonCount" :key="i" class="flex min-h-24 items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 motion-safe:animate-pulse" aria-hidden="true">
          <div class="h-10 w-10 shrink-0 rounded-lg bg-zinc-100" />
          <div class="min-w-0 flex-1">
            <div class="mb-2 h-4 w-20 rounded bg-zinc-200" />
            <div class="h-3 w-full max-w-36 rounded bg-zinc-100" />
          </div>
        </div>
      </div>

      <div v-else-if="teachers && teachers.length === 0" class="rounded-xl border border-zinc-200 bg-white px-5 py-16 text-center">
        <UsersRound class="mx-auto mb-3 h-8 w-8 text-zinc-400" aria-hidden="true" />
        <p class="font-medium text-zinc-900">没有找到教师</p>
        <p class="mt-1 text-sm text-zinc-500">试试切换学院，或添加一位新教师。</p>
      </div>

      <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <RouterLink
          v-for="teacher in teachers"
          :key="teacher.id"
          :to="`/review/teacher/${teacher.id}`"
          class="group flex min-h-24 items-center gap-3 overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
        >
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200/70 bg-zinc-100 text-zinc-500">
            <UsersRound class="h-5 w-5" aria-hidden="true" />
          </div>
          <div class="min-w-0 flex-1">
            <h2 class="truncate text-base font-semibold text-zinc-950">{{ teacher.name }}</h2>
            <p class="mt-1 truncate text-xs leading-5 text-zinc-500">{{ teacher.school }}</p>
          </div>
          <ChevronRight class="h-4 w-4 shrink-0 text-zinc-400 transition-colors group-hover:text-zinc-600" aria-hidden="true" />
        </RouterLink>
      </div>

      <div v-if="totalPages > 1" class="mt-8 flex justify-center">
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
import { onMounted, computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { api } from '@/lib/requests'
import { ChevronRight, PlusCircle, UsersRound } from 'lucide-vue-next'
import AddTeacherModal from '@/components/courseReview/course/AddTeacherModal.vue'
import ReviewDirectoryNav from '@/components/courseReview/ReviewDirectoryNav.vue'
import ReviewPagination from '@/components/courseReview/ReviewPagination.vue'
import { reviewSelectTheme } from '@/components/courseReview/reviewTheme'

const router = useRouter()
const route = useRoute()
const message = useMessage()

enum OrderBy {
  Rating = 'rating',
  Popular = 'popular',
}

interface Teacher {
  id: number
  name: string
  school: string
}

const teachers = ref<Teacher[]>([])
const schoolFilter = computed(() => typeof route.query.school === 'string' ? route.query.school : '')
const orderBy = computed(() => route.query.order === OrderBy.Popular ? OrderBy.Popular : OrderBy.Rating)
const data = ref<{ count: number; max_page: number; page: number; results: Teacher[] } | null>(null)
const loading = ref(true)
const currentPage = computed(() => {
  const page = Number(route.query.page)
  return Number.isSafeInteger(page) && page > 0 ? page : 1
})
const totalTeachers = ref(0)
const showAddTeacherModal = ref(false)
const teacherPageSize = 16

const teacherSkeletonCount = computed(() => data.value?.results.length || teacherPageSize)
const handleTeacherAdded = ({ id }: { id: number, name: string, school: string }) => {
  router.push({
    name: 'teacherReviewItem',
    params: { id },
  })
}

// School options loaded from API
const schoolOptions = ref<{ label: string; value: string }[]>([
  { label: '全部学院', value: '' },
])

const orderByOptions = [
  { label: '评分排序', value: OrderBy.Rating },
  { label: '热门排序', value: OrderBy.Popular },
]

const fetchTeachers = async (isCurrent: () => boolean) => {
  loading.value = true
  teachers.value = []
  data.value = null
  totalTeachers.value = 0

  try {
    // Create query object according to APITeacherListQuery type
    const query: {
      page: number;
      page_size: number;
      school?: string;
      order: 'rating' | 'popular';
    } = {
      page: currentPage.value,
      page_size: teacherPageSize,
      order: orderBy.value
    }

    // Only add school if it's defined
    if (schoolFilter.value !== "") {
      query.school = schoolFilter.value
    }

    const response = await api.get({
      url: '/api/assessment/teacher/',
      query
    })
    if (!isCurrent()) return
    if (response.status !== 200) throw new Error('Failed to fetch teachers')
    teachers.value = response.content.results
    data.value = response.content
    totalTeachers.value = response.content.count
  } catch (error) {
    if (!isCurrent()) return
    console.error('Error fetching teachers:', error)
    message.error('网络错误，请重试')
  } finally {
    if (isCurrent()) loading.value = false
  }
}

// Function to fetch school options from API
const fetchSchoolOptions = async () => {
  try {
    const response = await api.get({
      url: '/api/assessment/school/'
    })

    schoolOptions.value = [
      { label: '全部学院', value: '' },
      ...response.content.schools.map((school: { id: number, name: string }) => ({
        label: school.name,
        value: school.name,
      })),
    ]
  } catch (error) {
    console.error('Error fetching school options:', error)
    message.error('获取学院列表失败')
  }
}

watch([schoolFilter, orderBy, currentPage], (_state, _oldState, onCleanup) => {
  let current = true
  onCleanup(() => { current = false })
  void fetchTeachers(() => current)
}, { immediate: true })

onMounted(() => {
  void fetchSchoolOptions()
})

const totalPages = computed(() => data.value?.max_page || 1)

const handlePageChange = (page: number) => router.push({ query: { ...route.query, page: String(page) } })
const handleFilterChange = (key: 'school' | 'order', value: string) => router.push({
  query: { ...route.query, [key]: value || undefined, page: '1' },
})
</script>
