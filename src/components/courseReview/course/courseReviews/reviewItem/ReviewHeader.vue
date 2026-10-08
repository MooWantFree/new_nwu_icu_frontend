<template>
  <div class="mb-4 grid min-w-0 grid-cols-[2.5rem_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1">
    <router-link
      v-if="!review.author.anonymous"
      :to="`/user/${review.author.id}`"
      class="row-span-2 block rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
    >
      <UserAvatar
        :avatar="review.author.avatar"
        :uuid="review.author.uuid"
        :has-avatar="review.author.has_avatar"
        :alt="`${review.author.nickname}的头像`"
        class="h-10 w-10 rounded-full border border-zinc-200 bg-zinc-100 object-cover"
        :class="review.author.is_student ? 'ring-2 ring-blue-500' : ''"
      />
    </router-link>
    <UserAvatar
      v-else
      :avatar="review.author.avatar"
      :has-avatar="true"
      alt="匿名用户头像"
      class="row-span-2 h-10 w-10 rounded-full border border-zinc-200 bg-zinc-100 object-cover"
    />
    <div class="flex min-w-0 flex-wrap items-center gap-2">
      <h3 class="min-w-0 break-words text-sm font-semibold leading-6 text-zinc-950">
        <router-link
          v-if="review.author.id > 0"
          :to="`/user/${review.author.id}`"
          class="rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
        >
          {{ review.author.nickname }}
        </router-link>
        <span v-else class="text-zinc-600">匿名用户</span>
      </h3>
      <span v-if="isAuthor" class="inline-flex items-center rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-600">我</span>
    </div>
    <div class="flex h-6 items-center">
      <ShadcnRating readonly allow-half color="yellow" label="总体评分" :value="review.rating" :size="16" />
    </div>
    <div class="col-span-2 col-start-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-4 text-zinc-500">
      <span>{{ review.semester }}</span>
      <span aria-hidden="true" class="text-zinc-300">·</span>
      <ShadcnTooltip placement="bottom">
        <template #trigger>
          <span
            tabindex="0"
            class="cursor-help rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
            :aria-label="timeDescription"
          >{{ displayTime }}</span>
        </template>
        <div>发表于 {{ fullCreatedTime }}</div>
        <div v-if="review.edited">修改于 {{ fullModifiedTime }}</div>
      </ShadcnTooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useNow } from '@vueuse/core'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import ShadcnRating from '@/components/common/ShadcnRating.vue'
import ShadcnTooltip from '@/components/common/ShadcnTooltip.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import type { Review } from '@/types/courseReview'

dayjs.extend(relativeTime)

const { review, isAuthor } = defineProps<{
  review: Review
  isAuthor: boolean
}>()

const now = useNow({ interval: 60_000 })
const createdTime = computed(() => dayjs(review.created_time).locale('zh-cn'))
const displayTime = computed(() => createdTime.value.isValid() ? createdTime.value.from(dayjs(now.value)) : '时间未知')
const formatTime = (time: string) => dayjs(time).isValid() ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '时间未知'
const fullCreatedTime = computed(() => formatTime(review.created_time))
const fullModifiedTime = computed(() => formatTime(review.modified_time))
const timeDescription = computed(() => `发表于 ${fullCreatedTime.value}${review.edited ? `，修改于 ${fullModifiedTime.value}` : ''}`)
</script>
