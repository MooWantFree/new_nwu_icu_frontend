<template>
  <article class="px-5 py-6 sm:px-7">
    <div class="flex items-start gap-3 sm:gap-4">
      <n-tooltip trigger="hover">
        <template #trigger>
          <div class="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
            <UserAvatar
              v-if="review.author.id > 0"
              :avatar="review.author.avatar_uuid"
              :uuid="review.author.uuid"
              :has-avatar="review.author.has_avatar"
              :alt="review.author.nickname"
              class="h-full w-full rounded-full object-cover"
            />
            <n-avatar
              v-else
              round
              :size="40"
              :src="`/api/download/${review.author.avatar_uuid}`"
            />
          </div>
        </template>
        <span>{{ review.author.is_student ? '西大邮箱认证用户' : '普通用户' }}</span>
      </n-tooltip>

      <div class="min-w-0 flex-1">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div class="min-w-0">
            <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <RouterLink
                :to="{
                  name: 'courseReviewItem',
                  params: { id: review.course.id },
                  hash: `#review-${review.id}`,
                }"
                class="break-words text-base font-semibold text-blue-700 underline-offset-4 hover:text-blue-900 hover:underline sm:text-lg"
              >
                {{ review.course.name }}
              </RouterLink>

              <span class="text-sm text-slate-500">
                <template v-for="(teacher, index) in review.teachers" :key="teacher.id">
                  <RouterLink
                    :to="`/review/teacher/${teacher.id}`"
                    class="hover:text-blue-700 hover:underline"
                  >{{ teacher.name }}</RouterLink><span v-if="index < review.teachers.length - 1">、</span>
                </template>
              </span>
            </div>
          </div>

          <div class="flex shrink-0 items-center gap-3 text-sm text-slate-500 sm:justify-end">
            <RouterLink
              v-if="review.author.id > 0"
              :to="`/user/${review.author.id}`"
              class="max-w-36 truncate text-slate-700 hover:text-blue-700 hover:underline"
            >
              {{ review.author.nickname }}
            </RouterLink>
            <span v-else class="max-w-36 truncate text-slate-700">
              {{ review.author.nickname }}
            </span>
            <Time :time="review.datetime" class="whitespace-nowrap" />
          </div>
        </div>

        <ReviewPlainText
          :content="review.content"
          :lines="3"
          class="mt-3 text-sm leading-7 text-slate-600"
        />
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import UserAvatar from '@/components/common/UserAvatar.vue'
import ReviewPlainText from '@/components/tinyComponents/ReviewPlainText.vue'
import Time from '@/components/tinyComponents/Time.vue'
import type { ReviewTimeline } from '@/types/courseReview'

defineProps<{
  review: ReviewTimeline
}>()
</script>
