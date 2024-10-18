<template>
  <div class="p-6 bg-white rounded-md shadow-md">
    <div v-for="(teacher, index) in courseData.teachers" :key="index">
      <div class="flex">
        <n-avatar
            round
            size="large"
        >
          <!--        TODO:src="teacher.id"-->
          PlaceHolder
        </n-avatar>
        <router-link :to="`/review/teacher/${teacher.id}`" #="{ navigate, href }" custom >
          <n-a :href="href" @click="navigate" class="flex">
            <h2 class="text-xl font-bold mx-3.5 my-auto">{{ teacher.name }}</h2>
          </n-a>
        </router-link>
        <span class="mt-3 -mx-3">{{ teacher.school }}</span>
        <!--        TODO: 教师主页-->
      </div>
      <hr v-if="index !== courseData.teachers.length -1" class="h-px my-8 bg-gray-200 border-0 dark:bg-gray-700"/>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { CourseData } from '@/types/courses'

const props = defineProps<{
  courseData: CourseData,
}>()
</script>