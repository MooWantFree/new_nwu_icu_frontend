<template>
  <article class="flex gap-3 px-4 py-4 transition-colors hover:bg-zinc-50">
    <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500" aria-hidden="true">
      <MessageSquare class="h-4 w-4" />
    </div>

    <div class="min-w-0 flex-1">
      <div class="flex items-start justify-between gap-3">
        <RouterLink
          :to="{
            name: 'courseReviewItem',
            params: { id: review.course.id },
            hash: `#review-${review.id}`,
          }"
          class="rounded-sm text-sm font-medium leading-5 text-zinc-950 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
          @click="handleClick"
        >
          {{ review.course.name }}
        </RouterLink>
        <span class="inline-flex shrink-0 items-center gap-1 rounded-md border border-zinc-200 px-1.5 py-0.5 text-xs font-medium text-zinc-700">
          <Star class="h-3 w-3" aria-hidden="true" />
          {{ review.rating }}
        </span>
      </div>

      <ReviewPlainText
        :content="review.content"
        :highlight-ranges="review.content_highlight_ranges"
        :lines="3"
        class="mt-2 text-sm leading-6 text-zinc-600"
      />

      <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
        <span class="max-w-36 truncate">{{ review.created_by.nickname }}</span>
        <Time :time="review.modify_time" class="whitespace-nowrap" />
        <span v-if="review.semester">{{ review.semester }}</span>
        <span class="inline-flex items-center gap-1" :title="`${review.like.like} 人赞同`">
          <ThumbsUp class="h-3 w-3" aria-hidden="true" />
          {{ review.like.like }}
        </span>
        <span class="inline-flex items-center gap-1" :title="`${review.like.dislike} 人不赞同`">
          <ThumbsDown class="h-3 w-3" aria-hidden="true" />
          {{ review.like.dislike }}
        </span>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { MessageSquare, Star, ThumbsDown, ThumbsUp } from 'lucide-vue-next'
import ReviewPlainText from '@/components/tinyComponents/ReviewPlainText.vue'
import Time from '@/components/tinyComponents/Time.vue'
import type { ReviewSearchResult } from '@/types/api/search/search'

defineProps<{ review: ReviewSearchResult }>()
const emit = defineEmits<{ (event: 'close'): void }>()

function handleClick(event: MouseEvent) {
  if (event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) emit('close')
}
</script>
