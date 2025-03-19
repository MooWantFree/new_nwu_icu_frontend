<template>
  <div v-if="modelValue" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="closeModal">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
      <div class="flex items-start justify-between p-4 sm:p-5 border-b border-gray-300">
        <h3 class="text-xl sm:text-2xl font-semibold">添加教师</h3>
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
          <form @submit.prevent="submitTeacher" class="space-y-5">
            <div>
              <label for="teacherName" class="block text-sm font-medium text-gray-700 mb-1">教师姓名</label>
              <input type="text" id="teacherName" v-model="teacherName"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入教师姓名" :disabled="loadingSubmit" />
              <p v-if="errorMessage.teacherName" class="mt-1 text-sm text-red-600">{{ errorMessage.teacherName }}</p>
            </div>

            <div>
              <label for="teacherSchool" class="block text-sm font-medium text-gray-700 mb-1">所属学院</label>
              <select id="teacherSchool" v-model="teacherSchool"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                :disabled="loadingSubmit">
                <option value="0" disabled>请选择学院</option>
                <option v-for="school in schools" :key="school.id" :value="school.id">{{ school.name }}</option>
              </select>
              <p v-if="errorMessage.teacherSchool" class="mt-1 text-sm text-red-600">{{ errorMessage.teacherSchool }}
              </p>
            </div>

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

const props = defineProps<{
  modelValue: boolean
  initValue?: {
    name?: string
    school?: number
  }
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'add', teacher: { id: number, name: string, school: string }): void
}>()

const message = useMessage()
const errorMessage = ref<{
  teacherName?: string
  teacherSchool?: string
  other?: string
}>({
  teacherName: '',
  teacherSchool: '',
  other: '',
})
const loading = ref(true)
const loadingSubmit = ref(false)
const schools = ref<{
  id: number,
  name: string
}[]>([])

const teacherName = ref(props.initValue?.name || "")
const teacherSchool = ref(props.initValue?.school || 0)

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

watch(() => teacherName.value,
  () => {
    errorMessage.value.teacherName = ''
  }
)
watch(() => teacherSchool.value,
  () => {
    errorMessage.value.teacherSchool = ''
  }
)

const submitTeacher = async () => {
  // Reset error messages before validation
  errorMessage.value = {
    teacherName: '',
    teacherSchool: '',
    other: ''
  }

  // Validate required fields
  if (!teacherName.value || teacherName.value.trim() === '') {
    errorMessage.value.teacherName = '教师姓名不能为空'
  }
  if (!teacherSchool.value || teacherSchool.value === 0) {
    errorMessage.value.teacherSchool = '请选择所属学院'
  }

  // Check if any validation errors exist
  if (errorMessage.value.teacherName ||
    errorMessage.value.teacherSchool) {
    return
  }

  // Submit
  try {
    loadingSubmit.value = true

    const schoolObj = schools.value.find(s => s.id === teacherSchool.value)
    if (!schoolObj) {
      errorMessage.value.teacherSchool = '无效的学院选择'
      return
    }

    // The API currently only accepts name and school
    // Title field is collected in the UI but not sent to the API yet
    const resp = await api.post({
      url: '/api/assessment/teacher/',
      query: {
        name: teacherName.value,
        school: schoolObj.id
      }
    })

    if (resp.status === 200) {
      message.success('添加教师成功')
      emit('add', { id: resp.data.contents.teacher_id, name: teacherName.value, school: schoolObj.name })
      closeModal()
    }
    else {
      message.error(JSON.stringify(resp.errors))
    }
  } catch (error) {
    message.error('添加教师失败')
  } finally {
    loadingSubmit.value = false
  }
}
</script>
