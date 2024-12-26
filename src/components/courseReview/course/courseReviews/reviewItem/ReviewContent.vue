<template>
  <div class="text-gray-700 mb-4">
    <div class="space-x-4">
      <div class="flex flex-wrap gap-4">
        <span
          class="flex items-center"
          :title="ratingTooltip(review.difficulty)"
        >
          <span class="mr-2">课程难度：</span>
          <div class="flex">
            <svg
              v-for="i in 3"
              :key="i"
              class="w-4 h-4"
              :class="
                i <= review.difficulty ? 'text-yellow-400' : 'text-gray-300'
              "
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
              />
            </svg>
          </div>
        </span>
        <span class="flex items-center" :title="ratingTooltip(review.homework)">
          <span class="mr-2">作业多少：</span>
          <div class="flex">
            <svg
              v-for="i in 3"
              :key="i"
              class="w-4 h-4"
              :class="
                i <= review.homework ? 'text-yellow-400' : 'text-gray-300'
              "
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
              />
            </svg>
          </div>
        </span>
        <span class="flex items-center" :title="ratingTooltip(review.grade)">
          <span class="mr-2">给分好坏：</span>
          <div class="flex">
            <svg
              v-for="i in 3"
              :key="i"
              class="w-4 h-4"
              :class="i <= review.grade ? 'text-yellow-400' : 'text-gray-300'"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
              />
            </svg>
          </div>
        </span>
        <span class="flex items-center" :title="ratingTooltip(review.reward)">
          <span class="mr-2">收获大小：</span>
          <div class="flex">
            <svg
              v-for="i in 3"
              :key="i"
              class="w-4 h-4"
              :class="i <= review.reward ? 'text-yellow-400' : 'text-gray-300'"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
              />
            </svg>
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

const { review } = defineProps<{
  review: Review
}>()
</script>
