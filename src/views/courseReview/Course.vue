<template>
  <component
    v-if="errorMsg.component"
    :is="errorMsg.component"
    :detail="errorMsg.detail"
  />
  <CourseSkeleton v-else-if="courseLoading || !courseData" />
  <AppPageLayout
    v-else
    :title="courseData.name"
    :description="'汇集同学们的真实课程体验，帮助你做出更适合自己的选课决定。'"
  >
    <template #meta>
      {{ courseData.category }} · {{ courseData.school }}
    </template>
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div class="min-w-0 lg:col-span-2">
        <CourseMeta :course-data="courseData" :loading="courseLoading" />
        <CourseReviews
          :course-data="courseData"
          :loading="courseLoading"
          @reloadData="loadData"
        />
      </div>
      <aside class="space-y-6">
        <CourseTeachers :course-data="courseData" />
        <CourseAlike :course-data="courseData" />
      </aside>
    </div>
    <button
      @click="scrollToTop"
      class="fixed bottom-6 right-6 rounded-full bg-blue-600 p-3 text-white shadow-lg transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:bottom-8 sm:right-8"
      aria-label="回到页面顶部"
      v-show="showTopButton"
    >
      <ArrowUp class="w-6 h-6" />
    </button>
  </AppPageLayout>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/lib/requests'
import { CourseData } from '@/types/courseReview'
import type { APICourseInfo } from '@/types/api/courseReview/course'
import CourseMeta from '@/components/courseReview/course/CourseMeta.vue'
import CourseReviews from '@/components/courseReview/course/courseReviews/CourseReviews.vue'
import CourseTeachers from '@/components/courseReview/course/CourseTeachers.vue'
import CourseAlike from '@/components/courseReview/course/CourseAlike.vue'
import CourseSkeleton from '@/components/courseReview/course/CourseSkeleton.vue'
import AppPageLayout from '@/components/layout/AppPageLayout.vue'
import Page404 from '@/components/infoNErrors/404.vue'
import Page500 from '@/components/infoNErrors/500.vue'
import { ArrowUp } from 'lucide-vue-next'

const route = useRoute()

const errorMsg = ref<{
  component: typeof Page404 | typeof Page500 | null,
  detail: string,
}>({
  component: null,
  detail: '',
})
const courseLoading = ref(true)
const courseData = ref<CourseData | null>(null)
const showTopButton = ref(false)
const reviewQuery = ref<APICourseInfo['query']>({ page: 1, pageSize: 10, sort: 'liked' })

const loadData = async (query?: APICourseInfo['query']) => {
  if (query) reviewQuery.value = query
  courseLoading.value = true
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
    document.title = `课程评价 - ${courseData.value.name} | NWU.ICU`
    courseLoading.value = false
  } catch (error) {
    console.error('Failed to fetch course data:', error)
    if (error instanceof Error) {
      errorMsg.value = {
        component: Page500,
        detail: error.toString(),
      }
    }
  }
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleScroll = () => {
  showTopButton.value = window.scrollY > 500
}

watch([() => route.params.id, () => route.hash], async ([newId]) => {
  if (newId) {
    await loadData()
  }
})

onMounted(async () => {
  await loadData()
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style lang="postcss" scoped></style>
