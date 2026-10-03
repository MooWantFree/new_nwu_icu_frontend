<template>
  <article class="px-5 py-5 transition-colors hover:bg-zinc-50 sm:px-6">
    <div class="flex items-start gap-3 sm:gap-4">
      <n-tooltip trigger="hover">
        <template #trigger>
          <div
            class="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100"
            :class="review.author.id > 0 && review.author.is_student ? 'ring-2 ring-blue-500' : ''"
          >
            <UserAvatar
              v-if="review.author.id > 0"
              :avatar="review.author.avatar_uuid"
              :uuid="review.author.uuid"
              :has-avatar="review.author.has_avatar"
              :alt="review.author.nickname"
              class="h-full w-full rounded-full object-cover"
            />
            <UserAvatar
              v-else
              :avatar="review.author.avatar_uuid"
              :has-avatar="true"
              alt="匿名用户头像"
              class="h-full w-full rounded-full object-cover"
            />
          </div>
        </template>
        <span>{{ review.author.id <= 0 ? '匿名用户' : review.author.is_student ? '认证用户' : '普通用户' }}</span>
      </n-tooltip>

      <div class="min-w-0 flex-1">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-x-2 gap-y-1.5">
              <RouterLink
                :to="{
                  name: 'courseReviewItem',
                  params: { id: review.course.id },
                  hash: `#review-${review.id}`,
                }"
                class="rounded-sm break-words text-base font-semibold leading-6 text-zinc-950 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
              >
                {{ review.course.name }}
              </RouterLink>

              <span class="flex flex-wrap gap-1 text-xs text-zinc-600">
                <template v-for="teacher in review.teachers" :key="teacher.id">
                  <RouterLink
                    :to="`/review/teacher/${teacher.id}`"
                    class="rounded-md bg-zinc-100 px-2 py-0.5 underline-offset-4 hover:text-zinc-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
                  >{{ teacher.name }}</RouterLink>
                </template>
              </span>
            </div>
          </div>

          <div class="flex shrink-0 items-center gap-2 text-xs text-zinc-500 sm:justify-end">
            <RouterLink
              v-if="review.author.id > 0"
              :to="`/user/${review.author.id}`"
              class="max-w-36 rounded-sm truncate text-zinc-600 underline-offset-4 hover:text-zinc-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
            >
              {{ review.author.nickname }}
            </RouterLink>
            <span v-else class="max-w-36 truncate text-zinc-600">
              {{ review.author.nickname }}
            </span>
            <Time :time="review.datetime" class="whitespace-nowrap" />
          </div>
        </div>

        <ReviewPlainText
          :content="review.content"
          :lines="3"
          class="mt-3 text-sm leading-7 text-zinc-600"
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

<style scoped>
:deep(.app-time) { color: #71717a; }
:deep(.app-time:hover) { color: #18181b; }
</style>
