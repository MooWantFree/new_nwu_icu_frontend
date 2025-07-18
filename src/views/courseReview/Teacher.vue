<template>
  <div class="bg-gray-100 min-h-screen py-8">
    <div class="container mx-auto px-4">
      <component
        v-if="errorMsg.component"
        :is="errorMsg.component"
        :detail="errorMsg.detail"
      />
      <div v-if="loading">
        <TeacherSkeleton />
      </div>
      <div v-else-if="teacher">
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <div class="flex items-center mb-4">
            <n-avatar
              round
              :size="80"
              :src="`/api/download/${
              // @ts-expect-error TODO: No avatar_uuid now
              teacher.teacher_info.avatar_uuid
              }`"
            >
              <template #fallback>
                <div
                  :class="[
                    'w-full h-full flex justify-center items-center text-white text-4xl font-bold',
                    [
                      'bg-red-500',
                      'bg-blue-500',
                      'bg-green-500',
                      'bg-yellow-500',
                      'bg-purple-500',
                    ][teacher.teacher_info.name.charCodeAt(0) % 5],
                  ]"
                >
                  {{ teacher.teacher_info.name.charAt(0).toUpperCase() }}
                </div>
              </template>
            </n-avatar>
            <div class="ml-4">
              <h1 class="text-2xl font-bold">
                {{ teacher.teacher_info.name }}
              </h1>
              <p class="text-gray-600">{{ teacher.teacher_info.school }}</p>
            </div>
          </div>

          <p class="mx-5 text-gray-700">
            {{
              // @ts-expect-error TODO: No description now
             teacher.teacher_info.description 
            || '暂无描述' }}
          </p>
        </div>

        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold">教授课程</h2>
            <AddCourseModal v-model="showTeacherSelectorModal" :init-value="{teacher: teacher.teacher_info}" />
            <button
              type="button"
              class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              @click="handleAddCourseButtonClick"
            >
              <PlusCircle class="h-5 w-5 mr-2 -ml-1" />
              添加课程
            </button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              v-for="course in teacher.course_list"
              :key="course.course.id"
              class="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 class="text-lg font-semibold mb-2">
                <router-link
                  :to="`/review/course/${course.course.id}`"
                  class="text-blue-600 hover:underline"
                >
                  {{ course.course.name }}
                </router-link>
              </h3>
              <p class="text-gray-600 mb-2">
                {{ course.course.semester || '未知学期' }}
              </p>
              <!-- TODO: what if semester list is too long -->
              <p class="text-gray-700 mb-4">
                {{ 
                // @ts-expect-error TODO: No description now
                  course.course.description || '暂无课程描述' }}
              </p>
              <div class="flex justify-between items-start mb-2">
                <span class="text-sm text-gray-500"
                  >课程编号: {{ course.course.code || '未知' }}</span
                >
                <div class="flex flex-col items-end">
                  <div class="flex items-center mb-1">
                    <span class="mr-2 text-sm">平均评分:</span>
                    <n-rate
                      readonly
                      size="small"
                      :value="course.rating_avg"
                      :allow-half="true"
                    />
                    <span class="ml-2 text-sm text-gray-600">{{
                      course.rating_avg.toFixed(1)
                    }}</span>
                  </div>
                  <div class="flex items-center">
                    <span class="mr-2 text-sm">归一化评分:</span>
                    <n-rate
                      readonly
                      size="small"
                      :value="course.normalized_rating_avg"
                      :allow-half="true"
                    />
                    <span class="ml-2 text-sm text-gray-600">{{
                      course.normalized_rating_avg.toFixed(1)
                    }}</span>
                  </div>
                </div>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-500"
                  >评价数: {{ course.review_count }}</span
                >
                <button
                  class="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  @click="router.push(`/review/course/${course.course.id}`)"
                >
                  查看详情
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-center text-gray-600">
        <Page404 />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { NButton } from 'naive-ui'
import { PlusCircle } from 'lucide-vue-next'
import { api } from '@/lib/requests'
import TeacherSkeleton from '@/components/courseReview/teacher/TeacherSkeleton.vue'
import { APITeacherInfo } from '@/types/api/courseReview/teacher'
import AddCourseModal from '@/components/courseReview/course/AddCourseModal.vue'
import Page404 from '@/components/infoNErrors/404.vue'
import Page500 from '@/components/infoNErrors/500.vue'
import { checkLoginStatus } from '@/lib/logins'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const errorMsg = ref<{
  component: typeof Page404 | null,
  detail: string,
}>({
  component: null,
  detail: '',
})
const teacher = ref<APITeacherInfo['response'] | null>(null)
const loading = ref(true)
const showTeacherSelectorModal = ref(false)

const handleAddCourseButtonClick = () => {
  // If user already login then show the modal
  if (checkLoginStatus()) {
    showTeacherSelectorModal.value = true
  } else {
    message.error('请先登录后再进行课程添加')
  }
}

const fetchTeacherData = async () => {
  const teacherId = parseInt(route.params.id as string)
  try {
    const { status, content } = await api.get({
      url: '/api/assessment/teacher/:id/',
      params: { id: teacherId },
    })
    if (status === 200) {
      teacher.value = content
    } else if (status === 404) {
      errorMsg.value = {
        component: Page404,
        detail: '教师信息不存在',
      }
      return
    } else {
      throw new Error('Failed to fetch teacher data')
    }
  } catch (error) {
    console.error('Error fetching teacher data:', error)
    if (error instanceof Error) {
      errorMsg.value = {
        component: Page500,
        detail: error.toString(),
      }
    }
  } finally {
    loading.value = false
  }
}

onMounted(fetchTeacherData)
</script>
