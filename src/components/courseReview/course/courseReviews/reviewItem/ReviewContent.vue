<template>
  <div class="text-gray-700 mb-4">
    <div class="space-x-4">
      <div class="flex flex-wrap gap-4">
        <span
          v-for="(value, key) in ratings"
          :key="key"
          class="flex items-center"
          :title="ratingTooltip(review[key])"
        >
          <span class="mr-2">{{ value }}：</span>
          <div class="flex">
            <Star
              v-for="i in 3"
              :key="i"
              class="w-4 h-4"
              :fill="i <= review[key] ? '#FACC15' : '#D1D5DB'"
              :class="i <= review[key] ? 'text-yellow-400' : 'text-gray-300'"
            />
          </div>
        </span>
      </div>
    </div>
  </div>
  <div class="text-gray-800 mb-4">
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
