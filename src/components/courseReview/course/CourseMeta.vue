<template>
  <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div class="p-5 sm:p-7">
      <div class="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-sm font-medium text-slate-500">综合评分</p>
          <div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <n-rate
            readonly
            :allow-half="true"
            :default-value="Number(courseData.rating_avg)"
          />
            <span class="text-2xl font-semibold tracking-tight text-slate-900">{{ courseData.rating_avg }}</span>
            <span class="text-sm text-slate-500">{{ courseData.reviews.length }} 人评价</span>
          </div>
        </div>
        <div class="flex flex-wrap gap-2 text-sm text-slate-600">
          <span v-for="semester in courseData.semester" :key="semester" class="rounded-full bg-slate-100 px-3 py-1">{{ semester }}</span>
        </div>
      </div>
      <dl class="mt-6 grid gap-x-8 gap-y-4 border-t border-slate-200 pt-5 text-sm sm:grid-cols-2">
        <div>
          <dt class="text-slate-500">课程类别</dt>
          <dd class="mt-1 font-medium text-slate-800">{{ courseData.category }}</dd>
        </div>
        <div>
          <dt class="text-slate-500">开课单位</dt>
          <dd class="mt-1 font-medium text-slate-800">{{ courseData.school }}</dd>
        </div>
        <div>
          <dt class="text-slate-500">课程主页</dt>
          <dd class="mt-1 text-slate-700">暂无（如果你知道，劳烦告诉我们！）</dd>
        </div>
        <div>
          <dt class="text-slate-500">归一化平均分</dt>
          <dd class="mt-1 flex items-center gap-1.5 font-medium text-slate-800">
          <n-tooltip placement="top">
            <template #trigger>
              <n-button text class="p-0 text-blue-700">
                <CircleHelp class="w-4 h-4" />
              </n-button>
            </template>
            归一化平均分是经过统计调整的评分，可以更公平地比较不同课程
          </n-tooltip>
          <n-rate
            readonly
            :allow-half="true"
            :default-value="Number(courseData.normalized_rating_avg)"
            :size="12"
          />
          {{ courseData.normalized_rating_avg }}
          </dd>
        </div>
      </dl>
      <div class="mt-6 flex flex-col gap-2 border-t border-slate-200 pt-5 sm:flex-row">
        <button
          @click="
            () => {
              handleLikeNDislike(LikeValue.Recommend)
            }
          "
          :disabled="isButtonDisabled"
          :class="[
            'flex min-h-11 items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors sm:w-auto',
            courseData.like.user_option === 1
              ? 'bg-blue-600 text-white'
              : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700',
            isButtonDisabled ? 'opacity-50 cursor-not-allowed' : '',
          ]"
        >
          <ThumbsUp class="w-5 h-5 mr-2" />
          <span>推荐({{ courseData.like.like }})</span>
        </button>
        <button
          @click="
            () => {
              handleLikeNDislike(LikeValue.DisRecommend)
            }
          "
          :disabled="isButtonDisabled"
          :class="[
            'flex min-h-11 items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors sm:w-auto',
            courseData.like.user_option === -1
              ? 'bg-red-600 text-white'
              : 'border-slate-200 bg-white text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700',
            isButtonDisabled ? 'opacity-50 cursor-not-allowed' : '',
          ]"
        >
          <ThumbsDown class="w-5 h-5 mr-2" />
          <span>不推荐({{ courseData.like.dislike }})</span>
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ThumbsDown, ThumbsUp, CircleHelp } from 'lucide-vue-next'
import { useUser } from '@/lib/useUser'
import type { CourseData } from '@/types/courseReview'
import { useMessage, NRate } from 'naive-ui'
import { api } from '@/lib/requests'

const message = useMessage()
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
