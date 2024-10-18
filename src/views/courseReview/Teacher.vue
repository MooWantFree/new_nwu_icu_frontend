<template>
  <div class="bg-gray-100 min-h-screen py-8">
    <div class="container mx-auto px-4">
      <div v-if="loading">
        <TeacherSkeleton />
      </div>
      <div v-else-if="teacher">
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <div class="flex items-center mb-4">
            <!-- <n-avatar
              round
              :size="80"
              :src="teacher.teacher_info.avatar"
              fallback-src="https://www.loliapi.com/acg/pp/"
            /> -->
            <div class="ml-4">
              <h1 class="text-2xl font-bold">{{ teacher.teacher_info.name }}</h1>
              <p class="text-gray-600">{{ teacher.teacher_info.school }}</p>
            </div>
          </div>

          <p class="mx-5 text-gray-700">{{ teacher.teacher_info.description || '暂无描述' }}</p>
        </div>

        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 class="text-xl font-semibold mb-4">教授课程</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div v-for="course in teacher.course_list" :key="course.course.id" class="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 class="text-lg font-semibold mb-2">
                <router-link :to="`/review/course/${course.course.id}`" class="text-blue-600 hover:underline">
                  {{ course.course.name }}
                </router-link>
              </h3>
              <p class="text-gray-600 mb-2">{{ course.course.semester || '未知学期' }}</p>
              <!-- TODO: what if semester list is too long -->
              <p class="text-gray-700 mb-4">{{ course.course.description || '暂无课程描述' }}</p>
              <div class="flex justify-between items-start mb-2">
                <span class="text-sm text-gray-500">课程编号: {{ course.course.code || '未知' }}</span>
                <div class="flex flex-col items-end">
                  <div class="flex items-center mb-1">
                    <span class="mr-2 text-sm">平均评分:</span>
                    <n-rate readonly size="small" :value="course.rating_avg" :allow-half="true" />
                    <span class="ml-2 text-sm text-gray-600">{{ course.rating_avg.toFixed(1) }}</span>
                  </div>
                  <div class="flex items-center">
                    <span class="mr-2 text-sm">归一化评分:</span>
                    <n-rate readonly size="small" :value="course.normalized_rating_avg" :allow-half="true" />
                    <span class="ml-2 text-sm text-gray-600">{{ course.normalized_rating_avg.toFixed(1) }}</span>
                  </div>
                </div>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-500">评价数: {{ course.review_count }}</span>
                <n-button size="small" type="primary" @click="router.push(`/review/course/${course.course.id}`)">
                  查看详情
                </n-button>
              </div>
            </div>
          </div>
        </div>

      </div>
      <div v-else class="text-center text-gray-600">
        教师信息不存在
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { NButton } from 'naive-ui'
import { api } from '@/lib/requests'
import { TeacherResponse } from '@/types/api/assessment/teacher'
import TeacherSkeleton from '@/components/courseReview/teacher/TeacherSkeleton.vue'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const teacher = ref<TeacherResponse["success"] | null>(null)
const loading = ref(true)

const fetchTeacherData = async () => {
  const teacherId = route.params.id
  try {
    const { status, content } = await api.get<TeacherResponse>(`/api/assessment/teacher/${teacherId}/`)
    if (status === 200) {
      teacher.value = content
    } else if (status === 404) {
      router.push('/404')
      return
    } else {
      throw new Error('Failed to fetch teacher data')
    }
  } catch (error) {
    console.error('Error fetching teacher data:', error)
    message.error('获取教师信息失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

onMounted(fetchTeacherData)
</script>
