<template>
  <div class="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-4xl font-bold text-gray-900">教师列表</h1>
      <button @click="showAddTeacherModal = true"
        class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center">
        <PlusCircle class="w-5 h-5 mr-2" />
        添加教师
      </button>
    </div>
    <AddTeacherModal v-model="showAddTeacherModal" @add="handleTeacherAdded" />

    <div class="mb-8 flex flex-wrap items-center justify-end gap-4">
      <select v-model="schoolFilter"
        class="w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="" selected>全部学院</option>
        <option v-if="schoolOptions.length === 0" value="" disabled>学院列表加载中...</option>
        <option v-for="option in schoolOptions" :key="option.label" :value="option.label">
          {{ option.label }}
        </option>
      </select>
      <select v-model="orderBy"
        class="w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="" disabled selected>选择排序方式</option>
        <option v-for="option in orderByOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
      <button @click="handlePageChange(1)" :disabled="loading"
        class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed">
        {{ loading ? '加载中...' : '应用筛选' }}
      </button>
    </div>

    <div v-if="loading" class="space-y-6">
      <div v-for="i in 5" :key="i" class="bg-white rounded-xl shadow-md p-6 animate-pulse">
        <div class="flex items-center mb-4">
          <div class="h-16 w-16 bg-gray-200 rounded-full"></div>
          <div class="ml-4">
            <div class="h-6 bg-gray-200 rounded-full w-32 mb-2"></div>
            <div class="h-4 bg-gray-200 rounded-full w-24"></div>
          </div>
        </div>
        <div class="h-4 bg-gray-200 rounded-full w-3/4 mb-3"></div>
        <div class="h-4 bg-gray-200 rounded-full w-1/2 mb-3"></div>
        <div class="flex justify-between items-center mt-5">
          <div class="h-9 bg-gray-200 rounded-full w-28"></div>
          <div class="h-5 bg-gray-200 rounded-full w-20"></div>
        </div>
      </div>
    </div>

    <div v-else-if="teachers && teachers.length === 0" class="text-center text-xl text-gray-500 my-12">
      暂无数据
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      <div v-for="teacher in teachers" :key="teacher.id"
        class="bg-white rounded-xl shadow-md p-6 transition duration-300 hover:shadow-xl hover:transform hover:-translate-y-1">
        <div class="flex items-center mb-4">
          <n-avatar round :size="60" :src="`/api/download/${teacher.avatar}`">
            <template #fallback>
              <div :class="[
                'w-full h-full flex justify-center items-center text-white text-2xl font-bold',
                [
                  'bg-red-500',
                  'bg-blue-500',
                  'bg-green-500',
                  'bg-yellow-500',
                  'bg-purple-500',
                ][teacher.name.charCodeAt(0) % 5],
              ]">
                {{ teacher.name.charAt(0).toUpperCase() }}
              </div>
            </template>
          </n-avatar>
          <div class="ml-4">
            <h2 class="text-xl font-semibold">
              <router-link :to="`/review/teacher/${teacher.id}`"
                class="text-blue-600 hover:text-blue-800 transition duration-300">
                {{ teacher.name }}
              </router-link>
            </h2>
            <p class="text-gray-600">{{ teacher.school }}</p>
          </div>
        </div>
        <div class="flex justify-end">
          <n-button size="small" type="primary" @click="router.push(`/review/teacher/${teacher.id}`)">
            查看详情
          </n-button>
        </div>
      </div>
    </div>

    <div class="flex justify-center mt-12" v-if="totalPages > 1">
      <n-pagination v-model:page="currentPage" :page-count="totalPages" :on-update:page="handlePageChange"
        :page-slot="5" show-quick-jumper>
        <template #prefix>
          第 {{ currentPage }} 页 / 共 {{ totalPages }} 页
        </template>
      </n-pagination>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { api } from '@/lib/requests'
import { PlusCircle } from 'lucide-vue-next'
import AddTeacherModal from '@/components/courseReview/course/AddTeacherModal.vue'

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
  avatar: string
}

const teachers = ref<Teacher[]>([])
const schoolFilter = ref<string>('')
const orderBy = ref<OrderBy>(OrderBy.Rating)
const data = ref<{ count: number; max_page: number; page: number; results: Teacher[] } | null>(null)
const loading = ref(true)
const currentPage = ref(1)
const showAddTeacherModal = ref(false)

const handleTeacherAdded = ({ id }: { id: number, name: string, school: string }) => {
  router.push({
    name: 'teacherReviewItem',
    params: { id },
  })
}

// School options loaded from API
const schoolOptions = ref<{ label: string; value: number }[]>([])

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
      school?: string;
      order: 'rating' | 'popular';
    } = {
      page,
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

    schoolOptions.value = response.content.schools.map((school: { id: number, name: string }) => ({
      label: school.name,
      value: school.id
    }))
  } catch (error) {
    console.error('Error fetching school options:', error)
    message.error('获取学院列表失败')
  }
}

onMounted(async () => {
  await Promise.all([fetchTeachers(), fetchSchoolOptions()])
})

const totalPages = computed(() => data.value?.max_page || 1)

const handlePageChange = async (page: number) => {
  currentPage.value = page
  await fetchTeachers(page)
}
</script>