<template>
  <section class="mt-6 min-w-0" :aria-busy="loading">
    <header class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-lg font-semibold tracking-tight text-zinc-950">同学评价</h2>
        <p class="mt-1 text-sm text-zinc-500">{{ courseData.total_review_count }} 条评价</p>
      </div>
      <button
        v-if="!userReviewed"
        type="button"
        class="inline-flex min-h-10 items-center justify-center rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 sm:w-auto"
        @click="handleNewReviewButtonClicked"
      >
        写下评价
      </button>
      <button
        v-else
        type="button"
        class="inline-flex min-h-10 items-center justify-center rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 sm:w-auto"
        @click="handleEditReviewButtonClicked"
      >
        编辑评价
      </button>
    </header>
    <div class="grid grid-cols-2 gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:grid-cols-3">
      <label class="col-span-2 flex min-w-0 flex-col gap-2 text-xs font-medium text-zinc-600 sm:col-span-1">
        排序
        <select
          class="min-h-10 w-full min-w-0 rounded-md border border-zinc-200 bg-white px-3 text-sm font-normal text-zinc-700 shadow-sm transition-colors hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:ring-offset-2"
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
      <label class="flex min-w-0 flex-col gap-2 text-xs font-medium text-zinc-600">
        学期
        <select
          class="min-h-10 w-full min-w-0 rounded-md border border-zinc-200 bg-white px-3 text-sm font-normal text-zinc-700 shadow-sm transition-colors hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:ring-offset-2"
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
      <label class="flex min-w-0 flex-col gap-2 text-xs font-medium text-zinc-600">
        评分
        <select
          class="min-h-10 w-full min-w-0 rounded-md border border-zinc-200 bg-white px-3 text-sm font-normal text-zinc-700 shadow-sm transition-colors hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:ring-offset-2"
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

    <div :key="reviewResultsGeneration" class="mt-4 space-y-4">
      <div v-for="review in reviewsDisplayed" :key="review.id" class="min-w-0">
        <CourseReviewItem
          :review="review"
          @reviewDeleted="handleReviewDeleted"
          @reply-deleted="handleReplyDeleted"
          @review-edit="handleEditReviewButtonClicked"
        />
      </div>
      <div v-if="reviewsDisplayed.length === 0" class="rounded-xl border border-dashed border-zinc-200 bg-white px-4 py-12 text-center text-sm text-zinc-500">
        暂时没有符合筛选条件的评价。
      </div>
    </div>
    <div v-if="courseData.reviews.max_page > 1" class="mt-6 flex justify-center">
      <ReviewPagination
        :page="courseData.reviews.page"
        :page-count="courseData.reviews.max_page"
        @update:page="handlePageChange"
      />
    </div>
  </section>
  <ReviewEditorModal
    v-if="showEditor && userInfo"
    ref="reviewEditor"
    v-model="showEditor"
    :course-data="props.courseData"
    :user-id="userInfo.id"
    :review-id="props.courseData.request_user_review_id ?? null"
    @submit="handleSubmitReview"
    :submitting="isSubmittingReview"
    :init-content="initContent"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router'
import { useShadcnToast } from '@/lib/useShadcnToast'
import { useUser } from '@/lib/useUser'
import { api } from '@/lib/requests'
import type { CourseData, ReviewDataBase } from '@/types/courseReview'
import type { APICourseInfo } from '@/types/api/courseReview/course'
import CourseReviewItem from '@/components/courseReview/course/courseReviews/CourseReviewItem.vue'
import ReviewEditorModal from '@/components/courseReview/course/courseReviews/ReviewEditorModal.vue'
import ReviewPagination from '@/components/courseReview/ReviewPagination.vue'

const emit = defineEmits<{
  (e: 'reloadData'): void
}>()

const props = defineProps<{
  courseData: CourseData
  loading: boolean
  reviewQuery: APICourseInfo['query']
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

const message = useShadcnToast()
const { isLoggedIn, userInfo } = useUser()
const route = useRoute()
const router = useRouter()

const sortSelectorValue = computed({
  get: () => props.reviewQuery.sort ?? SortMethods.MostlyLiked,
  set: (sort: NonNullable<APICourseInfo['query']['sort']>) => updateFilter({ sort }),
})
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
const semesterSelectorValue = computed({
  get: () => props.reviewQuery.semester === undefined ? 'all' : String(props.reviewQuery.semester),
  set: (semester: string) => updateFilter({ semester: semester === 'all' ? undefined : Number(semester) }),
})
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

const rankSelectorValue = computed({
  get: () => props.reviewQuery.rating ?? Rank.All,
  set: (rating: number) => updateFilter({ rating: rating === Rank.All ? undefined : rating }),
})
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
const reviewResultsGeneration = ref(0)
// Reply cursors and notification targets belong to the server's current result snapshot.
watch(() => props.courseData.reviews, () => { reviewResultsGeneration.value += 1 })

const updateFilter = (filter: Partial<APICourseInfo['query']>) => {
  const query: LocationQueryRaw = { ...route.query, page: '1' }
  for (const [key, value] of Object.entries(filter)) {
    query[key] = value === undefined ? undefined : String(value)
  }
  void router.push({ query })
}
const handlePageChange = (page: number) => router.push({ query: { ...route.query, page: String(page) } })

const showEditor = ref(false)
const isSubmittingReview = ref(false)
const reviewEditor = ref<InstanceType<typeof ReviewEditorModal> | null>(null)
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
    if (!reviewEditor.value?.markPublished()) {
      message.warning('评价已发布，但浏览器未能清除旧草稿。再次打开时请核对内容。')
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
