<template>
  <div class="review-content min-w-0 text-sm leading-7 text-zinc-700">
    <Viewer :value="review.content" expand-color="from-white" />
  </div>
  <ul class="mt-3 flex flex-wrap gap-2" aria-label="评价详细指标">
    <li
      v-for="metric in metrics"
      :key="metric.key"
      class="inline-flex items-center rounded-md bg-zinc-100 px-2 py-1 text-xs leading-4 text-zinc-600"
      :aria-label="`${metric.label}: ${metricValue(metric)}`"
    >
      {{ metricText(metric) }}
    </li>
  </ul>
</template>

<script lang="ts" setup>
import type { Review } from '@/types/courseReview'
import Viewer from '@/components/tiptap/viewer/Viewer.vue'
import { reviewMetrics } from '@/lib/reviewMetrics'

const { review } = defineProps<{
  review: Review
}>()

const metrics = Object.values(reviewMetrics)
const shortLabels = { difficulty: '难度', homework: '作业', grade: '给分', reward: '收获' }
const metricValue = (metric: typeof metrics[number]) => {
  const level = metric.levels[review[metric.key] - 1] || '未评价'
  const label = shortLabels[metric.key]
  return level.startsWith(label) ? level.slice(label.length) : level
}
const metricText = (metric: typeof metrics[number]) => `${shortLabels[metric.key]}: ${metricValue(metric)}`
</script>

<style scoped>
.review-content :deep(.tiptap) {
  margin: 0;
  overflow-wrap: anywhere;
}
.review-content :deep(.tiptap > :first-child) { margin-top: 0; }
.review-content :deep(.tiptap > :last-child) { margin-bottom: 0; }
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
