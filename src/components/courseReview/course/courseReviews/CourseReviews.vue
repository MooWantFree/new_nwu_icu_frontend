<template>
  <section class="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <header class="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
      <div>
        <h2 class="text-xl font-bold text-slate-900">同学评价</h2>
        <p class="mt-1 text-sm text-slate-500">{{ courseData.reviews.length }} 条评价</p>
      </div>
      <button
        v-if="!userReviewed"
        class="btn-primary w-full sm:w-auto"
        @click="handleNewReviewButtonClicked"
      >
        写下评价
      </button>
      <button
        v-else
        class="btn-primary w-full sm:w-auto"
        @click="handleEditReviewButtonClicked"
      >
        编辑评价
      </button>
    </header>
    <div class="px-5 py-5 sm:px-7">
      <div class="-mx-5 -mt-5 flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 sm:-mx-7 sm:flex-row sm:flex-wrap sm:items-end sm:px-7">
        <label class="flex min-w-0 flex-1 flex-col gap-1.5 text-sm font-medium text-slate-700 sm:min-w-36">
          排序
          <select
            class="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            v-model="sortSelectorValue"
          >
            <option
              v-for="option in sortSelectorOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </label>
        <label class="flex min-w-0 flex-1 flex-col gap-1.5 text-sm font-medium text-slate-700 sm:min-w-36">
          学期
          <select
            class="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            v-model="semesterSelectorValue"
          >
            <option
              v-for="option in semesterSelectorOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </label>
        <label class="flex min-w-0 flex-1 flex-col gap-1.5 text-sm font-medium text-slate-700 sm:min-w-36">
          评分
          <select
            class="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            v-model="rankSelectorValue"
          >
            <option
              v-for="option in rankSelectorOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </label>
      </div>

    <div class="mt-5 divide-y divide-slate-200">
      <div v-for="review in reviewsDisplayed" :key="review.id" class="py-6 first:pt-0 last:pb-0">
        <CourseReviewItem
          :review="review"
          @reviewDeleted="handleReviewDeleted"
          @reply-deleted="handleReplyDeleted"
          @review-edit="handleEditReviewButtonClicked"
        />
      </div>
      <div v-if="reviewsDisplayed.length === 0" class="rounded-xl border border-dashed border-slate-300 py-12 text-center text-slate-500">
        暂时没有符合筛选条件的评价。
      </div>
    </div>
    </div>
  </section>
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
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useUser } from '@/lib/useUser'
import { api } from '@/lib/requests'
import type { CourseData, ReviewDataBase } from '@/types/courseReview'
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
const { isLoggedIn } = useUser()
const route = useRoute()
const router = useRouter()

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
const reviewsDisplayed = computed(() => {
  const filtered = props.courseData.reviews.filter(
    (review) =>
      (semesterSelectorValue.value === 'all' ||
        review.semester === semesterSelectorValue.value) &&
      (rankSelectorValue.value === Rank.All ||
        (rankSelectorValue.value + 0.5 > review.rating &&
          rankSelectorValue.value - 0.5 <= review.rating))
  )
  return [...filtered].sort((a, b) => {
    switch (sortSelectorValue.value) {
      case SortMethods.Newest: return new Date(b.created_time).getTime() - new Date(a.created_time).getTime()
      case SortMethods.Oldest: return new Date(a.created_time).getTime() - new Date(b.created_time).getTime()
      case SortMethods.HighestRated: return b.rating - a.rating
      case SortMethods.LowestRated: return a.rating - b.rating
      default: return b.like.like - a.like.like
    }
  })
})

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

const handleReviewDeleted = () => {
  emit('reloadData')
}

const handleReplyDeleted = () => {
  emit('reloadData')
}

const handleSubmitReview = async (content: ReviewDataBase) => {
  isSubmittingReview.value = true
  try {
    let status: number
    let targetReviewId: number | null = props.courseData.request_user_review_id ?? null
    if (initContent.value) {
      const resp = await api.put({
        url: '/api/assessment/review/',
        query: content,
      })
      status = resp.status
    } else {
      const resp = await api.post({
        url: '/api/assessment/review/',
        query: content,
      })
      status = resp.status
      targetReviewId = resp.content.review_id
    }

    if (status !== 200) {
      throw new Error('Failed to submit review')
    }

    if (targetReviewId !== null) {
      await router.replace({
        path: route.path,
        query: route.query,
        hash: `#review-${targetReviewId}`,
      })
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

type InitContent = ReviewDataBase | null

const initContent = computed<InitContent>(() => {
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
      semester: parseInt(userReview.semester),
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
