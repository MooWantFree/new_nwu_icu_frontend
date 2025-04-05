<template>
  <div class="p-6 bg-white rounded-md shadow-md">
    <h1 class="text-2xl font-bold">{{ courseData.name }}</h1>
    <div class="mt-2 text-sm text-gray-600 space-y-0.5">
      <span v-for="semester in courseData.semester">{{ semester }}&nbsp;</span>
    </div>
    <div class="mt-4">
      <div class="flex items-center space-x-2">
        <div class="flex items-center">
          <n-rate
            readonly
            :allow-half="true"
            :default-value="Number(courseData.rating_avg)"
          />
        </div>
        <div class="text-lg font-bold">{{ courseData.rating_avg }}</div>
        <div class="text-sm text-gray-600">
          ({{ courseData.reviews.length }}人评价)
        </div>
      </div>
      <div class="mt-4 text-gray-400"></div>
      <div class="flex flex-col sm:flex-row mt-3">
        <div class="w-full sm:w-1/2">
          <p>课程类别：{{ courseData.category }}</p>
        </div>
        <div class="w-full sm:w-1/2 mt-2 sm:mt-0">
          <p>开课单位：{{ courseData.school }}</p>
        </div>
      </div>
      <div class="mt-3 flex flex-col sm:flex-row">
        <p class="w-full sm:w-1/2">课程主页：暂无（如果你知道，劳烦告诉我们！）</p>
        <p class="w-full sm:w-1/2 flex items-center mt-2 sm:mt-0">
          <span>归一化平均分</span>
          <n-tooltip placement="top">
            <template #trigger>
              <n-button text class="text-blue-500 p-0">
                <CircleHelp class="w-4 h-4" />
              </n-button>
            </template>
            归一化平均分是经过统计调整的评分，可以更公平地比较不同课程
          </n-tooltip>
          <span>：</span>
          <n-rate
            readonly
            class="mr-2"
            :allow-half="true"
            :default-value="Number(courseData.normalized_rating_avg)"
            :size="12"
          ></n-rate>
          {{ courseData.normalized_rating_avg }}
        </p>
      </div>
      <div class="flex flex-col sm:flex-row items-center mt-4 space-y-2 sm:space-y-0 sm:space-x-2">
        <button
          @click="
            () => {
              handleLikeNDislike(LikeValue.Recommend)
            }
          "
          :disabled="isButtonDisabled"
          :class="[
            'flex items-center px-4 py-2 rounded transition-colors w-full sm:w-auto',
            courseData.like.user_option === 1
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-blue-500 hover:text-white',
            isButtonDisabled ? 'opacity-50 cursor-not-allowed' : '',
          ]"
        >
          <ThumbsUpOutline class="w-5 h-5 mr-2" />
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
            'flex items-center px-4 py-2 rounded transition-colors w-full sm:w-auto',
            courseData.like.user_option === -1
              ? 'bg-red-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-red-500 hover:text-white',
            isButtonDisabled ? 'opacity-50 cursor-not-allowed' : '',
          ]"
        >
          <ThumbsDownOutline class="w-5 h-5 mr-2" />
          <span>不推荐({{ courseData.like.dislike }})</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ThumbsDownOutline, ThumbsUpOutline } from '@vicons/ionicons5'
import { CircleHelp } from 'lucide-vue-next'
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
