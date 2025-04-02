<template>
  <div class="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
    <div class="p-4 sm:p-6">
      <div class="flex flex-col sm:flex-row sm:items-center mb-4">
        <div class="flex items-center mb-3 sm:mb-0">
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-badge
                :show="review.author.is_student"
                class="hov"
                value="V"
                :offset="[-5, 33]"
                color="green"
              >
                <n-avatar
                  round
                  size="medium"
                  :src="`/api/download/${review.author.avatar_uuid}`"
                />
              </n-badge>
            </template>
            <p style="margin: 0" v-if="review.author.is_student">
              西大邮箱认证用户
            </p>
            <p style="margin: 0" v-else>普通用户</p>
          </n-tooltip>
          <div class="ml-3">
            <h2 class="text-base sm:text-lg font-semibold text-gray-900">
              <router-link
                v-if="review.author.id > 0"
                :to="`/user/${review.author.id}`"
                class="link"
              >
                {{ review.author.nickname }}
              </router-link>
              <span v-else>{{ review.author.nickname }}</span>
            </h2>
            <p class="text-xs sm:text-sm text-gray-500">
              <n-tooltip placement="bottom" trigger="hover">
                <template #trigger>
                  <n-time :time="new Date(review.datetime)" type="relative" />
                </template>
                <n-time
                  :time="new Date(review.datetime)"
                  format="yyyy-MM-dd hh:mm:ss"
                />
              </n-tooltip>
            </p>
          </div>
        </div>
        <div class="sm:ml-auto flex flex-col items-end">
          <h2 class="text-base sm:text-xl font-medium">
            <router-link :to="`/review/course/${review.course.id}`">
              <span class="link">{{ review.course.name }}</span>
            </router-link>
          </h2>
          <p class="text-sm flex flex-wrap">
            [
            <template v-for="(teacher, index) in review.teachers">
              <router-link :to="`/review/teacher/${teacher.id}`">
                <span class="link">{{ teacher.name }}</span>
              </router-link>
              {{ index < review.teachers.length - 1 ? ',' : '' }}
            </template>
            ]
          </p>
        </div>
      </div>
      <div class="text-gray-600 mb-3 sm:mb-4 relative">
        <Viewer 
          @toggle="handleMoreButtonClick" 
          :emitToggle="true" 
          :expandButtonText="'查看更多 >'" 
          :value="review.content" 
          expand-color="from-white" 
        />
      </div>
      <div class="flex items-center justify-end text-sm">
        <button 
          @click="handleMoreButtonClick" 
          class="link font-medium px-3 py-1 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          查看详情
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { useRouter } from 'vue-router'
import relativeTime from 'dayjs/plugin/relativeTime'
import Viewer from '@/components/tiptap/viewer/Viewer.vue'
import type { ReviewTimeline } from '@/types/courseReview'

dayjs.extend(relativeTime)

const { review } = defineProps<{
  review: ReviewTimeline
}>()
const router = useRouter()

const handleMoreButtonClick = () => {
  router.push({
    name: 'courseReviewItem',
    params: { id: review.course.id },
    hash: `#review-${review.id}`,
  })
}
</script>

<style lang="postcss">
.link {
  @apply underline-offset-4 text-blue-400 hover:text-blue-800;
}
</style>
