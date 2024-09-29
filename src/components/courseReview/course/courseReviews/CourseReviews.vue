<template>
  <div class="p-6 mt-6 bg-white rounded-md shadow-md">
    <div class="flex flex-col space-y-4 mt-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:space-x-4">
      <div class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
        <div class="flex items-center space-x-2">
          <p class="whitespace-nowrap">排序</p>
          <n-select class="flex-grow" :options="sortSelectorOptions" v-model:value="sortSelectorValue" />
        </div>
        <div class="flex items-center space-x-2">
          <p class="whitespace-nowrap">学期</p>
          <n-select class="flex-grow" :options="semesterSelectorOptions" v-model:value="semesterSelectorValue" />
        </div>
        <div class="flex items-center space-x-2">
          <p class="whitespace-nowrap">评分</p>
          <n-select class="flex-grow" :options="rankSelectorOptions" v-model:value="rankSelectorValue" />
        </div>
        <n-button class="w-full sm:w-auto" @click="handleSemesterRankingChartButtonClicked">课程学期评分趋势</n-button>
      </div>
      <n-button class="w-full sm:w-auto mt-4 sm:mt-0" type="primary" color="#18a058"
        @click="handleNewReviewButtonClicked">
        新建一个评价
      </n-button>
    </div>
    <div class="mt-6 space-y-4">
      <div v-for="(review, index) in reviewsDisplayed" :key="index">
        <CourseReviewItem :review="review" />
      </div>
      <div v-if="reviewsDisplayed.length === 0">
        <n-empty size="huge" description="暂时没有内容呢">
          <template #extra>
            <n-button size="large" @click="handleNewReviewButtonClicked">
              新建一个评价
            </n-button>
          </template>
        </n-empty>
      </div>
    </div>
  </div>
  <ReviewEditorModal v-model="showEditor" :course-data="props.courseData" @submit="handleSubmitReview"
    :submitting="isSubmittingReview" />
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import { CourseData } from "@/types/courses"
import CourseReviewItem from "@/components/courseReview/course/courseReviews/CourseReviewItem.vue"
import ReviewEditorModal from "@/components/courseReview/course/courseReviews/ReviewEditorModal.vue"
import { api } from "@/lib/requests"
import { NewReviewRequest, NewReviewResponse } from "@/types/api/review"
import { useMessage } from 'naive-ui'

const emit = defineEmits<{
  (e: 'reloadData'): void
}>()

const props = defineProps<{
  courseData: CourseData,
  loading: boolean,
}>()
// Reviews Toolbar
// - sort
enum SortMethods {
  MostlyLiked,
  Newest,
  Oldest,
  HighestRated,
  LowestRated,
}

const message = useMessage()

const sortSelectorValue = ref<SortMethods>(SortMethods.MostlyLiked)
const sortSelectorOptions = [
  {
    label: '最多点赞',
    value: SortMethods.MostlyLiked,
  },
  {
    label: '最新点评',
    value: SortMethods.Newest,
  },
  {
    label: '最旧点评',
    value: SortMethods.Oldest,
  },
  {
    label: '评分: 高-低',
    value: SortMethods.HighestRated,
  },
  {
    label: '评分: 低-高',
    value: SortMethods.LowestRated,
  },
]

// - semester
const semesterSelectorValue = ref('all')
const semesterSelectorOptions = computed(() => [
  {
    label: `全部 (${props.courseData.reviews.length})`,
    value: 'all',
  },
  ...props.courseData.semester.map(it => ({
    label: `${it} (${props.courseData.reviews.filter(review => review.semester === it).length})`,
    value: it,
  })),
])

// - rank filter
enum Rank {
  All = 0,
  Five = 5,
  Four = 4,
  Three = 3,
  Two = 2,
  One = 1,
}

const rankSelectorValue = ref(Rank.All)
const rankSelectorOptions = computed(() => [
  {
    label: `全部 (${props.courseData.reviews.length})`,
    value: Rank.All,
  },
  {
    label: `★★★★★ (${props.courseData.reviews.filter(review => review.rating >= 4.5).length})`,
    value: Rank.Five,
  },
  {
    label: `★★★★ (${props.courseData.reviews.filter(review => review.rating >= 3.5 && review.rating < 4.5).length})`,
    value: Rank.Four,
  },
  {
    label: `★★★ (${props.courseData.reviews.filter(review => review.rating >= 2.5 && review.rating < 3.5).length})`,
    value: Rank.Three,
  },
  {
    label: `★★ (${props.courseData.reviews.filter(review => review.rating >= 1.5 && review.rating < 2.5).length})`,
    value: Rank.Two,
  },
  {
    label: `★ (${props.courseData.reviews.filter(review => review.rating < 1.5).length})`,
    value: Rank.One,
  },
])

// - calculate result
const reviewsDisplayed = computed(() => props.courseData.reviews.filter(review => (
  (semesterSelectorValue.value === 'all' || review.semester === semesterSelectorValue.value) &&
  (rankSelectorValue.value === Rank.All || (
    rankSelectorValue.value + 0.5 > review.rating &&
    rankSelectorValue.value - 0.5 <= review.rating
  ))
)
)
)

// 课程学期评分趋势
const handleSemesterRankingChartButtonClicked = () => {

}

const showEditor = ref(false)
const isSubmittingReview = ref(false)
// New review
const handleNewReviewButtonClicked = () => {
  showEditor.value = true
}

const handleSubmitReview = async (content: NewReviewRequest) => {
  isSubmittingReview.value = true
  try {
    const { status, data, content: responseContent } = await api.post<NewReviewResponse>('/api/assessment/review/', content)

    if (status !== 200) {
      throw new Error('Failed to submit review')
    }
    emit('reloadData')

    showEditor.value = false
  } catch (error) {
    console.error("Failed to submit review:", error)
    message.error('评价提交失败，请重试')
  } finally {
    isSubmittingReview.value = false
  }
}
</script>