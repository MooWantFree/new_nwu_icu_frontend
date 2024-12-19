<template>
  <div class="p-6 mt-6 bg-white rounded-md shadow-md">
    <div
      class="flex flex-col space-y-4 mt-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:space-x-4"
    >
      <div
        class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4"
      >
        <div class="flex items-center space-x-2">
          <p class="whitespace-nowrap">排序</p>
          <select
            class="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            v-model="sortSelectorValue"
          >
            <option v-for="option in sortSelectorOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
        <div class="flex items-center space-x-2">
          <p class="whitespace-nowrap">学期</p>
          <select
            class="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            v-model="semesterSelectorValue"
          >
            <option v-for="option in semesterSelectorOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
        <div class="flex items-center space-x-2">
          <p class="whitespace-nowrap">评分</p>
          <select
            class="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            v-model="rankSelectorValue"
          >
            <option v-for="option in rankSelectorOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
      </div>
      <button
        v-if="!userReviewed"
        class="w-full sm:w-auto mt-4 sm:mt-0 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        @click="handleNewReviewButtonClicked"
      >
        新建一个评价
      </button>
      <button
        v-else
        class="w-full sm:w-auto mt-4 sm:mt-0 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        @click="handleEditReviewButtonClicked"
      >
        编辑我的评价
      </button>
    </div>

    <div class="mt-6 space-y-4">
      <div v-for="(review, index) in reviewsDisplayed" :key="index">
        <CourseReviewItem
          :review="review"
          @reviewDeleted="handleReviewDeleted"
          @reply-deleted="handleReplyDeleted"
          @review-edit="handleEditReviewButtonClicked"
        />
      </div>
      <div v-if="reviewsDisplayed.length === 0">
        <div class="text-center py-8">
          <p class="text-xl font-semibold mb-4">暂时没有内容呢</p>
          <button
            v-if="!userReviewed"
            class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            @click="handleNewReviewButtonClicked"
          >
            新建一个评价
          </button>
        </div>
      </div>
    </div>

    <!-- For dropdown menu -->
    <div class="mt-8"></div>
  </div>
  <ReviewEditorModal
    v-if="showEditor"
    v-model="showEditor"
    :course-data="props.courseData"
    @submit="handleSubmitReview"
    :submitting="isSubmittingReview"
    :init-content="initContent"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMessage } from 'naive-ui'
import { useUser } from '@/lib/useUser'
import { api } from '@/lib/requests'
import { CourseData } from '@/types/courses'
import { NewReviewRequest, NewReviewResponse } from '@/types/api/review'
import CourseReviewItem from '@/components/courseReview/course/courseReviews/CourseReviewItem.vue'
import ReviewEditorModal from '@/components/courseReview/course/courseReviews/ReviewEditorModal.vue'

const emit = defineEmits<{
  (e: 'reloadData'): void
}>()

const props = defineProps<{
  courseData: CourseData
  loading: boolean
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
const { userInfo, isLoading, isLoggedIn } = useUser()

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
  ...props.courseData.semester.map((it) => ({
    label: `${it} (${
      props.courseData.reviews.filter((review) => review.semester === it).length
    })`,
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
    label: `★★★★★ (${
      props.courseData.reviews.filter((review) => review.rating >= 4.5).length
    })`,
    value: Rank.Five,
  },
  {
    label: `★★★★ (${
      props.courseData.reviews.filter(
        (review) => review.rating >= 3.5 && review.rating < 4.5
      ).length
    })`,
    value: Rank.Four,
  },
  {
    label: `★★★ (${
      props.courseData.reviews.filter(
        (review) => review.rating >= 2.5 && review.rating < 3.5
      ).length
    })`,
    value: Rank.Three,
  },
  {
    label: `★★ (${
      props.courseData.reviews.filter(
        (review) => review.rating >= 1.5 && review.rating < 2.5
      ).length
    })`,
    value: Rank.Two,
  },
  {
    label: `★ (${
      props.courseData.reviews.filter((review) => review.rating < 1.5).length
    })`,
    value: Rank.One,
  },
])

// - calculate result
const reviewsDisplayed = computed(() =>
  props.courseData.reviews.filter(
    (review) =>
      (semesterSelectorValue.value === 'all' ||
        review.semester === semesterSelectorValue.value) &&
      (rankSelectorValue.value === Rank.All ||
        (rankSelectorValue.value + 0.5 > review.rating &&
          rankSelectorValue.value - 0.5 <= review.rating))
  )
)

const showEditor = ref(false)
const isSubmittingReview = ref(false)
// New review
const handleNewReviewButtonClicked = () => {
  if (!isLoggedIn.value) {
    message.error('请先登录')
    return
  }
  showEditor.value = true
}

const handleReviewDeleted = (reviewId: number) => {
  emit('reloadData')
}

const handleReplyDeleted = (reviewId: number, replyId: number) => {
  emit('reloadData')
}

const handleSubmitReview = async (content: NewReviewRequest) => {
  isSubmittingReview.value = true
  const request = initContent.value ? api.put : api.post
  try {
    const {
      status,
      data,
      content: responseContent,
    } = await request<NewReviewResponse>('/api/assessment/review/', content)

    if (status !== 200) {
      throw new Error('Failed to submit review')
    }
    emit('reloadData')

    showEditor.value = false
  } catch (error) {
    console.error('Failed to submit review:', error)
    message.error('评价提交失败，请重试')
  } finally {
    isSubmittingReview.value = false
  }
}

const userReviewed = computed(() => {
  return !!props.courseData.request_user_review_id
})

type InitContent = Omit<NewReviewRequest, 'semester'> & {
  semester: string
}

const initContent = computed<InitContent | null>(() => {
  const userReview = props.courseData.reviews.find(
    (review) => review.id === props.courseData.request_user_review_id
  )
  if (userReview) {
    return {
      course: props.courseData.id,
      content: userReview.content,
      rating: userReview.rating,
      anonymous: userReview.author.anonymous,
      difficulty: Number(userReview.difficulty),
      grade: Number(userReview.grade),
      homework: Number(userReview.homework),
      reward: Number(userReview.reward),
      semester: userReview.semester,
    }
  }
  return null
  // TODO: What if we use pagination?
})

const handleEditReviewButtonClicked = () => {
  if (!isLoggedIn.value) {
    message.error('请先登录')
    return
  }
  showEditor.value = true
}
</script>
