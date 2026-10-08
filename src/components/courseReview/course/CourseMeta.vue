<template>
  <section class="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[0_1px_2px_rgb(0_0_0_/_0.025)]">
    <header class="border-b border-zinc-100 px-5 py-4 sm:px-6">
      <h2 class="text-base font-semibold text-zinc-950">课程信息</h2>
    </header>
    <div class="p-5 sm:p-6">
      <div class="grid grid-cols-2 gap-5 border-b border-zinc-100 pb-5">
        <div>
          <p class="text-sm text-zinc-500">综合评分</p>
          <div class="mt-2 flex items-baseline gap-1.5">
            <span class="text-3xl font-semibold tracking-tight text-zinc-950">{{ courseData.rating_avg }}</span>
            <span class="text-sm text-zinc-400">/ 5</span>
          </div>
          <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
            <ShadcnRating readonly color="yellow" label="综合评分" :allow-half="true" :value="Number(courseData.rating_avg)" :size="18" />
            <span class="text-xs text-zinc-500">{{ courseData.total_review_count }} 人评价</span>
          </div>
        </div>
        <div>
          <div class="flex items-center gap-1.5 text-sm text-zinc-500">
            <span>归一化平均分</span>
            <ShadcnTooltip trigger="click" placement="top">
              <template #trigger>
                <button
                  type="button"
                  aria-label="了解归一化平均分"
                  class="rounded-sm text-zinc-400 transition-colors hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
                >
                  <CircleHelp class="size-4" aria-hidden="true" />
                </button>
              </template>
            <p class="m-0 max-w-48 whitespace-normal text-sm leading-6 sm:max-w-64">
                归一化平均分是经过统计调整的评分，可以更公平地比较不同课程
              </p>
            </ShadcnTooltip>
          </div>
          <div class="mt-2 flex items-baseline gap-1.5">
            <span class="text-3xl font-semibold tracking-tight text-zinc-950">{{ courseData.normalized_rating_avg }}</span>
            <span class="text-sm text-zinc-400">/ 5</span>
          </div>
          <div class="mt-2">
            <ShadcnRating readonly color="yellow" label="归一化平均分" :allow-half="true" :value="Number(courseData.normalized_rating_avg)" :size="18" />
          </div>
        </div>
      </div>

      <dl class="grid grid-cols-2 gap-x-6 gap-y-4 pt-5 text-sm">
        <div>
          <dt class="text-zinc-500">课程编号</dt>
          <dd class="mt-1 break-words font-medium text-zinc-900">{{ courseData.code || '暂无' }}</dd>
        </div>
        <div>
          <dt class="text-zinc-500">课程类别</dt>
          <dd class="mt-1 break-words font-medium text-zinc-900">{{ courseData.category }}</dd>
        </div>
        <div>
          <dt class="text-zinc-500">开课单位</dt>
          <dd class="mt-1 break-words font-medium text-zinc-900">{{ courseData.school }}</dd>
        </div>
        <div>
          <dt class="text-zinc-500">课程主页</dt>
          <dd class="mt-1 text-zinc-500">暂无</dd>
        </div>
        <div class="col-span-2">
          <dt class="text-zinc-500">开课学期</dt>
          <dd v-if="courseData.semester.length" class="mt-2 flex flex-wrap gap-2">
            <span v-for="semester in courseData.semester" :key="semester" class="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-600">{{ semester }}</span>
          </dd>
          <dd v-else class="mt-1 text-zinc-500">暂无学期信息</dd>
        </div>
      </dl>
    </div>

    <div class="flex flex-wrap gap-2 border-t border-zinc-100 px-5 py-4 sm:px-6">
      <button
        type="button"
        @click="handleLikeNDislike(LikeValue.Recommend)"
        :disabled="isButtonDisabled"
        :aria-pressed="courseData.like.user_option === 1"
        :class="[
          'flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          courseData.like.user_option === 1
            ? 'border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800'
            : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950',
        ]"
      >
        <ThumbsUp class="size-4" aria-hidden="true" />
        <span>推荐 ({{ courseData.like.like }})</span>
      </button>
      <button
        type="button"
        @click="handleLikeNDislike(LikeValue.DisRecommend)"
        :disabled="isButtonDisabled"
        :aria-pressed="courseData.like.user_option === -1"
        :class="[
          'flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          courseData.like.user_option === -1
            ? 'border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800'
            : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950',
        ]"
      >
        <ThumbsDown class="size-4" aria-hidden="true" />
        <span>不推荐 ({{ courseData.like.dislike }})</span>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ThumbsDown, ThumbsUp, CircleHelp } from 'lucide-vue-next'
import { useUser } from '@/lib/useUser'
import type { CourseData } from '@/types/courseReview'
import { useShadcnToast } from '@/lib/useShadcnToast'
import ShadcnRating from '@/components/common/ShadcnRating.vue'
import ShadcnTooltip from '@/components/common/ShadcnTooltip.vue'
import { api } from '@/lib/requests'

const message = useShadcnToast()
const { isLoggedIn } = useUser()
const props = defineProps<{
  courseData: CourseData
  loading: boolean
}>()

const isButtonDisabled = ref(false)

enum LikeValue {
  Recommend = '1',
  DisRecommend = '-1',
}

const handleLikeNDislike = async (likeValue: LikeValue) => {
  if (isButtonDisabled.value) return
  if (!isLoggedIn.value) {
    message.error('请先登录')
    return
  }
  isButtonDisabled.value = true

  const resp = await api.post({
    url: '/api/assessment/course/like/',
    query: {
      course_id: props.courseData.id,
      like: likeValue,
    },
  })

  if (resp.status === 200) {
    props.courseData.like.dislike = resp.content.like.dislike
    props.courseData.like.like = resp.content.like.like

    if (props.courseData.like.user_option === parseInt(likeValue)) {
      props.courseData.like.user_option = 0
    } else {
      props.courseData.like.user_option = parseInt(likeValue)
    }
  } else {
    message.error(`${likeValue === '1' ? '推荐' : '不推荐'}失败，请稍后再试`)
  }

  isButtonDisabled.value = false
}
</script>
