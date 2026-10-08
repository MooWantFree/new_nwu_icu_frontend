<template>
  <div class="rounded-lg border border-zinc-100 bg-zinc-50/70 p-3 text-zinc-600">
      <div class="grid grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2 2xl:grid-cols-4">
        <div
          v-for="metric in metrics"
          :key="metric.key"
          class="flex min-w-0 items-center gap-2 text-xs"
          :title="metric.levels[review[metric.key] - 1]"
        >
          <span class="whitespace-nowrap">{{ metric.label }}</span>
          <ReviewMetricScale
            :model-value="review[metric.key]"
            :label="metric.label"
            :levels="metric.levels"
            :preference="metric.preference"
            readonly
          />
        </div>
      </div>
  </div>
  <div class="review-content mt-4 min-w-0 text-sm leading-7 text-zinc-700">
    <Viewer :value="review.content" expand-color="from-white" />
  </div>
</template>

<script lang="ts" setup>
import { Review } from '@/types/courseReview'
import Viewer from '@/components/tiptap/viewer/Viewer.vue'
import ReviewMetricScale from '../ReviewMetricScale.vue'
import { reviewMetrics } from '@/lib/reviewMetrics'

const { review } = defineProps<{
  review: Review
}>()

const metrics = Object.values(reviewMetrics)
</script>

<style scoped>
.review-content :deep(.tiptap) {
  margin-left: 0;
  overflow-wrap: anywhere;
}
.review-content :deep(.tiptap p) { font-size: 0.875rem; line-height: 1.75rem; }
.review-content :deep(.tiptap a) { color: #18181b; text-underline-offset: 0.2em; }
.review-content :deep(.tiptap img) { max-width: 100%; height: auto; }
.review-content :deep(.tiptap pre) { max-width: 100%; overflow-x: auto; }
.review-content :deep(.tableWrapper) { max-width: 100%; overflow-x: auto; }
.review-content :deep(button[aria-expanded]) {
  border-color: #e4e4e7;
  border-radius: 0.375rem;
  color: #52525b;
}
.review-content :deep(button[aria-expanded]:hover) { background-color: #f4f4f5; color: #18181b; }
.review-content :deep(button[aria-expanded]:focus-visible) { --tw-ring-color: #a1a1aa; }
</style>
