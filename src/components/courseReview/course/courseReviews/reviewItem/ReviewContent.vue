<template>
  <div class="mb-1 text-slate-700">
      <div class="grid grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2 2xl:grid-cols-4">
        <div
          v-for="metric in metrics"
          :key="metric.key"
          class="flex items-center gap-1.5 text-sm"
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
  <div class="mb-5 text-slate-700">
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
