<template>
  <div class="mb-5 rounded-xl bg-slate-50 p-4 text-slate-700">
      <div class="grid gap-x-4 gap-y-3 sm:grid-cols-2">
        <span
          v-for="(value, key) in ratings"
          :key="key"
          class="flex items-center justify-between gap-2 text-sm"
          :title="ratingTooltip(review[key])"
        >
          <span>{{ value }}</span>
          <div class="flex">
            <Star
              v-for="i in 3"
              :key="i"
              class="w-4 h-4"
              :fill="i <= review[key] ? '#FACC15' : '#D1D1D6'"
              :class="i <= review[key] ? 'text-yellow-400' : 'text-gray-300'"
            />
          </div>
        </span>
      </div>
  </div>
  <div class="mb-5 text-slate-700">
    <Viewer :value="review.content" />
  </div>
</template>

<script lang="ts" setup>
import { Review } from '@/types/courseReview'
import { ratingTooltip } from '../../tooltips'
import Viewer from '@/components/tiptap/viewer/Viewer.vue'
import { Star } from 'lucide-vue-next'

const { review } = defineProps<{
  review: Review
}>()

const ratings = {
  difficulty: '课程难度',
  homework: '作业多少',
  grade: '给分好坏',
  reward: '收获大小'
}
</script>
