<template>
  <div v-if="modelValue" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="closeModal">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
      <div class="flex items-start justify-between p-4 sm:p-5 border-b border-gray-300">
        <h3 class="text-xl sm:text-2xl font-semibold">添加课程</h3>
        <button
          class="p-1 ml-auto bg-transparent border-0 text-black float-right text-3xl leading-none font-semibold outline-none focus:outline-none hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center w-8 h-8 rounded-md"
          @click="closeModal">
          <span class="bg-transparent text-black block outline-none focus:outline-none">×</span>
        </button>
      </div>
      <div class="p-4 sm:p-6">
        <div v-if="loading" class="flex justify-center items-center py-12">
          <LoaderCircle class="w-10 h-10 animate-spin text-blue-500" />
        </div>
        <div v-else class="space-y-6">
          <p v-if="errorMessage.other" class="mt-1 text-sm text-red-600">{{ errorMessage.other }}</p>
          <form @submit.prevent="submitCourse" class="space-y-5">
            <div>
              <label for="courseName" class="block text-sm font-medium text-gray-700 mb-1">课程名称</label>
              <input type="text" id="courseName" v-model="courseName"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入课程名称" :disabled="loadingSubmit" />
              <p v-if="errorMessage.courseName" class="mt-1 text-sm text-red-600">{{ errorMessage.courseName }}</p>
            </div>

            <div>
              <label for="courseSchool" class="block text-sm font-medium text-gray-700 mb-1">所属学院</label>
              <select id="courseSchool" v-model="courseSchool"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                :disabled="loadingSubmit">
                <option value="0" disabled>请选择学院</option>
                <option v-for="school in schools" :key="school.id" :value="school.id">{{ school.name }}</option>
              </select>
              <p v-if="errorMessage.courseSchool" class="mt-1 text-sm text-red-600">{{ errorMessage.courseSchool }}</p>
            </div>

            <div>
              <label for="courseClassification" class="block text-sm font-medium text-gray-700 mb-1">课程分类</label>
              <select id="courseClassification" v-model="courseClassification"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                :disabled="loadingSubmit">
                <option value="" disabled>请选择课程分类</option>
                <option v-for="option in courseTypeOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
              <p v-if="errorMessage.courseClassification" class="mt-1 text-sm text-red-600">{{
                errorMessage.courseClassification }}</p>
            </div>

            <div>
              <label for="teacherId" class="block text-sm font-medium text-gray-700 mb-1">授课教师</label>
              <button @click.prevent="showTeacherSelectorModal = true" type="button"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between"
                :disabled="loadingSubmit">
                <div v-if="selectedTeacher.id" class="flex items-center">
                  <div class="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                    <div :class="[
                      'w-full h-full flex justify-center items-center text-white text-sm font-bold',
                      [
                        'bg-indigo-500',
                        'bg-teal-600',
                        'bg-orange-600',
                        'bg-pink-600',
                        'bg-cyan-600',
                      ][selectedTeacher.name.charCodeAt(0) % 5],
                    ]">
                      {{ selectedTeacher.name.charAt(0).toUpperCase() }}
                    </div>
                  </div>
                  <div class="ml-3 text-left">
                    <div class="text-base font-medium text-gray-900">{{ selectedTeacher.name }}</div>
                    <div class="text-sm text-gray-600">{{ selectedTeacher.school }}</div>
                  </div>
                </div>
                <span v-else class="text-gray-500">选择授课教师</span>
                <span class="text-blue-600">
                  <span v-if="selectedTeacher.id">更换</span>
                  <span v-else>选择</span>
                </span>
              </button>
              <p v-if="errorMessage.teacherId" class="mt-1 text-sm text-red-600">{{ errorMessage.teacherId }}</p>
            </div>
            <TeacherSelector v-model="showTeacherSelectorModal" @select="selectedTeacher = $event" />

            <div class="flex justify-end space-x-4 pt-6">
              <button type="button" @click="closeModal"
                class="px-5 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                :disabled="loadingSubmit">
                取消
              </button>
              <button type="submit"
                class="px-5 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                :disabled="loadingSubmit">
                <LoaderCircle v-if="loadingSubmit" class="w-5 h-5 mr-2 text-white animate-spin" />
                {{ loadingSubmit ? '提交中...' : '提交' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { LoaderCircle } from 'lucide-vue-next'
import { useMessage } from 'naive-ui'
import { api } from '@/lib/requests'
import { APICourseListQuery, APICourseNewQuery } from '@/types/api/courseReview/course'
import TeacherSelector from './_component/TeacherSelector.vue'
import { z } from 'zod'
import { useRouter } from 'vue-router'

const props = defineProps<{
  modelValue: boolean
  initValue?: {
    name?: string
    school?: number
    classification?: CourseClassification
    teacher?: {
      id: number
      name: string
      school: string
    }
  }
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'select', courseId: number): void
}>()

type CourseClassification = z.infer<typeof APICourseNewQuery>['classification'] | ""
const CourseType = APICourseListQuery.shape.course_type.enum
const courseTypeOptions = [
  { label: '通识课', value: CourseType.general },
  { label: '体育课', value: CourseType.pe },
  { label: '英语课', value: CourseType.english },
  { label: '专业课', value: CourseType.professional },
  { label: '政治课', value: CourseType.politics },
  { label: '必修课', value: CourseType.required },
  { label: '选修课', value: CourseType.optional },
]

const message = useMessage()
const router = useRouter()
const errorMessage = ref<{
  courseName?: string
  courseSchool?: string
  courseClassification?: string
  teacherId?: string
  other?: string
}>({
  courseName: '',
  courseSchool: '',
  courseClassification: '',
  teacherId: '',
  other: '',
})
const loading = ref(true)
const loadingSubmit = ref(false)
const showTeacherSelectorModal = ref(false)
const schools = ref<{
  id: number,
  name: string
}[]>([])

const courseName = ref(props.initValue?.name || "")
const courseSchool = ref(props.initValue?.school || 0)
const courseClassification = ref<CourseClassification>(props.initValue?.classification || "")
const selectedTeacher = ref<{
  id: number
  name: string
  school: string
}>(props.initValue?.teacher || {
  id: 0,
  name: "",
  school: ""
})

const closeModal = () => {
  emit('update:modelValue', false)
}

onMounted(() => {
  loadSchoolId()
})

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}, { immediate: true })

