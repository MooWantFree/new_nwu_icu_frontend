<template>
  <article class="flex gap-3 px-4 py-4 transition-colors hover:bg-zinc-50">
    <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500" aria-hidden="true">
      <BookOpen class="h-4 w-4" />
    </div>

    <div class="min-w-0 flex-1">
      <div class="flex items-start justify-between gap-3">
        <RouterLink
          :to="{ name: 'courseReviewItem', params: { id: course.id } }"
          class="rounded-sm text-sm font-medium leading-5 text-zinc-950 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
          @click="handleClick"
        >
          <SearchHighlight :text="course.name" :highlight-ranges="course.name_highlight_ranges" />
        </RouterLink>
        <span
          class="inline-flex shrink-0 items-center gap-1 rounded-md border border-zinc-200 px-1.5 py-0.5 text-xs font-medium text-zinc-700"
          :title="`标准化评分：${course.rating.normalized_rating.toFixed(2)}`"
        >
          <Star class="h-3 w-3" aria-hidden="true" />
          {{ course.rating.average_rating.toFixed(1) }}
        </span>
      </div>

      <div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-5 text-zinc-500">
        <span v-if="course.teacher">{{ course.teacher }}</span>
        <span v-if="course.school">{{ course.school }}</span>
        <span v-if="course.classification" class="rounded bg-zinc-100 px-1.5 text-zinc-600">{{ course.classification }}</span>
        <span v-if="course.semester">{{ course.semester }}</span>
      </div>

      <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
        <span>{{ course.review_count }} 条评价</span>
        <span class="inline-flex items-center gap-1" :title="`${course.like.like} 人赞同`">
          <ThumbsUp class="h-3 w-3" aria-hidden="true" />
          {{ course.like.like }}
        </span>
        <span class="inline-flex items-center gap-1" :title="`${course.like.dislike} 人不赞同`">
          <ThumbsDown class="h-3 w-3" aria-hidden="true" />
          {{ course.like.dislike }}
        </span>
        <span v-if="course.latest_review_time" class="inline-flex items-center gap-1">
          最近评价 <Time :time="course.latest_review_time" />
        </span>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { BookOpen, Star, ThumbsDown, ThumbsUp } from 'lucide-vue-next'
import Time from '@/components/tinyComponents/Time.vue'
import SearchHighlight from '@/components/tinyComponents/SearchHighlight.vue'
import type { CourseSearchResult } from '@/types/api/search/search'

defineProps<{ course: CourseSearchResult }>()
const emit = defineEmits<{ (event: 'close'): void }>()

function handleClick(event: MouseEvent) {
  if (event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) emit('close')
}
</script>
