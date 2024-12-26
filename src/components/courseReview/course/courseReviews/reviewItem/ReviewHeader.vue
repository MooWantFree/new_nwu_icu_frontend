<template>
  <div class="flex items-center justify-between mb-4">
    <div>
      <div class="flex items-center relative">
        <div v-if="review.author.id > 0" class="relative group">
          <router-link :to="`/user/profile/${review.author.id}`">
            <img
              :src="`/api/download/${review.author.avatar}`"
              alt="Avatar"
              class="w-10 h-10 rounded-full mr-3 border-2 border-transparent group-hover:border-blue-500 transition-all duration-300"
            />
          </router-link>
        </div>
        <img
          v-else
          :src="`/api/download/${review.author.avatar}`"
          alt="Anonymous Avatar"
          class="w-10 h-10 rounded-full mr-3 border-2 border-gray-200"
        />
        <div>
          <h3 class="text-xl font-bold text-gray-900">
            <router-link
              v-if="review.author.id > 0"
              :to="`/user/profile/${review.author.id}`"
              class="text-blue-600 hover:text-blue-800 transition-colors duration-300"
            >
              {{ review.author.nickname }}
            </router-link>
            <span v-else class="text-gray-600">匿名用户</span>
          </h3>
          <span v-if="isAuthor" class="text-sm text-green-600 ml-2">(我的评价)</span>
        </div>
      </div>
      <div class="flex items-center space-x-2 mt-1">
        <div class="flex items-center">
          <n-rate readonly allow-half :default-value="review.rating" />
        </div>
        <div class="text-sm text-gray-600">{{ review.semester }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Review } from '@/types/courseReview'

const { review, isAuthor } = defineProps<{
  review: Review
  isAuthor: boolean
}>()
</script>
