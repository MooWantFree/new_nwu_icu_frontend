<template>
  <ShadcnFormDialog :show="modelValue" title="添加课程" :busy="busy" :suspended="showTeacherSelectorModal" @close="closeModal">
    <div v-if="loading" class="flex min-h-48 items-center justify-center gap-2 text-sm text-zinc-500" role="status">
      <LoaderCircle class="h-5 w-5 animate-spin" aria-hidden="true" />加载中…
    </div>
    <div v-else-if="schoolLoadError" class="rounded-md border border-red-200 bg-red-50/50 p-4 text-sm text-red-600" role="alert">
      <p>{{ schoolLoadError }}</p>
      <button type="button" class="mt-3 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-950 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400" @click="loadSchoolId">重新加载</button>
    </div>
    <form v-else :id="formId" ref="form" class="space-y-5" novalidate @submit.prevent="submitCourse">
      <div v-if="errorMessage.other" role="alert" class="flex items-start gap-2 rounded-md border border-red-200 bg-red-50/50 px-3 py-3 text-sm leading-5 text-red-600">
        <CircleAlert class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><p>{{ errorMessage.other }}</p>
      </div>
      <div class="space-y-2">
        <label :for="`${formId}-name`" class="block text-sm font-medium">课程名称</label>
        <input :id="`${formId}-name`" v-model="courseName" type="text" :class="inputClass" placeholder="请输入课程名称" :disabled="busy"
          :aria-invalid="Boolean(errorMessage.courseName)" :aria-describedby="errorMessage.courseName ? `${formId}-name-error` : undefined" />
        <p v-if="errorMessage.courseName" :id="`${formId}-name-error`" role="alert" class="text-sm text-red-600">{{ errorMessage.courseName }}</p>
      </div>
      <div class="space-y-2">
        <label :for="`${formId}-school`" class="block text-sm font-medium">所属学院</label>
        <NSelect :id="`${formId}-school`" v-model:value="courseSchool" :options="schools" label-field="name" value-field="id" placeholder="请选择学院"
          filterable size="large" :theme-overrides="reviewSelectTheme" aria-label="所属学院" :disabled="busy"
          :status="errorMessage.courseSchool ? 'error' : undefined" :aria-invalid="Boolean(errorMessage.courseSchool)" :aria-describedby="errorMessage.courseSchool ? `${formId}-school-error` : undefined" />
        <p v-if="errorMessage.courseSchool" :id="`${formId}-school-error`" role="alert" class="text-sm text-red-600">{{ errorMessage.courseSchool }}</p>
      </div>
      <div class="space-y-2">
        <label :for="`${formId}-classification`" class="block text-sm font-medium">课程分类</label>
        <NSelect :id="`${formId}-classification`" v-model:value="courseClassification" :options="courseTypeOptions" placeholder="请选择课程分类"
          size="large" :theme-overrides="reviewSelectTheme" aria-label="课程分类" :disabled="busy"
          :status="errorMessage.courseClassification ? 'error' : undefined" :aria-invalid="Boolean(errorMessage.courseClassification)" :aria-describedby="errorMessage.courseClassification ? `${formId}-classification-error` : undefined" />
        <p v-if="errorMessage.courseClassification" :id="`${formId}-classification-error`" role="alert" class="text-sm text-red-600">{{ errorMessage.courseClassification }}</p>
      </div>
      <div class="space-y-2">
        <div class="flex items-center justify-between gap-3">
          <label :for="`${formId}-teacher`" class="block text-sm font-medium">授课教师</label>
          <span v-if="selectedTeachers.length" class="text-xs text-zinc-500">已选 {{ selectedTeachers.length }} 位</span>
        </div>
        <ul v-if="selectedTeachers.length" class="space-y-2" aria-label="已选授课教师">
          <li v-for="teacher in selectedTeachers" :key="teacher.id" class="flex items-center gap-3 rounded-md border border-zinc-200 bg-white px-3 py-2">
            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 text-sm font-medium text-zinc-600" aria-hidden="true">{{ teacher.name.charAt(0) }}</span>
            <span class="min-w-0 flex-1"><span class="block truncate text-sm font-medium">{{ teacher.name }}</span><span class="block truncate text-xs text-zinc-500">{{ teacher.school }}</span></span>
            <button type="button" :disabled="busy" :aria-label="`移除${teacher.name}`"
              class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50"
              @click="removeTeacher(teacher.id)">
              <X class="h-4 w-4" aria-hidden="true" />
            </button>
          </li>
        </ul>
        <button :id="`${formId}-teacher`" type="button" :disabled="busy" :aria-invalid="Boolean(errorMessage.teacherId)"
          :aria-describedby="errorMessage.teacherId ? `${formId}-teacher-error` : undefined" aria-haspopup="dialog" aria-label="选择授课教师"
          class="flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-dashed border-zinc-300 bg-white px-3 py-2 text-sm transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50"
          @click="showTeacherSelectorModal = true">
          <Plus class="h-4 w-4" aria-hidden="true" />{{ selectedTeachers.length ? '添加教师' : '选择教师' }}
        </button>
        <p v-if="errorMessage.teacherId" :id="`${formId}-teacher-error`" role="alert" class="text-sm text-red-600">{{ errorMessage.teacherId }}</p>
      </div>
    </form>
    <template #footer>
      <button type="button" :class="secondaryButton" :disabled="busy" @click="closeModal">取消</button>
      <button type="submit" :form="formId" :class="primaryButton" :disabled="busy || loading || Boolean(schoolLoadError)">
        <LoaderCircle v-if="loadingSubmit || checkingLogin" class="h-4 w-4 animate-spin" aria-hidden="true" />{{ loadingSubmit ? '添加中…' : checkingLogin ? '验证登录中…' : '添加课程' }}
      </button>
    </template>
  </ShadcnFormDialog>
  <TeacherSelector v-if="modelValue" v-model="showTeacherSelectorModal" :selected-teachers="selectedTeachers" @select="selectedTeachers = $event" />
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, useTemplateRef, watch } from 'vue'
import { CircleAlert, LoaderCircle, Plus, X } from 'lucide-vue-next'
import { NSelect } from 'naive-ui'
import { useRouter } from 'vue-router'
import type { z } from 'zod'
import ShadcnFormDialog from '@/components/common/ShadcnFormDialog.vue'
import { reviewSelectTheme } from '@/components/courseReview/reviewTheme'
import { api } from '@/lib/requests'
import { useShadcnToast } from '@/lib/useShadcnToast'
import { isLoginRequiredResponse, useCreationLogin } from '@/lib/useCreationLogin'
import { APICourseListQuery, APICourseNewQuery } from '@/types/api/courseReview/course'
import type { TeacherSearchResult } from '@/types/api/search/search'
import TeacherSelector from './_component/TeacherSelector.vue'

