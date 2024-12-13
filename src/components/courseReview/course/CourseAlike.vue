<template>
  <div class="p-6 bg-white rounded-md shadow-md">
    <h3 class="text-lg font-bold">其他老师的「{{ courseData.name }}」课</h3>
    <ul class="mt-2 space-y-2 text-sm text-gray-600">
      <li v-for="course in sortedSameNameCourses" :key="course.course_id">
        <router-link :to="{
          name: 'courseReviewItem',
          params: { id: course.course_id }
        }" class="hover:underline text-blue-600">
          {{ course.teacher_name }}
        </router-link>
        - {{ course.rating ? course.rating.toFixed(1) : '(0) 暂无评分' }}
      </li>
    </ul>
  </div>
  <div class="p-6 bg-white rounded-md shadow-md">
    <div v-for="(teacher, index) in courseData.teachers" :key="index">
      <h3 class="text-lg font-bold">{{ teacher.name }}老师的其他课</h3>
      <ul class="mt-2 space-y-2 text-sm text-gray-600">
        <li v-for="course in teacher.course" :key="course.id">
          <router-link :to="{
            name: 'courseReviewItem',
            params: { id: course.id }
          }" class="hover:underline text-blue-600">
            「{{ course.name }}」
          </router-link>
        </li>
      </ul>
      <hr v-if="index !== courseData.teachers.length - 1" class="h-px my-8 bg-gray-200 border-0 dark:bg-gray-700">
    </div>
  </div>
</template>

<script setup lang="ts">
import {CourseData} from '@/types/courses'
import { computed } from 'vue';

const sortedSameNameCourses = computed(()=> {
  return courseData.other_dup_name_course.sort((a, b) => b.rating - a.rating)
})

const { courseData } = defineProps<{
  courseData: CourseData
}>()
</script>