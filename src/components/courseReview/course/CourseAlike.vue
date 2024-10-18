<template>
  <div class="p-6 bg-white rounded-md shadow-md">
    <h3 class="text-lg font-bold">其他老师的「{{ courseData.name }}」课</h3>
    <ul class="mt-2 space-y-2 text-sm text-gray-600">
      <!--      TODO-->

    </ul>
  </div>
  <div class="p-6 bg-white rounded-md shadow-md">
    <div v-for="(teacher, index) in courseData.teachers" :key="index">
      <h3 class="text-lg font-bold">{{ teacher.name }}老师的其他课</h3>
      <ul class="mt-2 space-y-2 text-sm text-gray-600">
        <!--        TODO-->
      </ul>
      <hr v-if="index !== courseData.teachers.length - 1" class="h-px my-8 bg-gray-200 border-0 dark:bg-gray-700">
    </div>
  </div>
</template>

<script setup lang="ts">
import {CourseData} from '@/types/courses'

const props = defineProps<{
  courseData: CourseData
}>()
</script>