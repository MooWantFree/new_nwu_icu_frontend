<template>
  <div class="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-4xl font-bold text-gray-900">教师列表</h1>
      <button
        @click="handleAddTeacher"
        class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center"
      >
        <PlusCircle class="w-5 h-5 mr-2" />
        添加教师
      </button>
      <!-- TODO: Implement AddTeacherModal component -->
      <!-- <AddTeacherModal v-model="showAddTeacherModal" /> -->
    </div>

    <div class="mb-8 flex flex-wrap items-center justify-end gap-4">
      <select
        v-model="schoolFilter"
        class="w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="" selected>全部学院</option>
        <option
          v-for="option in schoolOptions"
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

    <div
      v-else-if="teachers && teachers.length === 0"
      class="text-center text-xl text-gray-500 my-12"
    >
      暂无数据
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      <div
        v-for="teacher in teachers"
        :key="teacher.id"
        class="bg-white rounded-xl shadow-md p-6 transition duration-300 hover:shadow-xl hover:transform hover:-translate-y-1"
      >
        <div class="flex items-center mb-4">
          <n-avatar
            round
            :size="60"
            :src="`/api/download/${teacher.avatar_uuid}`"
          >
            <template #fallback>
              <div
                :class="[
                  'w-full h-full flex justify-center items-center text-white text-2xl font-bold',
                  [
                    'bg-red-500',
                    'bg-blue-500',
                    'bg-green-500',
                    'bg-yellow-500',
                    'bg-purple-500',
                  ][teacher.name.charCodeAt(0) % 5],
                ]"
              >
                {{ teacher.name.charAt(0).toUpperCase() }}
              </div>
            </template>
          </n-avatar>
          <div class="ml-4">
            <h2 class="text-xl font-semibold">
              <router-link
                :to="`/review/teacher/${teacher.id}`"
                class="text-blue-600 hover:text-blue-800 transition duration-300"
              >
                {{ teacher.name }}
              </router-link>
            </h2>
            <p class="text-gray-600">{{ teacher.school }}</p>
          </div>
        </div>
        <p class="text-gray-700 mb-3 line-clamp-2">
          {{ teacher.description || '暂无描述' }}
        </p>
        <div class="flex items-center mb-3">
          <span class="text-gray-700">课程数量: </span>
          <span class="ml-2 text-gray-700 font-medium">
            {{ teacher.course_count }}
          </span>
        </div>
        <div class="flex items-center mb-3">
          <span class="text-gray-700">平均评分: </span>
          <n-rate
            readonly
            :value="teacher.average_rating"
            :allow-half="true"
            size="small"
          />
          <span class="ml-2 text-gray-700 font-medium">
            {{ teacher.average_rating.toFixed(1) }}
          </span>
        </div>
        <div class="flex justify-end">
          <n-button
            size="small"
            type="primary"
            @click="router.push(`/review/teacher/${teacher.id}`)"
          >
            查看详情
          </n-button>
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
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { api } from '@/lib/requests'
import { PlusCircle } from 'lucide-vue-next'

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
  avatar_uuid?: string
  description?: string
  course_count: number
  average_rating: number
}

const teachers = ref<Teacher[]>([])
const schoolFilter = ref('')
const orderBy = ref<OrderBy>(OrderBy.Rating)
const data = ref<{ count: number; max_page: number; page: number; results: Teacher[] } | null>(null)
const loading = ref(true)
const currentPage = ref(1)
const showAddTeacherModal = ref(false)

const handleAddTeacher = () => {
  showAddTeacherModal.value = true
  // TODO: Implement teacher addition functionality
}

// Mock school options - replace with actual data from API when available
const schoolOptions = [
  { label: '计算机学院', value: '计算机学院' },
  { label: '经济与管理学院', value: '经济与管理学院' },
  { label: '物理学院', value: '物理学院' },
  { label: '化学与材料科学学院', value: '化学与材料科学学院' },
  { label: '生命科学学院', value: '生命科学学院' },
  { label: '外国语学院', value: '外国语学院' },
  { label: '马克思主义学院', value: '马克思主义学院' },
]

const orderByOptions = [
  { label: '评分排序', value: OrderBy.Rating },
  { label: '热门排序', value: OrderBy.Popular },
]

const fetchTeachers = async (page: number = 1) => {
  loading.value = true
  const requestParams: Record<string, string> = {
    order_by: orderBy.value,
    page: page.toString(),
  }
  
  if (schoolFilter.value) {
    requestParams.school = schoolFilter.value
  }

  try {
    // TODO: Replace with actual API endpoint when available
    // This is a mock implementation
    // const response = await api.get({
    //   url: '/api/assessment/teacherlist/',
    //   query: requestParams,
    // })
    // teachers.value = response.content.results
    // data.value = response.content
    
    // Mock data for demonstration
    setTimeout(() => {
      const mockTeachers: Teacher[] = [
        {
          id: 1,
          name: '张教授',
          school: '计算机学院',
          description: '计算机科学与技术专业教授，主要研究方向为人工智能和机器学习。',
          course_count: 5,
          average_rating: 4.5,
        },
        {
          id: 2,
          name: '李教授',
          school: '物理学院',
          description: '理论物理专业教授，主要研究方向为量子力学和相对论。',
          course_count: 3,
          average_rating: 4.2,
        },
        {
          id: 3,
          name: '王教授',
          school: '经济与管理学院',
          description: '经济学专业教授，主要研究方向为宏观经济学和金融经济学。',
          course_count: 4,
          average_rating: 4.0,
        },
        {
          id: 4,
          name: '刘教授',
          school: '化学与材料科学学院',
          description: '有机化学专业教授，主要研究方向为有机合成和药物化学。',
          course_count: 6,
          average_rating: 4.7,
        },
        {
          id: 5,
          name: '陈教授',
          school: '生命科学学院',
          description: '分子生物学专业教授，主要研究方向为基因表达调控和蛋白质功能。',
          course_count: 2,
          average_rating: 3.8,
        },
        {
          id: 6,
          name: '杨教授',
          school: '外国语学院',
          description: '英语语言文学专业教授，主要研究方向为英美文学和翻译理论。',
          course_count: 7,
          average_rating: 4.3,
        },
      ]

      // Filter by school if needed
      const filteredTeachers = schoolFilter.value
        ? mockTeachers.filter(t => t.school === schoolFilter.value)
        : mockTeachers

      // Sort by selected order
      if (orderBy.value === OrderBy.Rating) {
        filteredTeachers.sort((a, b) => b.average_rating - a.average_rating)
      } else {
        filteredTeachers.sort((a, b) => b.course_count - a.course_count)
      }

      teachers.value = filteredTeachers
      data.value = {
        count: filteredTeachers.length,
        max_page: 1,
        page: 1,
        results: filteredTeachers
      }
      loading.value = false
    }, 500) // Simulate network delay
  } catch (error) {
    console.error('Error fetching teachers:', error)
    message.error('网络错误，请重试')
    loading.value = false
  }
}

onMounted(async () => {
  await fetchTeachers()
})

const totalPages = computed(() => data.value?.max_page || 1)

const handlePageChange = async (page: number) => {
  currentPage.value = page
  await fetchTeachers(page)
}
</script>