<template>
  <article class="px-5 py-6 sm:px-7">
    <div class="min-w-0">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <RouterLink
          :to="{
            name: 'courseReviewItem',
            params: { id: review.course.id },
            hash: `#review-${review.id}`,
          }"
          class="break-words text-base font-semibold text-blue-700 underline-offset-4 hover:text-blue-900 hover:underline sm:text-lg"
          @click="emit('close')"
        >
          {{ review.course.name }}
        </RouterLink>

        <div class="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500 sm:justify-end">
          <span class="max-w-36 truncate text-slate-700">{{ review.created_by.nickname }}</span>
          <Time :time="review.modify_time" class="whitespace-nowrap" />
          <span class="flex items-center gap-1 text-slate-500">
            <ThumbsUp class="h-4 w-4 text-slate-400" />
            {{ review.like.like }}
          </span>
          <span class="flex items-center gap-1 text-slate-500">
            <ThumbsDown class="h-4 w-4 text-slate-400" />
            {{ review.like.dislike }}
          </span>
        </div>
      </div>

      <ReviewPlainText
        :content="review.content"
        :highlight-ranges="review.content_highlight_ranges"
        :lines="3"
        class="mt-3 text-sm leading-7 text-slate-600"
      />
    </div>
  </article>
</template>

<script setup lang="ts">
import { ThumbsDown, ThumbsUp } from 'lucide-vue-next'
import ReviewPlainText from '@/components/tinyComponents/ReviewPlainText.vue'
import Time from '@/components/tinyComponents/Time.vue'
import type { ReviewSearchResult } from '@/types/api/search/search'

defineProps<{
  review: ReviewSearchResult
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()
</script>
