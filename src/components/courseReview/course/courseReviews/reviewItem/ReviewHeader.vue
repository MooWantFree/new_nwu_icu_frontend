<template>
  <div class="mb-5 flex items-center justify-between">
    <div>
      <div class="flex items-center relative">
        <div v-if="!review.author.anonymous" class="relative group">
          <router-link :to="`/user//${review.author.id}`">
            <UserAvatar
              :avatar="review.author.avatar"
              :uuid="review.author.uuid"
              :has-avatar="review.author.has_avatar"
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
          <div class="flex flex-wrap items-center gap-2">
          <h3 class="text-lg font-bold text-slate-900">
            <router-link
              v-if="review.author.id > 0"
              :to="`/user/${review.author.id}`"
              class="text-blue-700 transition-colors hover:text-blue-800"
            >
              {{ review.author.nickname }}
            </router-link>
            <span v-else class="text-slate-600">匿名用户</span>
          </h3>
          <span v-if="isAuthor" class="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">我</span>
          </div>
          <div class="mt-1 flex flex-wrap items-center gap-2">
            <div class="flex items-center">
              <n-rate readonly allow-half :default-value="review.rating" :size="16" />
            </div>
            <span class="text-sm text-slate-500">{{ review.semester }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Review } from '@/types/courseReview'
import UserAvatar from '@/components/common/UserAvatar.vue'

const { review, isAuthor } = defineProps<{
  review: Review
  isAuthor: boolean
}>()
</script>
