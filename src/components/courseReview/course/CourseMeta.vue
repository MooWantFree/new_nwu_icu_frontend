<template>
  <div class="p-6 bg-white rounded-md shadow-md">
    <h1 class="text-2xl font-bold">{{ courseData.name }}</h1>
    <div class="mt-2 text-sm text-gray-600 space-y-0.5">
      <span v-for="semester in courseData.semester">{{ semester }}</span>
    </div>
    <div class="mt-4">
      <div class="flex items-center space-x-2">
        <div class="flex items-center">
          <n-rate readonly :allow-half="true" :default-value="Number(courseData.rating_avg)"/>
        </div>
        <div class="text-lg font-bold">{{ courseData.rating_avg }}</div>
        <div class="text-sm text-gray-600">({{ courseData.reviews.length }}人评价)</div>
      </div>
      <div class="mt-4 text-gray-400">
<!--        <p class="space-x-3">-->
<!--          <span>课程难度：<n-rate readonly allow-half :default-value="Number(courseData.difficulty)"/></span>-->
<!--          <span>作业多少：<n-rate readonly allow-half :default-value="Number(courseData.homework)"/></span>-->
<!--          <span>给分好坏：<n-rate readonly allow-half :default-value="Number(courseData.grade)"/></span>-->
<!--          <span>收获大小：<n-rate readonly allow-half :default-value="Number(courseData.reward)"/></span>-->
<!--        </p>-->
      </div>
      <div class="flex mt-3">
        <div class="flex-1">
          <p>课程类别：{{ courseData.category }}</p>
        </div>
        <div class="flex-1">
          <!--                <p>教学类型：理论课</p>-->
          <p>开课单位：{{ courseData.school }}</p>
          <!--                <p>学分: {{ courseData. }}</p>-->
        </div>
      </div>
      <p class="mt-3">课程主页：暂无（如果你知道，劳烦告诉我们！）</p>
      <div class="flex items-center mt-4 space-x-2">
        <!-- <n-button icon-placement="left" @click="handleFavoriteButtonClick">
          <template #icon>
            <HeartOutline/>
          </template>
          关注
        </n-button> -->
        <button @click="handleRecommendButtonClick" :class="['flex items-center px-4 py-2 rounded transition-colors', courseData.like.user_option === 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-blue-500 hover:text-white']">
          <ThumbsUpOutline class="w-5 h-5 mr-2" />
          <span>推荐({{ courseData.like.like }})</span>
        </button>
        <button @click="handleDisRecommendButtonClick" :class="['flex items-center px-4 py-2 rounded transition-colors ml-2', courseData.like.user_option === -1 ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-red-500 hover:text-white']">
          <ThumbsDownOutline class="w-5 h-5 mr-2" />
          <span>不推荐({{ courseData.like.dislike }})</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ThumbsDownOutline, ThumbsUpOutline } from '@vicons/ionicons5'
import type { CourseData } from '@/types/courses'
import { useMessage } from 'naive-ui'
import { api } from '@/lib/requests'
import { ReplyLikeResponse } from '@/types/api/course'

const message = useMessage()
const props = defineProps<{
  courseData: CourseData,
  loading: boolean,
}>()

// Buttons
// const handleFavoriteButtonClick = async () => {
//   // TODO: Handle if already clicked
//   const resp = await api.post()
//   if (resp.status === 200) {
//     message.success('收藏成功')
//   } else {

//   }
// }
// TODO: Debounce
const handleRecommendButtonClick = async () => {
  const resp = await api.post<ReplyLikeResponse>('/api/assessment/course/like/', {
    course_id: props.courseData.id,
    like: 1,
  })
  if (resp.status === 200) {
    switch (props.courseData.like.user_option) {
      case -1:
        // fall through
      case 0:
        props.courseData.like.dislike = resp.content.like.dislike
        props.courseData.like.like = resp.content.like.like
        props.courseData.like.user_option = 1
        break
      case 1:
        props.courseData.like.dislike = resp.content.like.dislike
        props.courseData.like.like = resp.content.like.like
        props.courseData.like.user_option = 0
        break
    }
  } else {
    message.error('推荐失败，请稍后再试')
  }
}
const handleDisRecommendButtonClick = async () => {
  const resp = await api.post<ReplyLikeResponse>('/api/assessment/course/like/', {
    course_id: props.courseData.id,
    like: -1,
  })
  if (resp.status === 200) {
    switch (props.courseData.like.user_option) {
      case 1:
        // fall through
      case 0:
        props.courseData.like.dislike = resp.content.like.dislike
        props.courseData.like.like = resp.content.like.like
        props.courseData.like.user_option = -1
        break
      case -1:
        props.courseData.like.dislike = resp.content.like.dislike
        props.courseData.like.like = resp.content.like.like
        props.courseData.like.user_option = 0
        break
    }
  } else {
    message.error('不推荐失败，请稍后再试')
  }
}

</script>