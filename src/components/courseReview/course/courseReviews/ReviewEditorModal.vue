<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/45 p-3 backdrop-blur-sm sm:p-4"
  >
    <div class="my-auto w-full max-w-4xl">
      <div
        class="flex max-h-[calc(100dvh-1.5rem)] min-h-0 flex-col overflow-hidden rounded-xl bg-white shadow-2xl sm:max-h-[92vh]"
      >
        <header class="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-6 sm:py-5">
          <div class="min-w-0">
            <h3 class="text-lg font-bold text-slate-900 sm:text-xl">
              {{ initContent?.content ? '编辑评价' : '写下评价' }}
            </h3>
            <div class="mt-2 flex items-center gap-2 text-xs font-medium sm:text-sm">
              <span :class="step === 1 ? 'text-blue-700' : 'text-slate-500'" class="flex items-center gap-1.5">
                <span :class="step === 1 ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white text-slate-500'" class="flex h-5 w-5 items-center justify-center rounded-full border text-[11px]">1</span>
                写评价
              </span>
              <span class="h-px w-5 bg-slate-300 sm:w-8" />
              <span :class="step === 2 ? 'text-blue-700' : 'text-slate-400'" class="flex items-center gap-1.5">
                <span :class="step === 2 ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white text-slate-400'" class="flex h-5 w-5 items-center justify-center rounded-full border text-[11px]">2</span>
                补充信息
              </span>
            </div>
          </div>
          <button
            type="button"
            class="ml-4 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="关闭评价编辑器"
            @click="closeModal"
          >
            <X class="h-5 w-5" />
          </button>
        </header>

        <div v-if="loading" class="flex min-h-72 flex-1 items-center justify-center bg-slate-50 p-6">
          <div class="flex flex-col items-center">
            <LoaderCircle class="h-10 w-10 animate-spin text-blue-600" />
            <p class="mt-3 text-sm font-medium text-slate-600">加载中...</p>
          </div>
        </div>

        <main v-else class="min-h-0 flex-1 overflow-y-auto bg-slate-50">
          <section v-if="step === 1" class="p-4 sm:p-6">
            <p class="mb-4 text-sm leading-6 text-slate-500">
              先写下你的真实学习体验；评分与发布信息将在下一步补充。
            </p>
            <Editor
              v-model="content"
              :allowEdit="true"
              :withToolbar="true"
              class="min-h-[22rem] rounded-lg bg-white shadow-sm sm:min-h-[28rem]"
            />
          </section>

          <section v-else class="p-4 sm:p-6">
            <div class="rounded-lg border border-blue-100 bg-blue-50/70 px-4 py-3">
              <div class="flex items-center justify-between gap-3">
                <h4 class="text-sm font-semibold text-slate-800">你的评价内容</h4>
                <button
                  type="button"
                  class="shrink-0 text-sm font-medium text-blue-700 hover:text-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  @click="step = 1"
                >
                  返回修改
                </button>
              </div>
              <p class="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{{ contentPreview }}</p>
            </div>

            <div class="mt-5 flex items-center gap-2">
              <h4 class="text-base font-semibold text-slate-900">补充课程信息</h4>
              <span class="text-sm text-slate-500">不确定时，保留中间值即可</span>
            </div>

            <div class="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div class="border-b border-slate-200 px-4 py-4 sm:px-5">
                <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p class="font-medium text-slate-800">总体评分</p>
                    <p class="mt-1 text-xs text-slate-500">你会愿意把这门课推荐给同学吗？</p>
                  </div>
                  <ReviewMetricScale
                    v-model="rating"
                    label="总体评分"
                    :levels="['很不推荐', '不太推荐', '一般', '推荐', '强烈推荐']"
                  />
                </div>
              </div>

              <div class="divide-y divide-slate-100 px-4 sm:px-5">
                <div v-for="metric in metrics" :key="metric.key" class="py-3.5">
                  <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p class="text-sm font-medium text-slate-700">{{ metric.label }}</p>
                    <ReviewMetricScale v-model="metric.value.value" :label="metric.label" :levels="metric.levels" />
                  </div>
                </div>
              </div>

              <div class="grid gap-4 border-t border-slate-200 p-4 sm:grid-cols-2 sm:p-5">
                <label class="block text-sm font-medium text-slate-700">
                  授课学期
                  <n-select
                    v-model:value="selectedSemester"
                    :options="semesterOptions"
                    placeholder="选择学期"
                    class="mt-2"
                  />
                </label>
                <label class="flex cursor-pointer items-start gap-3 rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-700">
                  <input
                    id="anonymous"
                    v-model="isAnonymous"
                    type="checkbox"
                    class="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>
                    <span class="block font-medium">匿名发布</span>
                    <span class="mt-1 block text-xs leading-5 text-slate-500">开启后，不会在评价中展示你的名字和个人主页。</span>
                  </span>
                </label>
              </div>
            </div>
          </section>
        </main>

        <footer class="shrink-0 border-t border-slate-200 bg-white p-4 sm:px-6 sm:py-4">
          <div class="flex items-center justify-between gap-3">
            <button
              class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              :disabled="submitting || loading"
              @click="step === 1 ? closeModal() : (step = 1)"
            >
              {{ step === 1 ? '取消' : '上一步' }}
            </button>
            <div class="flex min-w-0 items-center gap-3">
              <p
                v-if="(step === 1 && !isContentValid) || (step === 2 && !isFormValid)"
                class="whitespace-nowrap text-right text-xs text-red-600"
                aria-live="polite"
              >
                {{ step === 1 ? '请先填写评价内容' : '请确认学期信息后再发布' }}
              </p>
              <button
                class="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-300 sm:px-5"
                type="button"
                :disabled="submitting || loading || (step === 1 ? !isContentValid : !isFormValid)"
                @click="step === 1 ? (step = 2) : submitReview()"
              >
                <LoaderCircle v-if="submitting" class="mr-2 h-4 w-4 animate-spin" />
                {{ step === 1 ? '继续' : submitting ? '发布中...' : '发布评价' }}
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { LoaderCircle, X } from 'lucide-vue-next'
import { api } from '@/lib/requests'
import type { CourseData, ReviewDataBase } from '@/types/courseReview'
import { APISemesterList } from '@/types/api/courseReview/course'
import Editor from '@/components/tiptap/editor/Editor.vue'
import ReviewMetricScale from './ReviewMetricScale.vue'