const loadSchoolId = async () => {
  loading.value = true
  try {
    const resp = await api.get({
      url: '/api/assessment/school/'
    })
    schools.value = resp.data.contents.schools
  } catch (error) {
    message.error('加载学院失败')
  } finally {
    loading.value = false
  }
}

watch(() => courseName.value,
  () => {
    errorMessage.value.courseName = ''
  }
)
watch(() => courseSchool.value,
  () => {
    errorMessage.value.courseSchool = ''
  }
)
watch(() => courseClassification.value,
  () => {
    errorMessage.value.courseClassification = ''
  }
)
watch(() => selectedTeacher.value.id,
  () => {
    errorMessage.value.teacherId = ''
  }
)

const submitCourse = async () => {
  // Reset error messages before validation
  errorMessage.value = {
    courseName: '',
    courseSchool: '',
    courseClassification: '',
    teacherId: '',
    other: ''
  }

  // Validate required fields
  // For type system 
  if (courseClassification.value === "") {
    errorMessage.value.courseClassification = '课程分类不能为空'
    return
  }
  if (!courseName.value || courseName.value.trim() === '') {
    errorMessage.value.courseName = '课程名称不能为空'
  }
  if (!courseSchool.value || courseSchool.value === 0) {
    errorMessage.value.courseSchool = '请选择所属学院'
  }
  if (!courseClassification.value) {
    errorMessage.value.courseClassification = '课程分类不能为空'
  }
  if (!selectedTeacher.value.id || selectedTeacher.value.id === 0) {
    errorMessage.value.teacherId = '请选择授课教师'
  }

  // Check if any validation errors exist
  if (errorMessage.value.courseName ||
    errorMessage.value.courseSchool ||
    errorMessage.value.courseClassification ||
    errorMessage.value.teacherId) {
    return
  }

  // Submit
  try {
    loadingSubmit.value = true

    const resp = await api.post({
      url: '/api/assessment/course/',
      query: {
        name: courseName.value,
        school: courseSchool.value,
        classification: courseClassification.value,
        teacher_id: selectedTeacher.value.id
      }
    })
    if (resp.status === 200) {
      message.success('添加课程成功')
      router.push({
        name: 'courseReviewItem',
        params: {
          id: resp.data.contents.course_id
        }
      })
      closeModal()
    } else {
      errorMessage.value.other = '添加课程失败: ' + JSON.stringify(resp.errors)
    }
  } catch (error) {
    if (error instanceof Error) {
      errorMessage.value.other = '添加课程失败: ' + error.message
    }
  } finally {
    loadingSubmit.value = false
  }
}
</script>