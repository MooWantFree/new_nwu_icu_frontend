<!-- Course search result card component -->
<template>
  <div
    class="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
  >
    <!-- Course title with clickable link -->
    <a @click="handleCourseClick" class="cursor-pointer">
      <h3 class="text-lg font-semibold text-blue-600 mb-2 hover:underline">
        {{ course.name }}
      </h3>
    </a>

    <!-- Course basic information section -->
    <div class="grid grid-cols-2 gap-2 mb-3">
      <p class="text-sm text-gray-600">教师: {{ course.teacher }}</p>
      <p class="text-sm text-gray-600">分类: {{ course.classification }}</p>
      <p class="text-sm text-gray-600">学校: {{ course.school }}</p>
      <p class="text-sm text-gray-600">学期: {{ course.semester }}</p>
    </div>

    <!-- Rating and review statistics section -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center">
        <span class="text-yellow-500 mr-1">★</span>
        <span class="font-medium">{{
          course.rating.average_rating.toFixed(1)
        }}</span>
        <span class="text-sm text-gray-500 ml-2">
          (标准化: {{ course.rating.normalized_rating.toFixed(2) }})
        </span>
      </div>
      <button
        @click="handleCourseClick"
        class="px-3 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600 transition-colors"
      >
        查看详情
      </button>
    </div>

    <!-- Like/Dislike and review count section -->
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-4 text-sm text-gray-600">
        <div class="flex items-center">
          <ThumbsUp class="w-5 h-5 text-green-500 mr-1" />
          <span>{{ course.like.like }}</span>
        </div>
        <div class="flex items-center">
          <ThumbsDown class="w-5 h-5 text-red-500 mr-1" />
          <span>{{ course.like.dislike }}</span>
        </div>
      </div>
      <div class="text-sm text-gray-600">
        评价数: {{ course.review_count }}
        <span
          v-if="course.latest_review_time"
          class="text-xs text-gray-500 ml-2"
        >
          (最新: {{ new Date(course.latest_review_time).toLocaleDateString() }})
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Import required dependencies
import { CourseSearchResult } from '@/types/api/search/search'
import { useRouter } from 'vue-router'
import { ThumbsUp, ThumbsDown } from 'lucide-vue-next'

// Define component props
const props = defineProps<{
  course: CourseSearchResult
}>()
const emit = defineEmits<{
  (e: 'close'): void
}>()

// Initialize router for navigation
const router = useRouter()

// Handle course click event to navigate to course details
const handleCourseClick = () => {
  router.push({
    name: 'courseReviewItem',
    params: {
      id: props.course.id,
    },
  })
  emit('close')
}
</script>
