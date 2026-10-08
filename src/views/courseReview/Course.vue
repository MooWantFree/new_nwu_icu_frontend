<template>
  <component
    v-if="errorMsg.component"
    :is="errorMsg.component"
    :detail="errorMsg.detail"
  />
  <CourseSkeleton v-else-if="!courseData" />
  <main v-else class="min-h-[calc(100vh-7rem)] bg-zinc-50 text-zinc-950">
    <div class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <nav aria-label="面包屑" class="mb-6 flex items-center gap-2 text-sm text-zinc-500">
        <RouterLink to="/review/course" class="inline-flex items-center gap-1.5 rounded-md transition-colors hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2">
          <ArrowLeft class="h-4 w-4" aria-hidden="true" />
          课程目录
        </RouterLink>
        <span aria-hidden="true">/</span>
        <span class="text-zinc-700">课程详情</span>
      </nav>
      <header class="mb-8">
        <h1 class="break-words text-3xl font-semibold tracking-tight sm:text-4xl">{{ courseData.name }}</h1>
        <div class="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span class="rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-zinc-700">{{ courseData.category }}</span>
          <span class="text-zinc-500">{{ courseData.school }}</span>
        </div>
      </header>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div class="min-w-0 lg:col-span-2">
          <CourseMeta :course-data="courseData" :loading="courseLoading" />
          <CourseReviews
            :course-data="courseData"
            :loading="courseLoading"
            :review-query="reviewQuery"
            @reloadData="loadData"
          />
        </div>
        <aside class="min-w-0 space-y-6">
          <CourseTeachers :course-data="courseData" />
          <CourseAlike :course-data="courseData" />
        </aside>
      </div>
    </div>
    <button
      @click="scrollToTop"
      type="button"
      class="fixed bottom-6 right-6 flex size-11 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-white shadow-md transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 sm:bottom-8 sm:right-8"
      aria-label="回到页面顶部"
      v-show="showTopButton"
    >
      <ArrowUp class="size-5" aria-hidden="true" />
    </button>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, watch, onUnmounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { api } from '@/lib/requests'
import { setPageTitle } from '@/lib/pageMetadata'
import { CourseData } from '@/types/courseReview'
import type { APICourseInfo } from '@/types/api/courseReview/course'
import CourseMeta from '@/components/courseReview/course/CourseMeta.vue'
import CourseReviews from '@/components/courseReview/course/courseReviews/CourseReviews.vue'
import CourseTeachers from '@/components/courseReview/course/CourseTeachers.vue'
import CourseAlike from '@/components/courseReview/course/CourseAlike.vue'
import CourseSkeleton from '@/components/courseReview/course/CourseSkeleton.vue'
import Page404 from '@/components/infoNErrors/404.vue'
import Page500 from '@/components/infoNErrors/500.vue'
import { ArrowLeft, ArrowUp } from 'lucide-vue-next'

const route = useRoute()

const errorMsg = shallowRef<{
  component: typeof Page404 | typeof Page500 | null,
  detail: string,
}>({
  component: null,
  detail: '',
})
const courseLoading = ref(true)
const courseData = ref<CourseData | null>(null)
const showTopButton = ref(false)
const reviewQuery = computed<APICourseInfo['query']>(() => {
  const positiveInteger = (value: unknown) => {
    const number = Number(value)
    return Number.isSafeInteger(number) && number > 0 ? number : undefined
  }
  const requestedSort = route.query.sort
  const sort = ['liked', 'newest', 'oldest', 'highest', 'lowest'].includes(String(requestedSort))
    ? requestedSort as NonNullable<APICourseInfo['query']['sort']> : 'liked'
  const semester = positiveInteger(route.query.semester)
  const rating = positiveInteger(route.query.rating)
  const size = positiveInteger(route.query.pageSize)
  return {
    page: positiveInteger(route.query.page) ?? 1,
    pageSize: size && size <= 50 ? size : 10,
    sort,
    ...(semester ? { semester } : {}),
    ...(rating && rating <= 5 ? { rating } : {}),
  }
})
let requestGeneration = 0

const loadData = async () => {
  const generation = ++requestGeneration
  courseLoading.value = true
  errorMsg.value = { component: null, detail: '' }
  try {
    const id = parseInt(route.params.id instanceof Object ? route.params.id[0] : route.params.id)
    const focusReviewId = Number(/^#review-(\d+)$/.exec(route.hash)?.[1]) || undefined
    const focusReplyId = Number(/^#reply-(\d+)$/.exec(route.hash)?.[1]) || undefined
    const { status, content } = await api.get({
      url: '/api/assessment/course/:id/',
      params: {
        id,
      },
      query: {
        ...reviewQuery.value,
        focus_review_id: focusReviewId,
        focus_reply_id: focusReplyId,
      },
    })

    if (generation !== requestGeneration) return
    if (status === 404) {
      errorMsg.value = {
        component: Page404,
        detail: '课程信息不存在',
      }
      return
    }

    if (status !== 200) {
      throw new Error(`HTTP error! status: ${status}`)
    }

    courseData.value = content
    setPageTitle(`课程评价 - ${courseData.value.name}`)
  } catch (error) {
    if (generation !== requestGeneration) return
    console.error('Failed to fetch course data:', error)
    if (error instanceof Error) {
      errorMsg.value = {
        component: Page500,
        detail: error.toString(),
      }
    }
  } finally {
    if (generation === requestGeneration) courseLoading.value = false
  }
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleScroll = () => {
  showTopButton.value = window.scrollY > 500
}

watch([() => route.params.id, () => route.hash, reviewQuery], async ([newId], [oldId]) => {
  if (newId) {
    if (newId !== oldId) {
      courseData.value = null
    }
    await loadData()
  }
}, { immediate: true })

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  requestGeneration += 1
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style lang="postcss" scoped></style>