type CourseClassification = z.infer<typeof APICourseNewQuery>['classification']
const props = defineProps<{
  modelValue: boolean
  initValue?: { name?: string; school?: number; classification?: CourseClassification; teacher?: { id: number; name: string; school: string } }
}>()
const emit = defineEmits<{ (event: 'update:modelValue', value: boolean): void; (event: 'select', courseId: number): void }>()
const CourseType = APICourseListQuery.shape.course_type.enum
const courseTypeOptions = [
  { label: '通识课', value: CourseType.general }, { label: '体育课', value: CourseType.pe }, { label: '英语课', value: CourseType.english },
  { label: '专业课', value: CourseType.professional }, { label: '政治课', value: CourseType.politics }, { label: '必修课', value: CourseType.required }, { label: '选修课', value: CourseType.optional },
]
const message = useShadcnToast()
const router = useRouter()
const { checkingLogin, requireLogin, notifyLoginRequired } = useCreationLogin()
const formId = `add-course-${useId()}`
const form = useTemplateRef<HTMLFormElement>('form')
const inputClass = 'h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 aria-[invalid=true]:border-red-300 disabled:cursor-not-allowed disabled:opacity-50'
const primaryButton = 'inline-flex h-10 items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
const secondaryButton = 'inline-flex h-10 items-center justify-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium shadow-sm transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50'
const errorMessage = ref<{ courseName?: string; courseSchool?: string; courseClassification?: string; teacherId?: string; other?: string }>({})
const loading = ref(false)
const loadingSubmit = ref(false)
const busy = computed(() => loadingSubmit.value || checkingLogin.value)
const schoolLoadError = ref('')
const showTeacherSelectorModal = ref(false)
const schools = ref<{ id: number; name: string }[]>([])
const courseName = ref(props.initValue?.name ?? '')
const courseSchool = ref<number | null>(props.initValue?.school ?? null)
const courseClassification = ref<CourseClassification | null>(props.initValue?.classification ?? null)
const selectedTeachers = ref<TeacherSearchResult[]>(props.initValue?.teacher ? [props.initValue.teacher] : [])
let active = true
let sessionVersion = 0
let schoolRequestVersion = 0
const isCurrentSession = (version: number) => active && props.modelValue && version === sessionVersion
const closeModal = () => {
  if (busy.value || showTeacherSelectorModal.value) return
  emit('update:modelValue', false)
}
const focusFirstError = async () => {
  await nextTick()
  const invalid = form.value?.querySelector<HTMLElement>('[aria-invalid="true"]')
  const target = invalid?.querySelector<HTMLElement>('[tabindex], input') ?? invalid
  target?.focus()
}
const loadSchoolId = async () => {
  const version = ++schoolRequestVersion
  loading.value = true
  schoolLoadError.value = ''
  try {
    const response = await api.get({ url: '/api/assessment/school/' })
    if (!active || !props.modelValue || version !== schoolRequestVersion) return
    if (response.status !== 200) throw new Error('加载学院失败，请稍后重试')
    schools.value = response.data.contents.schools
  } catch {
    if (!active || !props.modelValue || version !== schoolRequestVersion) return
    schoolLoadError.value = '加载学院失败，请稍后重试'
    message.error(schoolLoadError.value)
  } finally {
    if (active && version === schoolRequestVersion) loading.value = false
  }
}
watch(() => props.modelValue, show => {
  sessionVersion += 1
  if (show) { errorMessage.value = {}; loadSchoolId() }
  else { schoolRequestVersion += 1; showTeacherSelectorModal.value = false; loadingSubmit.value = false }
}, { immediate: true })
watch(courseName, () => { errorMessage.value.courseName = '' })
watch(courseSchool, () => { errorMessage.value.courseSchool = '' })
watch(courseClassification, () => { errorMessage.value.courseClassification = '' })
watch(selectedTeachers, () => { errorMessage.value.teacherId = '' })
const removeTeacher = (teacherId: number) => {
  if (busy.value || showTeacherSelectorModal.value) return
  selectedTeachers.value = selectedTeachers.value.filter(teacher => teacher.id !== teacherId)
}

