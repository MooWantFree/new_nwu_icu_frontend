<template>
  <ShadcnFormDialog :show="modelValue" title="添加教师" :busy="loadingSubmit || checkingLogin" @close="closeModal">
    <form :id="formId" class="space-y-5" :aria-busy="loadingSubmit || checkingLogin" @submit.prevent="submitTeacher">
      <div v-if="errorMessage.other" role="alert" class="rounded-md border border-red-200 bg-red-50/50 px-3 py-2.5 text-sm text-red-700">
        {{ errorMessage.other }}
      </div>

      <div class="space-y-2">
        <label :for="nameId" class="block text-sm font-medium text-zinc-950">教师姓名</label>
        <input
          :id="nameId"
          v-model="teacherName"
          type="text"
          autocomplete="off"
          class="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
          :class="{ 'border-red-300 focus:border-red-400 focus:ring-red-100': errorMessage.teacherName }"
          placeholder="请输入教师姓名"
          :disabled="loadingSubmit || checkingLogin"
          :aria-invalid="!!errorMessage.teacherName"
          :aria-describedby="errorMessage.teacherName ? nameErrorId : undefined"
        />
        <p v-if="errorMessage.teacherName" :id="nameErrorId" role="alert" class="text-sm text-red-600">
          {{ errorMessage.teacherName }}
        </p>
      </div>

      <div class="space-y-2">
        <label :id="schoolLabelId" class="block text-sm font-medium text-zinc-950">所属学院</label>
        <div v-if="loading" role="status" class="flex h-10 items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-500">
          <LoaderCircle class="size-4 animate-spin" aria-hidden="true" />
          加载学院中…
        </div>
        <div v-else-if="schoolLoadError" role="alert" class="rounded-md border border-red-200 bg-red-50/50 p-3 text-sm text-red-700">
          <p>{{ schoolLoadError }}</p>
          <button type="button" class="mt-2 rounded-sm font-medium underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-red-200" @click="loadSchoolId">
            重新加载
          </button>
        </div>
        <ShadcnSelect
          v-else
          v-model:value="teacherSchool"
          :options="schools"
          label-field="name"
          value-field="id"
          placeholder="请选择学院"
          filterable
          :status="errorMessage.teacherSchool ? 'error' : undefined"
          :aria-labelledby="schoolLabelId"
          aria-label="所属学院"
          :aria-invalid="!!errorMessage.teacherSchool"
          :aria-describedby="errorMessage.teacherSchool ? schoolErrorId : undefined"
          :disabled="loadingSubmit || checkingLogin"
        />
        <p v-if="errorMessage.teacherSchool" :id="schoolErrorId" role="alert" class="text-sm text-red-600">
          {{ errorMessage.teacherSchool }}
        </p>
      </div>
    </form>

    <template #footer>
      <button
        type="button"
        class="inline-flex h-10 items-center justify-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        :disabled="loadingSubmit || checkingLogin"
        @click="closeModal"
      >
        取消
      </button>
      <button
        type="submit"
        :form="formId"
        class="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        :disabled="loading || !!schoolLoadError || loadingSubmit || checkingLogin"
      >
        <LoaderCircle v-if="loadingSubmit || checkingLogin" class="size-4 animate-spin" aria-hidden="true" />
        {{ loadingSubmit ? '添加中…' : checkingLogin ? '验证登录中…' : '添加教师' }}
      </button>
    </template>
  </ShadcnFormDialog>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, useId, watch } from 'vue'
import { LoaderCircle } from 'lucide-vue-next'
import ShadcnFormDialog from '@/components/common/ShadcnFormDialog.vue'
import ShadcnSelect from '@/components/common/ShadcnSelect.vue'
import { api } from '@/lib/requests'
import { isLoginRequiredResponse, useCreationLogin } from '@/lib/useCreationLogin'
import { useShadcnToast } from '@/lib/useShadcnToast'

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

