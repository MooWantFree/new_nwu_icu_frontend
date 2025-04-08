<template>
  <component
    v-if="errorMsg.component"
    :is="errorMsg.component"
    :detail="errorMsg.detail"
  />
  <CourseSkeleton v-else-if="courseLoading || !courseData" />
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
      <ArrowUp class="w-6 h-6" />
    </button>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/lib/requests'
import { CourseData } from '@/types/courseReview'
import CourseMeta from '@/components/courseReview/course/CourseMeta.vue'
import CourseReviews from '@/components/courseReview/course/courseReviews/CourseReviews.vue'
import CourseTeachers from '@/components/courseReview/course/CourseTeachers.vue'
import CourseAlike from '@/components/courseReview/course/CourseAlike.vue'
import CourseSkeleton from '@/components/courseReview/course/CourseSkeleton.vue'
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

const loadData = async () => {
  courseLoading.value = true
  try {
    const id = parseInt(route.params.id instanceof Object ? route.params.id[0] : route.params.id)
    const { status, content } = await api.get({
      url: '/api/assessment/course/:id/',
      params: {
        id,
      }
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