const submitCourse = async () => {
  if (!props.modelValue || busy.value || loading.value || schoolLoadError.value || showTeacherSelectorModal.value) return
  const version = sessionVersion
  if (!(await requireLogin('添加课程'))) {
    if (isCurrentSession(version)) errorMessage.value.other = '请先登录后再添加课程'
    return
  }
  if (!isCurrentSession(version)) return
  errorMessage.value = {}
  if (!courseName.value.trim()) errorMessage.value.courseName = '课程名称不能为空'
  if (!courseSchool.value) errorMessage.value.courseSchool = '请选择所属学院'
  if (!courseClassification.value) errorMessage.value.courseClassification = '请选择课程分类'
  if (!selectedTeachers.value.length) errorMessage.value.teacherId = '请至少选择一位授课教师'
  if (Object.values(errorMessage.value).some(Boolean) || !courseClassification.value) { focusFirstError(); return }
  loadingSubmit.value = true
  try {
    const response = await api.post({ url: '/api/assessment/course/', query: {
      name: courseName.value.trim(), school: courseSchool.value!, classification: courseClassification.value, teacher_ids: selectedTeachers.value.map(teacher => teacher.id),
    } })
    if (!isCurrentSession(version)) return
    if (response.status === 200) {
      message.success('添加课程成功')
      emit('update:modelValue', false)
      router.push({ name: 'courseReviewItem', params: { id: response.data.contents.course_id } })
    } else if (isLoginRequiredResponse(response)) {
      errorMessage.value.other = '请先登录后再添加课程'
      notifyLoginRequired('添加课程')
    } else {
      const fields = { course: 'courseName', school: 'courseSchool', classification: 'courseClassification', teacher: 'teacherId', teacher_ids: 'teacherId' } as const
      for (const error of response.errors ?? []) {
        const key = fields[error.field]
        if (key && error.err_msg) errorMessage.value[key] = error.err_msg
      }
      errorMessage.value.other = response.errors?.map(error => error.err_msg).filter(Boolean).join('；') || '添加课程失败，请稍后重试'
      message.error(errorMessage.value.other)
      focusFirstError()
    }
  } catch {
    if (!isCurrentSession(version)) return
    errorMessage.value.other = '添加课程失败，请检查网络后重试'
    message.error(errorMessage.value.other)
  } finally {
    if (isCurrentSession(version)) loadingSubmit.value = false
  }
}
onBeforeUnmount(() => { active = false; schoolRequestVersion += 1; sessionVersion += 1 })
</script>
