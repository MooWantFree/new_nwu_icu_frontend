<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none"
  >
    <div class="relative w-full max-w-3xl mx-auto my-6 px-4 sm:px-0">
      <div
        class="relative flex flex-col w-full bg-white border-0 rounded-lg shadow-lg outline-none focus:outline-none"
        style="height: 92vh"
      >
        <div
          class="flex items-start justify-between p-4 sm:p-5 border-b border-solid border-gray-300 rounded-t"
        >
          <h3 class="text-xl sm:text-2xl font-semibold">
            {{ initContent?.content ? '编辑' : '新建' }}评价
          </h3>
          <button
            class="p-1 ml-auto bg-transparent border-0 text-black float-right text-3xl leading-none font-semibold outline-none focus:outline-none hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center w-8 h-8"
            @click="closeModal"
          >
            <span
              class="bg-transparent text-black block outline-none focus:outline-none"
            >
              ×
            </span>
          </button>
        </div>
        <div
          v-if="!loading"
          class="relative p-4 sm:p-6 flex-auto overflow-y-auto"
          style="height: calc(80vh - 140px)"
        >
          <Editor
            v-model="content"
            :allowEdit="true"
            :withToolbar="true"
            class="h-full"
          />
        </div>
        <div
          v-else
          class="relative p-4 sm:p-6 flex-auto overflow-y-auto"
          style="height: calc(80vh - 140px)"
        >
          <div class="flex items-center justify-center h-full">
            <div className="flex flex-col items-center">
              <div
                className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
                role="status"
              >
                <span className="sr-only">加载中...</span>
              </div>
              <p className="mt-2 text-center font-medium">加载中</p>
            </div>
          </div>
        </div>
        <div
          v-if="showRatingsSelector"
          class="flex flex-col sm:flex-row p-4 sm:p-6 border-t border-solid border-gray-300 rounded-b"
        >
          <div
            class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 sm:mb-0 sm:w-2/3"
          >
            <div class="flex flex-col">
              <span class="text-sm font-medium mb-1">课程难度：</span>
              <div class="flex items-center">
                <Rate :max="3" v-model="difficulty" />
                <span class="ml-2 text-gray-600">{{
                  ratingTooltip(difficulty)
                }}</span>
              </div>
            </div>
            <div class="flex flex-col">
              <span class="text-sm font-medium mb-1">作业多少：</span>
              <div class="flex items-center">
                <Rate :max="3" v-model="homework" />
                <span class="ml-2 text-gray-600">{{
                  ratingTooltip(homework)
                }}</span>
              </div>
            </div>
            <div class="flex flex-col">
              <span class="text-sm font-medium mb-1">给分好坏：</span>
              <div class="flex items-center">
                <Rate :max="3" v-model="grade" />
                <span class="ml-2 text-gray-600">{{
                  ratingTooltip(grade)
                }}</span>
              </div>
            </div>
            <div class="flex flex-col">
              <span class="text-sm font-medium mb-1">收获大小：</span>
              <div class="flex items-center">
                <Rate :max="3" v-model="reward" />
                <span class="ml-2 text-gray-600">{{
                  ratingTooltip(reward)
                }}</span>
              </div>
            </div>
          </div>
          <div class="sm:w-1/3 sm:ml-4">
            <span class="text-sm font-medium mb-1 block">学期：</span>
            <n-select
              v-model:value="selectedSemester"
              :options="semesterOptions"
              placeholder="选择学期"
              class="w-full"
            />
          </div>
        </div>
        <div
          class="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6 border-t border-solid border-gray-300 rounded-b"
        >
          <div class="flex items-center mb-2 sm:mb-0">
            <div class="text-sm font-medium mr-2">评分：</div>
            <div class="flex items-center" @click="showRatingsSelector = true">
              <Rate v-model="rating" />
              <span class="ml-2 text-gray-600">{{ rating }}分</span>
            </div>
          </div>
          <button
            class="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center"
            @click="showRatingsSelector = !showRatingsSelector"
          >
            <component
              :is="showRatingsSelector ? ChevronDown : ChevronUp"
              class="w-4 h-4 mr-2"
            />
            {{ showRatingsSelector ? '收起' : '展开' }}评分选项
          </button>

          <div class="flex flex-col sm:flex-row items-center">
            <button
              class="w-full sm:w-auto px-6 py-2 mb-2 sm:mb-0 sm:mr-2 text-sm font-bold text-red-500 uppercase transition-all duration-150 ease-linear outline-none background-transparent focus:outline-none"
              type="button"
              @click="closeModal"
              :disabled="submitting || loading"
            >
              关闭
            </button>
            <div class="flex items-center">
              <input
                type="checkbox"
                id="anonymous"
                v-model="isAnonymous"
                class="mr-2"
              />
              <label for="anonymous" class="mr-4">匿名发布</label>
              <div class="flex flex-col">
                <div v-if="!isFormValid" class="text-red-500 text-sm mb-2">
                  请填写内容，并选择评分及学期
                </div>
                <button
                  class="w-full sm:w-auto px-6 py-3 text-sm font-bold text-white uppercase transition-all duration-150 ease-linear rounded shadow outline-none bg-blue-500 hover:bg-blue-600 active:bg-blue-700 focus:outline-none disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center"
                  type="button"
                  @click="submitReview"
                  :disabled="submitting || loading || !isFormValid"
                >
                  <div
                    v-if="submitting"
                    class="mr-2 w-5 h-5 border-t-2 border-white rounded-full animate-spin"
                  ></div>
                  {{ submitting ? '提交中...' : '提交' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="fixed inset-0 z-40 bg-black opacity-25"></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch, computed, ref } from 'vue'
import Editor from '@/components/tiptap/editor/Editor.vue'
import { NewReviewRequest } from '@/types/api/review'
import { CourseData } from '@/types/courses'
import { SemesterListResponse } from '@/types/api/course'
import { api } from '@/lib/requests'
import Rate from '@/components/tinyComponents/Rate.vue'
import { ChevronUp, ChevronDown } from 'lucide-vue-next'
import { ratingTooltip } from '../tooltips'

const props = defineProps<{
  courseData: CourseData
  modelValue: boolean
  submitting: boolean
  initContent:
    | (Omit<NewReviewRequest, 'semester'> & {
        semester: string
      })
    | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', content: NewReviewRequest): void
}>()

const content = ref(props.initContent?.content || '')
const isAnonymous = ref(props.initContent?.anonymous || false)
const rating = ref(props.initContent?.rating || 0)
const selectedSemester = ref<number | null>()
const difficulty = ref(props.initContent?.difficulty || 0)
const homework = ref(props.initContent?.homework || 0)
const grade = ref(props.initContent?.grade || 0)
const reward = ref(props.initContent?.reward || 0)
const semesterData = ref<SemesterListResponse['success'] | null>(null)
const semesterOptions = computed(() => {
  if (!semesterData.value) return []
  return Object.entries(semesterData.value)
    .reverse()
    .map(([key, value]) => ({
      label: value,
      value: Number(key),
    }))
})
watch(
  () => semesterOptions.value,
  (options) => {
    const initSelectedSemester =
      options.find((it) => it.label === props.initContent?.semester)?.value ||
      null
    selectedSemester.value = initSelectedSemester
  }
)

const semesterListRequest = api.get<SemesterListResponse>(
  '/api/assessment/semester/'
)

const loading = ref(true)
onMounted(async () => {
  const response = await semesterListRequest
  semesterData.value = response.content
  loading.value = false
  document.body.style.overflow = 'hidden'
})

const submitReview = async () => {
  const reviewData: NewReviewRequest = {
    course: props.courseData.id,
    content: content.value,
    rating: rating.value,
    anonymous: isAnonymous.value,
    difficulty: difficulty.value,
    grade: grade.value,
    homework: homework.value,
    reward: reward.value,
    semester: selectedSemester.value!,
  }
  emit('submit', reviewData)
}

const closeModal = () => {
  if (
    content.value.trim() &&
    content.value.trim() !== '<p></p>' &&
    content.value !== props.initContent?.content
  ) {
    if (
      confirm(
        '你有未保存的内容。确定要关闭吗？\n\n！！！你的未保存内容将丢失！！！'
      )
    ) {
      emit('update:modelValue', false)
    }
  } else {
    emit('update:modelValue', false)
  }
}

const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  if (content.value.trim()) {
    event.preventDefault()
  }
}

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
  document.body.style.overflow = 'auto'
})

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      window.addEventListener('beforeunload', handleBeforeUnload)
    } else {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }
)

const showRatingsSelector = ref(false)

const isFormValid = computed(() => (
    content.value.trim() &&
    rating.value > 0 &&
    difficulty.value > 0 &&
    homework.value > 0 &&
    grade.value > 0 &&
    reward.value > 0 &&
    selectedSemester.value !== null
  )
)
</script>
