<template>
  <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <h2 class="text-lg font-bold text-slate-900">授课教师</h2>
    <div class="mt-4">
    <div v-for="(teacher, index) in courseData.teachers" :key="index" class="py-1">
      <div class="flex items-center">
        <router-link
          :to="`/review/teacher/${teacher.id}`"
          #="{ navigate, href }"
          custom
        >
          <n-avatar round :src="`/api/download/${teacher.avatar_uuid}`">
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
          <n-a :href="href" @click="navigate" class="flex min-w-0">
            <span class="mx-3 text-base font-semibold text-blue-700">{{ teacher.name }}</span>
          </n-a>
        </router-link>
        <span class="ml-auto text-sm text-slate-500">{{ teacher.school }}</span>
        <!--        TODO: 教师主页-->
      </div>
      <hr
        v-if="index !== courseData.teachers.length - 1"
        class="my-5 h-px border-0 bg-slate-200"
      />
    </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { RouterLink } from 'vue-router'
import type { CourseData } from '@/types/courseReview'

const { courseData } = defineProps<{
  courseData: CourseData
}>()
</script>
