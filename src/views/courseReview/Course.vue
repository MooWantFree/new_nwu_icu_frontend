<template>
  <CourseSkeleton v-if="courseLoading" />
  <main class="min-h-screen bg-gray-100" v-else>
    <div class="container mx-auto pt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div class="lg:col-span-2">
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
      class="fixed bottom-8 right-8 bg-blue-500 text-white p-2 rounded-full shadow-lg hover:bg-blue-600 transition-colors duration-300"
      v-show="showTopButton"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    </button>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/lib/requests'
import { CourseData } from '@/types/courses'
import { CourseDataResponse } from '@/types/api/course'
import CourseMeta from '@/components/courseReview/course/CourseMeta.vue'
import CourseReviews from '@/components/courseReview/course/courseReviews/CourseReviews.vue'
import CourseTeachers from '@/components/courseReview/course/CourseTeachers.vue'
import CourseAlike from '@/components/courseReview/course/CourseAlike.vue'
import CourseSkeleton from '@/components/courseReview/course/CourseSkeleton.vue'

const router = useRouter()
const route = useRoute()

const courseLoading = ref(true)
const courseData = ref<CourseData | null>(null)
const showTopButton = ref(false)

const loadData = async () => {
  courseLoading.value = true
  try {
    const url = `/api/assessment/course/${route.params.id}/`
    const { status, content } = await api.get<CourseDataResponse>(url)

    if (status === 404) {
      await router.push({ name: '404' })
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
    await router.push({ name: '500', query: { message: encodeURI(error.toString()) } })
  }
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleScroll = () => {
  showTopButton.value = window.scrollY > 500
}

watch(() => route.params.id, async (newId) => {
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