const message = useShadcnToast()
const { checkingLogin, requireLogin, notifyLoginRequired } = useCreationLogin()
const dialogId = useId()
const formId = `${dialogId}-teacher-form`
const nameId = `${dialogId}-teacher-name`
const nameErrorId = `${dialogId}-teacher-name-error`
const schoolLabelId = `${dialogId}-teacher-school-label`
const schoolErrorId = `${dialogId}-teacher-school-error`
const errorMessage = ref<{ teacherName?: string; teacherSchool?: string; other?: string }>({})
const loading = ref(false)
const loadingSubmit = ref(false)
const schoolLoadError = ref('')
const schools = ref<{ id: number; name: string }[]>([])
const teacherName = ref(props.initValue?.name || '')
const teacherSchool = ref<number | null>(props.initValue?.school ?? null)
let mounted = true
let session = 0
let schoolRequest = 0

const isActive = (owner: number) => mounted && props.modelValue && owner === session
const closeModal = () => {
  if (loadingSubmit.value || checkingLogin.value) return
  emit('update:modelValue', false)
}

const loadSchoolId = async () => {
  const owner = session
  const request = ++schoolRequest
  loading.value = true
  schoolLoadError.value = ''
  try {
    const resp = await api.get({ url: '/api/assessment/school/' })
    if (!isActive(owner) || request !== schoolRequest) return
    if (resp.status !== 200 || !Array.isArray(resp.data.contents.schools)) throw new Error('Unable to load schools')
    schools.value = resp.data.contents.schools
    if (!schools.value.length) schoolLoadError.value = '暂无可选学院，请稍后重试'
  } catch {
    if (!isActive(owner) || request !== schoolRequest) return
    schoolLoadError.value = '加载学院失败，请稍后重试'
    message.error('加载学院失败，请稍后重试')
  } finally {
    if (mounted && request === schoolRequest) loading.value = false
  }
}

watch(() => props.modelValue, show => {
  session++
  if (!show) loadingSubmit.value = false
  else errorMessage.value.other = ''
  if (show && !schools.value.length) void loadSchoolId()
}, { immediate: true, flush: 'sync' })
watch(teacherName, () => { errorMessage.value.teacherName = '' })
watch(teacherSchool, () => { errorMessage.value.teacherSchool = '' })
onBeforeUnmount(() => { mounted = false; schoolRequest++; session++ })

const submitTeacher = async () => {
  if (!props.modelValue || loading.value || schoolLoadError.value || loadingSubmit.value || checkingLogin.value) return
  const owner = session
  if (!(await requireLogin('添加教师'))) {
    if (isActive(owner)) errorMessage.value.other = '请先登录后再添加教师'
    return
  }
  if (!isActive(owner)) return
  errorMessage.value = {}
  if (!teacherName.value.trim()) errorMessage.value.teacherName = '教师姓名不能为空'
  if (!teacherSchool.value) errorMessage.value.teacherSchool = '请选择所属学院'
  if (errorMessage.value.teacherName || errorMessage.value.teacherSchool) return

  const schoolObj = schools.value.find(school => school.id === teacherSchool.value)
  if (!schoolObj) {
    errorMessage.value.teacherSchool = '无效的学院选择，请重新选择'
    return
  }
  const submittedName = teacherName.value.trim()
  loadingSubmit.value = true
  try {
    const resp = await api.post({
      url: '/api/assessment/teacher/',
      query: { name: submittedName, school: schoolObj.id },
    })
    if (!isActive(owner)) return
    if (resp.status === 200 && typeof resp.data.contents.teacher_id === 'number') {
      message.success('添加教师成功')
      emit('add', { id: resp.data.contents.teacher_id, name: submittedName, school: schoolObj.name })
      emit('update:modelValue', false)
    } else if (isLoginRequiredResponse(resp)) {
      errorMessage.value.other = '请先登录后再添加教师'
      notifyLoginRequired('添加教师')
    } else {
      const detail = Array.isArray(resp.errors) ? resp.errors.find(error => typeof error.err_msg === 'string')?.err_msg : undefined
      errorMessage.value.other = resp.status === 429 ? '操作过于频繁，请稍后再试' : detail || '添加教师失败，请稍后重试'
      message.error(errorMessage.value.other)
    }
  } catch {
    if (!isActive(owner)) return
    errorMessage.value.other = '添加教师失败，请稍后重试'
    message.error(errorMessage.value.other)
  } finally {
    if (isActive(owner)) loadingSubmit.value = false
  }
}
</script>
