<template>
  <AppPageLayout
    title="教师目录"
    description="按学院浏览授课教师，快速进入教师主页查看课程与评价。"
  >
    <template #meta>
      <span v-if="totalTeachers > 0">共 {{ totalTeachers }} 位教师</span>
    </template>
    <template #actions>
      <button
        @click="showAddTeacherModal = true"
        class="btn-primary"
      >
        <PlusCircle class="w-5 h-5 mr-2" />
        添加教师
      </button>
    </template>

    <AddTeacherModal v-model="showAddTeacherModal" @add="handleTeacherAdded" />

    <section class="surface-card mb-5 flex flex-col gap-3 p-2.5 sm:flex-row sm:items-center sm:justify-between">
      <ReviewDirectoryNav active="teacher" />
      <div class="grid grid-cols-2 gap-2 sm:flex sm:items-center" aria-label="教师筛选">
        <label class="min-w-0 sm:w-60">
          <span class="sr-only">选择学院</span>
          <n-select
            v-model:value="schoolFilter"
            :options="schoolOptions"
            :loading="schoolOptions.length === 1"
            filterable
            size="large"
            aria-label="选择学院"
            @update:value="handlePageChange(1)"
          />
        </label>
        <label class="min-w-0 sm:w-36">
          <span class="sr-only">排序方式</span>
          <n-select
            v-model:value="orderBy"
            :options="orderByOptions"
            size="large"
            aria-label="排序方式"
            @update:value="handlePageChange(1)"
          />
        </label>
      </div>
    </section>

    <div v-if="loading" class="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <div v-for="i in teacherSkeletonCount" :key="i" class="surface-card flex h-[76px] animate-pulse items-center p-4">
        <div class="min-w-0 flex-1">
          <div class="mb-2 h-4 w-20 rounded-full bg-gray-200"></div>
          <div class="h-3 w-full max-w-36 rounded-full bg-gray-100"></div>
        </div>
      </div>
    </div>

    <div v-else-if="teachers && teachers.length === 0" class="surface-card py-16 text-center">
      <UsersRound class="mx-auto mb-3 h-8 w-8 text-gray-400" aria-hidden="true" />
      <p class="font-medium text-gray-700">没有找到教师</p>
      <p class="mt-1 text-sm text-gray-500">试试切换学院，或添加一位新教师。</p>
    </div>

    <div v-else class="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <RouterLink
        v-for="teacher in teachers"
        :key="teacher.id"
        :to="`/review/teacher/${teacher.id}`"
        class="group surface-card flex min-h-[76px] items-center gap-3 overflow-hidden p-4 transition duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
      >
          <div class="min-w-0 flex-1">
            <h2 class="truncate text-base font-semibold text-gray-900 transition-colors group-hover:text-blue-700">
              {{ teacher.name }}
            </h2>
            <p class="mt-1 flex items-center gap-1.5 truncate text-xs leading-4 text-gray-500">
              <Building2 class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span class="truncate">{{ teacher.school }}</span>
            </p>
          </div>
          <ChevronRight class="h-4 w-4 shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-blue-600" aria-hidden="true" />
      </RouterLink>
    </div>

    <div class="mt-6 flex justify-center" v-if="totalPages > 1">
      <n-pagination v-model:page="currentPage" :page-count="totalPages" :on-update:page="handlePageChange"
        :page-slot="isMobile ? 3 : 5" show-quick-jumper size="small">
        <template #prefix>
          <span class="hidden sm:inline">第 {{ currentPage }} 页 / 共 {{ totalPages }} 页</span>
        </template>
      </n-pagination>
    </div>
  </AppPageLayout>
</template>

<script setup lang="ts">
import { onMounted, computed, ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { api } from '@/lib/requests'
import { Building2, ChevronRight, PlusCircle, UsersRound } from 'lucide-vue-next'
import AddTeacherModal from '@/components/courseReview/course/AddTeacherModal.vue'
import AppPageLayout from '@/components/layout/AppPageLayout.vue'
import ReviewDirectoryNav from '@/components/courseReview/ReviewDirectoryNav.vue'

const router = useRouter()
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
const schoolFilter = ref<string>('')
const orderBy = ref<OrderBy>(OrderBy.Rating)
const data = ref<{ count: number; max_page: number; page: number; results: Teacher[] } | null>(null)
const loading = ref(true)
const currentPage = ref(1)
const totalTeachers = ref(0)
const showAddTeacherModal = ref(false)

const isMobile = ref(false)
const handleResize = () => {
  isMobile.value = window.innerWidth < 768
}
const teacherSkeletonCount = computed(() => data.value?.results.length || 12)
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

const fetchTeachers = async (page: number = 1) => {
  loading.value = true

  try {
    // Create query object according to APITeacherListQuery type
    const query: {
      page: number;
      page_size: number;
      school?: string;
      order: 'rating' | 'popular';
    } = {
      page,
      page_size: 12,
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

    teachers.value = response.content.results
    data.value = response.content
    currentPage.value = response.content.page
    totalTeachers.value = response.content.count
    loading.value = false
  } catch (error) {
    console.error('Error fetching teachers:', error)
    message.error('网络错误，请重试')
    loading.value = false
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

onMounted(async () => {
  await Promise.all([fetchTeachers(), fetchSchoolOptions()])
  handleResize()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

const totalPages = computed(() => data.value?.max_page || 1)

const handlePageChange = async (page: number) => {
  currentPage.value = page
  await fetchTeachers(page)
}
</script>
