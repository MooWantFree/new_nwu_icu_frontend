<template>
  <section class="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[0_1px_2px_rgb(0_0_0_/_0.025)]">
    <header class="border-b border-zinc-100 px-5 py-4 sm:px-6">
      <h2 class="text-base font-semibold text-zinc-950">授课教师</h2>
    </header>
    <ul v-if="courseData.teachers.length" class="divide-y divide-zinc-100">
      <li v-for="teacher in courseData.teachers" :key="teacher.id">
        <router-link
          :to="`/review/teacher/${teacher.id}`"
          class="flex min-w-0 items-center gap-3 px-5 py-4 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-400 sm:px-6"
        >
          <ShadcnAvatar :size="40" round :src="`/api/download/${teacher.avatar_uuid}/`" class="shrink-0">
            <template #fallback>
              <div class="flex size-full items-center justify-center bg-zinc-100 text-base font-medium text-zinc-600">
                {{ teacher.name.charAt(0).toUpperCase() }}
              </div>
            </template>
          </ShadcnAvatar>
          <div class="min-w-0 flex-1">
            <p class="break-words text-sm font-medium text-zinc-950">{{ teacher.name }}</p>
            <p class="mt-1 break-words text-xs text-zinc-500">{{ teacher.school }}</p>
          </div>
          <ChevronRight class="size-4 shrink-0 text-zinc-400" aria-hidden="true" />
        </router-link>
      </li>
    </ul>
    <p v-else class="px-5 py-5 text-sm text-zinc-500 sm:px-6">暂无教师信息</p>
  </section>
</template>

<script lang="ts" setup>
import { ChevronRight } from 'lucide-vue-next'
import ShadcnAvatar from '@/components/common/ShadcnAvatar.vue'
import { RouterLink } from 'vue-router'
import type { CourseData } from '@/types/courseReview'

const { courseData } = defineProps<{
  courseData: CourseData
}>()
</script>
