<template>
  <div class="flex items-center justify-between mb-4">
    <div>
      <div class="flex items-center relative">
        <router-link
          v-if="review.author.id > 0"
          :to="`/user/profile/${review.author.id}`"
        >
          <img
            :src="`/api/download/${review.author.avatar}`"
            alt="Avatar"
            class="w-8 h-8 rounded-full mr-2"
          />
        </router-link>
        <img
          v-else
          :src="`/api/download/${review.author.avatar}`"
          alt="Avatar"
          class="w-8 h-8 rounded-full mr-2"
        />
        <h3 class="text-xl font-bold text-gray-900">
          <router-link
            v-if="review.author.id > 0"
            :to="`/user/profile/${review.author.id}`"
            class="text-blue-600 hover:underline"
          >
            {{ review.author.nickname }}
          </router-link>
          <span v-else>匿名用户</span>
        </h3>
        <span
          v-if="isAuthor"
          class="absolute top-0 right-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-full"
          >我的评价</span
        >
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
import { Review } from '@/types/courses'

const { review, isAuthor } = defineProps<{
  review: Review
  isAuthor: boolean
}>()
</script>
