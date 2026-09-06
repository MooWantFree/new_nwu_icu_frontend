<template>
  <div class="mb-5 text-slate-700">
      <div class="grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-x-5 gap-y-3">
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
            readonly
          />
        </div>
      </div>
  </div>
  <div class="mb-5 text-slate-700">
    <Viewer :value="review.content" />
  </div>
</template>

<script lang="ts" setup>
import { Review } from '@/types/courseReview'
import Viewer from '@/components/tiptap/viewer/Viewer.vue'
import ReviewMetricScale from '../ReviewMetricScale.vue'

const { review } = defineProps<{
  review: Review
}>()

const metrics = [
  { key: 'difficulty', label: '课程难度', levels: ['很简单', '较简单', '适中', '较难', '很难'] },
  { key: 'homework', label: '作业负担', levels: ['很少', '较少', '适中', '较多', '很多'] },
  { key: 'grade', label: '给分情况', levels: ['很严', '偏严', '一般', '偏宽', '很宽'] },
  { key: 'reward', label: '学习收获', levels: ['很少', '较少', '一般', '较多', '很多'] },
] as const
</script>
