<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none bg-gray-900 bg-opacity-50 backdrop-blur-sm"
  >
    <div class="relative w-full max-w-4xl mx-auto my-4 px-4 sm:px-0">
      <div
        class="relative flex flex-col w-full bg-white border-0 rounded-xl shadow-2xl outline-none focus:outline-none transition-all duration-300 ease-in-out"
        style="max-height: 92vh; height: auto"
      >
        <div
          class="flex items-center justify-between p-4 sm:p-5 border-b border-gray-200 rounded-t"
        >
          <h3 class="text-xl sm:text-2xl font-bold text-gray-800">
            {{ initContent?.content ? '编辑' : '新建' }}评价
          </h3>
          <button
            class="p-2 ml-auto text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors duration-200 flex items-center justify-center"
            @click="closeModal"
          >
            <span class="text-2xl">&times;</span>
          </button>
        </div>
        
        <div
          v-if="!loading"
          class="relative p-4 sm:p-6 flex-auto overflow-y-auto bg-gray-50"
          style="height: calc(80vh - 140px); max-height: 60vh"
        >
          <Editor
            v-model="content"
            :allowEdit="true"
            :withToolbar="true"
            class="min-h-full bg-white rounded-lg shadow-sm"
          />
        </div>
        
        <div
          v-else
          class="relative p-4 sm:p-6 flex-auto overflow-y-auto bg-gray-50 flex items-center justify-center"
          style="height: calc(80vh - 140px); max-height: 60vh"
        >
          <div class="flex flex-col items-center">
            <div
              class="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
              role="status"
            >
              <span class="sr-only">加载中...</span>
            </div>
            <p class="mt-3 sm:mt-4 text-center font-medium text-gray-600">加载中...</p>
          </div>
        </div>
        
        <div
          v-if="showRatingsSelector"
          class="p-4 sm:p-6 border-t border-gray-200 bg-white rounded-b-lg transition-all duration-300"
        >
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div class="md:col-span-2">
              <h4 class="text-base sm:text-lg font-medium text-gray-700 mb-3 sm:mb-4">评分项</h4>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-medium text-gray-700">课程难度：</span>
                    <div class="flex items-center">
                      <Rate :max="3" v-model="difficulty" class="mx-2" />
                      <span class="text-gray-600 text-xs">{{ ratingTooltip(difficulty) }}</span>
                    </div>
                  </div>
                </div>
                <div class="bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-medium text-gray-700">作业多少：</span>
                    <div class="flex items-center">
                      <Rate :max="3" v-model="homework" class="mx-2" />
                      <span class="text-gray-600 text-xs">{{ ratingTooltip(homework) }}</span>
                    </div>
                  </div>
                </div>
                <div class="bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-medium text-gray-700">给分好坏：</span>
                    <div class="flex items-center">
                      <Rate :max="3" v-model="grade" class="mx-2" />
                      <span class="text-gray-600 text-xs">{{ ratingTooltip(grade) }}</span>
                    </div>
                  </div>
                </div>
                <div class="bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-medium text-gray-700">收获大小：</span>
                    <div class="flex items-center">
                      <Rate :max="3" v-model="reward" class="mx-2" />
                      <span class="text-gray-600 text-xs">{{ ratingTooltip(reward) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h4 class="text-base sm:text-lg font-medium text-gray-700 mb-3 sm:mb-4">学期信息</h4>
              <div class="bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-700">学期：</span>
                  <div class="w-3/4">
                    <n-select
                      v-model:value="selectedSemester"
                      :options="semesterOptions"
                      placeholder="选择学期"
                      class="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="p-4 sm:p-6 border-t border-gray-200 bg-white">
          <div class="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-center">
              <div class="text-sm font-medium mr-3 text-gray-700">总体评分：</div>
              <div class="flex items-center">
                <Rate v-model="rating" />
                <span class="ml-2 text-gray-600">{{ rating }}分</span>
              </div>
            </div>
            
            <button
              class="w-full sm:w-auto px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center"
              @click="showRatingsSelector = !showRatingsSelector"
            >
              <component
                :is="showRatingsSelector ? ChevronDown : ChevronUp"
                class="w-4 h-4 mr-2"
              />
              {{ showRatingsSelector ? '收起' : '展开' }}评分选项
            </button>

            <div class="flex flex-col sm:flex-row sm:items-center">
              <div class="flex items-center mb-3 sm:mb-0 sm:mr-4">
                <input
                  type="checkbox"
                  id="anonymous"
                  v-model="isAnonymous"
                  class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label for="anonymous" class="ml-2 text-sm font-medium text-gray-700">匿名发布</label>
              </div>
              
              <div class="flex flex-col w-full sm:w-auto min-w-64">
                <div v-if="!isFormValid" class="text-red-500 text-xs sm:text-sm mb-2">
                  请填写内容，并选择评分及学期
                </div>
                <div class="flex w-full space-x-3">
                  <button
                    class="w-1/3 px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                    type="button"
                    @click="closeModal"
                    :disabled="submitting || loading"
                  >
                    取消
                  </button>
                  <button
                    class="w-2/3 px-3 sm:px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
                    type="button"
                    @click="submitReview"
                    :disabled="submitting || loading || !isFormValid"
                  >
                    <LoaderCircle
                      v-if="submitting"
                      class="mr-2 w-4 h-4 text-white animate-spin"
                    />
                    {{ submitting ? '提交中...' : '提交' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch, computed, ref } from 'vue'
import { api } from '@/lib/requests'
import { ratingTooltip } from '../tooltips'
import type { CourseData, ReviewDataBase } from '@/types/courseReview'
import Editor from '@/components/tiptap/editor/Editor.vue'
import Rate from '@/components/tinyComponents/Rate.vue'
import { LoaderCircle, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { APISemesterList } from '@/types/api/courseReview/course'

const props = defineProps<{
  courseData: CourseData
  modelValue: boolean
  submitting: boolean
  initContent:
    | ReviewDataBase
    | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', content: ReviewDataBase): void
}>()

const content = ref(props.initContent?.content || '')
const isAnonymous = ref(props.initContent?.anonymous || false)
const rating = ref(props.initContent?.rating || 0)
const selectedSemester = ref<number | null>()
const difficulty = ref(props.initContent?.difficulty || 0)
const homework = ref(props.initContent?.homework || 0)
const grade = ref(props.initContent?.grade || 0)
const reward = ref(props.initContent?.reward || 0)
const semesterData = ref<APISemesterList['response'] | null>(null)
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
      options.find((it) => parseInt(it.label) === props.initContent?.semester)?.value ||
      null
    selectedSemester.value = initSelectedSemester
  }
)

const semesterListRequest = api.get({ url: '/api/assessment/semester/' })

const loading = ref(true)
onMounted(async () => {
  const response = await semesterListRequest
  semesterData.value = response.content
  loading.value = false
  document.body.style.overflow = 'hidden'
})

const submitReview = async () => {
  const reviewData: ReviewDataBase= {
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

// TODO: validate the form using zod
const isFormValid = computed(
  () =>
    content.value.trim() &&
    rating.value > 0 &&
    difficulty.value > 0 &&
    homework.value > 0 &&
    grade.value > 0 &&
    reward.value > 0 &&
    selectedSemester.value !== null
)
</script>
