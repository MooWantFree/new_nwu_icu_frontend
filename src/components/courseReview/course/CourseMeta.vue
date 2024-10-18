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
        <p class="space-x-3">
          <span>课程难度：简单</span>
          <span>作业多少：中等</span>
          <span>给分好坏：超好</span>
          <span>收获大小：很多</span>
        </p>
        <!--              TODO-->
      </div>
      <div class="flex mt-3">
        <!--              TODO-->
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
      <!--            TODO-->
      <div class="flex items-center mt-4 space-x-2">
        <n-button icon-placement="left" @click="handleFavoriteButtonClick">
          <template #icon>
            <HeartOutline/>
          </template>
          关注
        </n-button>
        <n-button icon-placement="left" @click="handleRecommendButtonClick">
          <template #icon>
            <ThumbsUpOutline/>
          </template>
          推荐
        </n-button>
        <n-button icon-placement="left" @click="handleDisRecommendButtonClick">
          <template #icon>
            <ThumbsDownOutline/>
          </template>
          不推荐
        </n-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {HeartOutline, ThumbsDownOutline, ThumbsUpOutline} from "@vicons/ionicons5";
import type {CourseData} from "@/types/courses";

const props = defineProps<{
  courseData: CourseData,
  loading: boolean,
}>()

// Buttons
const handleFavoriteButtonClick = () => {
// TODO
}
const handleRecommendButtonClick = () => {
// TODO
}
const handleDisRecommendButtonClick = () => {
// TODO
}

</script>