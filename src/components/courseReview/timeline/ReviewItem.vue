<template>
  <div class="bg-white shadow-lg rounded-lg overflow-hidden">
    <div class="p-6">
      <div class="flex items-center mb-4">
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-badge :show="review.is_student" class="hov" value="V" :offset="[-5,33]" color="green">
              <n-avatar
                  round
                  size="large"
                  :src="`/api/download/${review.author.avatar_uuid}`"
                  fallback-src="https://www.loliapi.com/acg/pp/"
              />
            </n-badge>

          </template>
          <p style="margin: 0" v-if="review.is_student">西大邮箱认证用户</p>
          <p style="margin: 0" v-else>普通用户</p>
        </n-tooltip>
        <div class="ml-3">
          <h2 class="text-lg font-semibold text-gray-900">
            <template v-if="review.author.id > 0">
              <router-link :to="`/user/profile/${review.author.id}`">
                <span class="link">{{ review.author.name }}</span>
              </router-link>
            </template>
            <template v-else>
              <span>{{ review.author.name }}</span>
            </template>
          </h2>
          <p class="text-sm text-gray-500">
            <n-tooltip placement="bottom" trigger="hover">
              <template #trigger>
                <n-time :time="new Date(review.datetime)" type="relative"/>
              </template>
              <n-time :time="new Date(review.datetime)" format="yyyy-MM-dd hh:mm:ss"/>
              <!--          TODO: More readable-->
            </n-tooltip>
          </p>
        </div>
        <div class="ml-auto flex items-center">
          <h2 class="text-xl">
            <router-link :to="`/review/course/${review.course.id}`">
              <span class="link">{{ review.course.name }}</span>
            </router-link>
          </h2>
          <p>[
            <template v-for="(teacher,index) in review.teachers">
              <router-link :to="`/review/teacher/${teacher.id}`">
                <span class="link">{{ teacher.name }}</span>
              </router-link>
              {{ index < review.teachers.length - 1 ? ',' : '' }}
            </template>
            ]
          </p>
        </div>
      </div>
      <p class="text-gray-600 mb-4">
        {{ review.content }}
      </p>
      <div class="flex items-center justify-between text-sm">
        <span class="text-gray-500"></span>
        <button class="link font-medium">更多...</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type {Review} from "@/types/courseReview";

dayjs.extend(relativeTime);

const props = defineProps<{
  review?: Review
}>();

</script>

<style lang="postcss">
.link {
  @apply underline-offset-4 text-blue-400 hover:text-blue-800
}
</style>