const props = defineProps<{
  courseData: CourseData
  modelValue: boolean
  submitting: boolean
  initContent: ReviewDataBase | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', content: ReviewDataBase): void
}>()

const step = ref<1 | 2>(1)
const content = ref(props.initContent?.content || '')
const isAnonymous = ref(props.initContent?.anonymous ?? false)
const rating = ref(props.initContent?.rating || 3)
const selectedSemester = ref<number | null>(null)
const difficulty = ref(props.initContent?.difficulty || 3)
const homework = ref(props.initContent?.homework || 3)
const grade = ref(props.initContent?.grade || 3)
const reward = ref(props.initContent?.reward || 3)
const semesterData = ref<APISemesterList['response'] | null>(null)

const metrics = [
  { key: 'difficulty', label: '课程难度', value: difficulty, levels: ['很简单', '较简单', '适中', '较难', '很难'] },
  { key: 'homework', label: '作业负担', value: homework, levels: ['很少', '较少', '适中', '较多', '很多'] },
  { key: 'grade', label: '给分情况', value: grade, levels: ['很严', '偏严', '一般', '偏宽', '很宽'] },
  { key: 'reward', label: '学习收获', value: reward, levels: ['很少', '较少', '一般', '较多', '很多'] },
] as const

const semesterOptions = computed(() => {
  if (!semesterData.value) return []
  return Object.entries(semesterData.value)
    .reverse()
    .map(([key, value]) => ({ label: value, value: Number(key) }))
})

watch(semesterOptions, (options) => {
  if (props.initContent?.semester) {
    selectedSemester.value = options.find((option) => parseInt(option.label) === props.initContent?.semester)?.value ?? null
  } else {
    selectedSemester.value = options[0]?.value ?? null
  }
})

const isContentValid = computed(() => {
  const plainText = content.value.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
  return plainText.length > 0
})
const contentPreview = computed(() => content.value.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim())
const isFormValid = computed(() => isContentValid.value && rating.value > 0 && difficulty.value > 0 && homework.value > 0 && grade.value > 0 && reward.value > 0 && selectedSemester.value !== null)

const semesterListRequest = api.get({ url: '/api/assessment/semester/' })
const loading = ref(true)

onMounted(async () => {
  const response = await semesterListRequest
  semesterData.value = response.content
  loading.value = false
  document.body.style.overflow = 'hidden'
})

const submitReview = () => {
  emit('submit', {
    course: props.courseData.id,
    content: content.value,
    rating: rating.value,
    anonymous: isAnonymous.value,
    difficulty: difficulty.value,
    grade: grade.value,
    homework: homework.value,
    reward: reward.value,
    semester: selectedSemester.value!,
  })
}

const closeModal = () => {
  if (isContentValid.value && content.value !== props.initContent?.content) {
    if (confirm('你有未保存的内容。确定要关闭吗？\n\n未保存的内容将丢失。')) emit('update:modelValue', false)
  } else {
    emit('update:modelValue', false)
  }
}

const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  if (isContentValid.value) event.preventDefault()
}

onMounted(() => window.addEventListener('beforeunload', handleBeforeUnload))
onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
  document.body.style.overflow = 'auto'
})

watch(() => props.modelValue, (visible) => {
  if (visible) window.addEventListener('beforeunload', handleBeforeUnload)
  else window.removeEventListener('beforeunload', handleBeforeUnload)
})
</script>
