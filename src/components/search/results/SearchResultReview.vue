<template>
  <div class="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
    <a @click="handleReviewClick(filteredReview.course.id)" class="cursor-pointer">
      <h3 class="text-lg font-semibold text-blue-600 mb-2 hover:underline">
        {{ filteredReview.course.name }}
      </h3>
    </a>
    <div class="h-18 overflow-hidden mb-3">
      <p class="text-sm text-gray-700 line-clamp-3">
        <div v-html="filteredReview.content" ></div>
      </p>
    </div>
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center">
        <img
          :src="`/api/download/${filteredReview.created_by.avatar}`"
          alt="User Avatar"
          class="w-6 h-6 rounded-full mr-2"
        />
        <span class="text-sm font-medium text-gray-700">{{ filteredReview.created_by.nickname }}</span>
        <span class="text-xs text-gray-500 ml-2">
          {{ new Date(filteredReview.modify_time).toLocaleDateString() }}
        </span>
      </div>
      <button
        @click="handleReviewClick(filteredReview.course.id, filteredReview.id)"
        class="px-3 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600 transition-colors"
      >
        查看详情
      </button>
    </div>
    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <span class="text-yellow-500 mr-1">★</span>
        <span class="font-medium">{{ filteredReview.rating.toFixed(1) }}</span>
        <span class="text-sm text-gray-500 ml-2">({{ filteredReview.semester }})</span>
      </div>
      <div class="flex items-center space-x-4 text-sm text-gray-600">
        <div class="flex items-center">
          <ThumbsUp class="w-5 h-5 text-green-500 mr-1" />
          <span>{{ filteredReview.like.like }}</span>
        </div>
        <div class="flex items-center">
          <ThumbsDown class="w-5 h-5 text-red-500 mr-1" />
          <span>{{ filteredReview.like.dislike }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ReviewSearchResult } from '@/types/api/search/search'
import { useRouter } from 'vue-router'
import { ThumbsUp, ThumbsDown } from 'lucide-vue-next'
import { computed } from 'vue';

const { review } = defineProps<{
  review: ReviewSearchResult
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const filteredReview = computed(() => {
  return {
    ...review,
    content: review.content.replace(/<img[^>]*>/g, '[图片]<br />'),
  }
})

const router = useRouter()

const handleReviewClick = (courseId: number, reviewId: number = -1) => {
  if (reviewId === -1) {
    router.push({
      name: 'courseReviewItem',
      params: {
        id: courseId,
      },
    })
  } else {
    router.push({
      name: 'courseReviewItem',
      params: {
        id: courseId,
      },
      hash: `#review-${reviewId}`,
    })
  }
  emit('close')
}
</script>
