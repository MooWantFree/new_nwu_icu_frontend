<template>
  <section class="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[0_1px_2px_rgb(0_0_0_/_0.025)]">
    <header class="border-b border-zinc-100 px-5 py-4 sm:px-6">
      <h2 class="text-base font-semibold text-zinc-950">同名课程</h2>
      <p class="mt-1 text-xs text-zinc-500">其他教师开设的「{{ courseData.name }}」</p>
    </header>
    <ul v-if="sortedSameNameCourses.length" class="divide-y divide-zinc-100">
      <li v-for="course in sortedSameNameCourses" :key="course.course_id">
        <router-link
          :to="{ name: 'courseReviewItem', params: { id: course.course_id } }"
          class="flex min-w-0 items-center justify-between gap-3 px-5 py-3.5 text-sm transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-400 sm:px-6"
        >
          <span class="min-w-0 break-words font-medium text-zinc-900">{{ course.teacher_name }}</span>
          <span v-if="course.rating" :title="`归一化评分：${course.rating.toFixed(1)}`" class="flex shrink-0 items-center gap-1.5 text-zinc-700">
            <Star class="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
            <span :aria-label="`归一化评分 ${course.rating.toFixed(1)}`">{{ course.rating.toFixed(1) }}</span>
          </span>
          <span v-else class="shrink-0 text-xs text-zinc-400">暂无评分</span>
        </router-link>
      </li>
    </ul>
    <p v-else class="px-5 py-5 text-sm text-zinc-500 sm:px-6">暂无同名课程</p>
  </section>

  <section class="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[0_1px_2px_rgb(0_0_0_/_0.025)]">
    <header class="border-b border-zinc-100 px-5 py-4 sm:px-6">
      <h2 class="text-base font-semibold text-zinc-950">教师的其他课程</h2>
    </header>
    <div v-if="courseData.teachers.length" class="divide-y divide-zinc-100">
      <div v-for="teacher in courseData.teachers" :key="teacher.id" class="px-5 py-4 sm:px-6">
        <h3 class="text-xs font-medium text-zinc-500">{{ teacher.name }}</h3>
        <ul v-if="teacher.course.length" class="-mx-2 mt-2 space-y-0.5">
          <li v-for="course in teacher.course" :key="course.id">
            <router-link
              :to="{ name: 'courseReviewItem', params: { id: course.id } }"
              class="flex min-w-0 items-center justify-between gap-3 rounded-md px-2 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
            >
              <span class="min-w-0 break-words">{{ course.name }}</span>
              <ChevronRight class="size-4 shrink-0 text-zinc-400" aria-hidden="true" />
            </router-link>
          </li>
        </ul>
        <p v-else class="mt-2 text-xs text-zinc-400">暂无其他课程</p>
      </div>
    </div>
    <p v-else class="px-5 py-5 text-sm text-zinc-500 sm:px-6">暂无其他课程</p>
  </section>
</template>

<script setup lang="ts">
import { ChevronRight, Star } from 'lucide-vue-next'
import { computed } from 'vue'
import type { CourseData } from '@/types/courseReview'

const { courseData } = defineProps<{
  courseData: CourseData
}>()

const sortedSameNameCourses = computed(() => {
  return [...courseData.other_dup_name_course].sort((a, b) => b.rating - a.rating)
})
</script>
