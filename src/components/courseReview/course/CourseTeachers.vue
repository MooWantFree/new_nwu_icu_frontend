<template>
  <div class="p-6 bg-white rounded-md shadow-md">
    <div v-for="(teacher, index) in courseData.teachers" :key="index">
      <div class="flex">
        <router-link
          :to="`/review/teacher/${teacher.id}`"
          #="{ navigate, href }"
          custom
        >
          <n-avatar round :src="`/api/download/${teacher?.avatar}`">
            <template #fallback>
              <div
                :class="[
                  'w-full h-full flex justify-center items-center text-white text-2xl font-semibold',
                  [
                    'bg-indigo-500',
                    'bg-teal-600',
                    'bg-orange-600',
                    'bg-pink-600',
                    'bg-cyan-600',
                  ][teacher.name.charCodeAt(0) % 5],
                ]"
              >
                {{ teacher.name.charAt(0).toUpperCase() }}
              </div>
            </template>
          </n-avatar>
          <n-a :href="href" @click="navigate" class="flex">
            <h2 class="text-xl font-bold mx-3.5 my-auto">{{ teacher.name }}</h2>
          </n-a>
        </router-link>
        <span class="mt-3 -mx-3">{{ teacher.school }}</span>
        <!--        TODO: 教师主页-->
      </div>
      <hr
        v-if="index !== courseData.teachers.length - 1"
        class="h-px my-8 bg-gray-200 border-0 dark:bg-gray-700"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { RouterLink } from "vue-router";
import type { CourseData } from "@/types/courses";

const { courseData } = defineProps<{
  courseData: CourseData;
}>();
</script>
