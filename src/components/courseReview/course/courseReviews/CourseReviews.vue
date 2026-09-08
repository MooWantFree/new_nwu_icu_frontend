<template>
  <section class="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <header class="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
      <div>
        <h2 class="text-xl font-bold text-slate-900">同学评价</h2>
        <p class="mt-1 text-sm text-slate-500">{{ courseData.total_review_count }} 条评价</p>
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
    <div v-if="courseData.reviews.max_page > 1" class="mt-6 flex justify-center">
      <n-pagination
        :page="courseData.reviews.page"
        :page-count="courseData.reviews.max_page"
        @update:page="handlePageChange"
      />
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
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useUser } from '@/lib/useUser'
import { api } from '@/lib/requests'
import type { CourseData, ReviewDataBase } from '@/types/courseReview'
import type { APICourseInfo } from '@/types/api/courseReview/course'
import CourseReviewItem from '@/components/courseReview/course/courseReviews/CourseReviewItem.vue'
import ReviewEditorModal from '@/components/courseReview/course/courseReviews/ReviewEditorModal.vue'

const emit = defineEmits<{
  (e: 'reloadData', query?: APICourseInfo['query']): void
}>()

const props = defineProps<{
  courseData: CourseData
  loading: boolean
}>()
// Reviews Toolbar
// - sort
enum SortMethods {
  MostlyLiked = 'liked',
  Newest = 'newest',
  Oldest = 'oldest',
  HighestRated = 'highest',
  LowestRated = 'lowest',
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
    label: `全部 (${props.courseData.total_review_count})`,
    value: 'all',
  },
  ...props.courseData.reviews.facets.semesters.map((it) => ({
    label: `${it.semester__name} (${it.count})`,
    value: String(it.semester_id),
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
    label: `全部 (${props.courseData.total_review_count})`,
    value: Rank.All,
  },
  {
    label: `★★★★★ (${ratingFacetCount(5)})`,
    value: Rank.Five,
  },
  {
    label: `★★★★ (${ratingFacetCount(4)})`,
    value: Rank.Four,
  },
  {
    label: `★★★ (${ratingFacetCount(3)})`,
    value: Rank.Three,
  },
  {
    label: `★★ (${ratingFacetCount(2)})`,
    value: Rank.Two,
  },
  {
    label: `★ (${ratingFacetCount(1)})`,
    value: Rank.One,
  },
])

// - calculate result
const ratingFacetCount = (rating: number) =>
  props.courseData.reviews.facets.ratings.find((item) => item.rating === rating)?.count ?? 0
const reviewsDisplayed = computed(() => props.courseData.reviews.results)

const currentQuery = (page = 1): APICourseInfo['query'] => ({
  page,
  pageSize: 10,
  sort: sortSelectorValue.value,
  ...(semesterSelectorValue.value === 'all' ? {} : { semester: Number(semesterSelectorValue.value) }),
  ...(rankSelectorValue.value === Rank.All ? {} : { rating: rankSelectorValue.value }),
})
watch([sortSelectorValue, semesterSelectorValue, rankSelectorValue], () => {
  emit('reloadData', currentQuery())
})
const handlePageChange = (page: number) => emit('reloadData', currentQuery(page))

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

    if (status !== 200 && status !== 201) {
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
  const userReview = props.courseData.request_user_review
  if (userReview) {
    return {
      course: props.courseData.id,
      content: userReview.content,
      rating: userReview.rating,
      anonymous: userReview.anonymous,
      difficulty: Number(userReview.difficulty),
      grade: Number(userReview.grade),
      homework: Number(userReview.homework),
      reward: Number(userReview.reward),
      semester: userReview.semester,
    }
  }
  return null
})

const handleEditReviewButtonClicked = () => {
  if (!isLoggedIn.value) {
    message.error('请先登录')
    return
  }
  showEditor.value = true
}
</script>
