<template>
  <CourseSkeleton v-if="courseLoading" />
  <main class="min-h-screen bg-gray-100" v-else>
    <div class="container mx-auto pt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div class="lg:col-span-2">
        <CourseMeta :course-data="courseData" :loading="courseLoading"/>
        <CourseReviews :course-data="courseData" :loading="courseLoading"/>
      </div>
      <aside class="space-y-6">
        <CourseTeachers :course-data="courseData"/>
        <CourseAlike :course-data="courseData"/>
      </aside>
    </div>
  </main>
</template>

<script setup lang="ts">
import {useRoute, useRouter} from "vue-router";
import {onMounted, ref} from "vue";
import {CourseData} from "@/types/courses";
import CourseMeta from "@/components/courseReview/course/CourseMeta.vue";
import CourseReviews from "@/components/courseReview/course/courseReviews/CourseReviews.vue";
import CourseTeachers from "@/components/courseReview/course/CourseTeachers.vue";
import CourseAlike from "@/components/courseReview/course/CourseAlike.vue";
import CourseSkeleton from "@/components/courseReview/course/CourseSkeleton.vue";

const router = useRouter()
const route = useRoute()

// Loading status
const courseLoading = ref(true)

// Fetch init data
const courseData = ref<CourseData | null>()
onMounted(async () => {
  const url = `/api/review/course/${route.params.id}`
  const resp = await fetch(url)
  if (!resp.ok) {
    // TODO
  }
  courseData.value = (await resp.json()).message
  document.title = "课程评价 - " + courseData.value.name + " | NWU.ICU"
  courseLoading.value = false
})

</script>

<style lang="postcss" scoped>
</style>