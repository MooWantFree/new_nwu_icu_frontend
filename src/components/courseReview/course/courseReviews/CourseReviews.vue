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
    <div class="flex flex-wrap items-center gap-2" role="group" aria-label="评价筛选与排序">
      <div class="grid w-full min-w-0 grid-cols-2 gap-2 sm:flex sm:w-auto">
        <div class="min-w-0 sm:w-40">
          <ShadcnSelect
            :value="semesterSelectorValue"
            :options="semesterSelectorOptions"
            aria-label="学期"
            class="min-w-0 text-zinc-700 [&>span:first-child]:min-w-0 [&>span:first-child]:flex-1 [&>span:first-child]:truncate [&>span:first-child]:text-left"
            @update:value="updateSemester"
          />
        </div>
        <div class="min-w-0 sm:w-36">
          <ShadcnSelect
            :value="rankSelectorValue"
            :options="rankSelectorOptions"
            aria-label="评分"
            class="min-w-0 text-zinc-700 [&>span:first-child]:min-w-0 [&>span:first-child]:flex-1 [&>span:first-child]:truncate [&>span:first-child]:text-left"
            @update:value="updateRating"
          />
        </div>
      </div>
      <div class="ml-auto">
        <DropdownMenuRoot>
          <DropdownMenuTrigger
            type="button"
            class="inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 data-[state=open]:bg-zinc-100 data-[state=open]:text-zinc-950"
            :aria-label="`排序: ${sortSelectorLabel}`"
          >
            <ArrowDownUp class="h-4 w-4" aria-hidden="true" />
            {{ sortSelectorLabel }}
            <ChevronDown class="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuPortal>
            <DropdownMenuContent
              align="end"
              :side-offset="4"
              :collision-padding="8"
              aria-label="评价排序方式"
              class="z-50 min-w-44 rounded-md border border-zinc-200 bg-white p-1 text-zinc-950 shadow-md outline-none"
            >
              <DropdownMenuRadioGroup :model-value="sortSelectorValue" @update:model-value="updateSort">
                <DropdownMenuRadioItem
                  v-for="option in sortSelectorOptions"
                  :key="option.value"
                  :value="option.value"
                  class="relative flex min-h-9 cursor-default select-none items-center rounded-sm py-2 pl-8 pr-3 text-sm outline-none data-[highlighted]:bg-zinc-100"
                >
                  <DropdownMenuItemIndicator class="absolute left-2">
                    <Check class="h-4 w-4" aria-hidden="true" />
                  </DropdownMenuItemIndicator>
                  {{ option.label }}
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenuRoot>
      </div>
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
import { ArrowDownUp, Check, ChevronDown } from 'lucide-vue-next'
import { DropdownMenuContent, DropdownMenuItemIndicator, DropdownMenuPortal, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuRoot, DropdownMenuTrigger } from 'reka-ui'
import ShadcnSelect from '@/components/common/ShadcnSelect.vue'
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
const sortSelectorLabel = computed(() => sortSelectorOptions.find(option => option.value === sortSelectorValue.value)?.label ?? '最多点赞')
const updateSort = (value: unknown) => {
  const option = sortSelectorOptions.find(option => option.value === value)
  if (option) sortSelectorValue.value = option.value
}

// - semester
const semesterSelectorValue = computed({
  get: () => props.reviewQuery.semester === undefined ? 'all' : String(props.reviewQuery.semester),
  set: (semester: string) => updateFilter({ semester: semester === 'all' ? undefined : Number(semester) }),
})
const semesterSelectorOptions = computed(() => [
  {
    label: '全部学期',
    value: 'all',
  },
  ...props.courseData.reviews.facets.semesters.map((it) => ({
    label: `${it.semester__name} (${it.count})`,
    value: String(it.semester_id),
  })),
])
const updateSemester = (value: string | number | null) => {
  if (typeof value === 'string') semesterSelectorValue.value = value
}

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
    label: '全部评分',
    value: Rank.All,
  },
  {
    label: `5 星 (${ratingFacetCount(5)})`,
    value: Rank.Five,
  },
  {
    label: `4 星 (${ratingFacetCount(4)})`,
    value: Rank.Four,
  },
  {
    label: `3 星 (${ratingFacetCount(3)})`,
    value: Rank.Three,
  },
  {
    label: `2 星 (${ratingFacetCount(2)})`,
    value: Rank.Two,
  },
  {
    label: `1 星 (${ratingFacetCount(1)})`,
    value: Rank.One,
  },
])
const updateRating = (value: string | number | null) => {
  if (typeof value === 'number') rankSelectorValue.value = value
}

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
