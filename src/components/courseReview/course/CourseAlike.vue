<template>
  <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <h2 class="text-lg font-bold text-slate-900">同名课程</h2>
    <p class="mt-1 text-sm text-slate-500">其他老师的「{{ courseData.name }}」课</p>
    <ul class="mt-4 space-y-2 text-sm text-slate-600">
      <li v-for="course in sortedSameNameCourses" :key="course.course_id">
        <router-link
          :to="{
            name: 'courseReviewItem',
            params: { id: course.course_id },
          }"
          class="font-medium text-blue-700 hover:underline"
        >
          {{ course.teacher_name }}
        </router-link>
        - {{ course.rating ? course.rating.toFixed(1) : '暂无评分' }}
      </li>
    </ul>
  </section>
  <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <div v-for="(teacher, index) in courseData.teachers" :key="index">
      <h2 class="text-lg font-bold text-slate-900">{{ teacher.name }}老师的其他课</h2>
      <ul class="mt-4 space-y-2 text-sm text-slate-600">
        <li v-for="course in teacher.course" :key="course.id">
          <router-link
            :to="{
              name: 'courseReviewItem',
              params: { id: course.id },
            }"
            class="font-medium text-blue-700 hover:underline"
          >
            「{{ course.name }}」
          </router-link>
        </li>
      </ul>
      <hr
        v-if="index !== courseData.teachers.length - 1"
        class="my-5 h-px border-0 bg-slate-200"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { CourseData } from '@/types/courseReview'
import { computed } from 'vue'

const sortedSameNameCourses = computed(() => {
  return [...courseData.other_dup_name_course].sort((a, b) => b.rating - a.rating)
})

const { courseData } = defineProps<{
  courseData: CourseData
}>()
</script>
