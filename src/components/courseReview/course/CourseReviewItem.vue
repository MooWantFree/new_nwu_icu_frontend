<template>
  <div class="p-4 bg-gray-100 rounded-md">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-bold">{{ review.name ?? "匿名用户" }}</h3>
        <div class="flex items-center space-x-2">
          <div class="flex items-center">
            <n-rate readonly allow-half :default-value="review.rating"/>
          </div>
          <div class="text-sm text-gray-600">{{ review.semester }}</div>
        </div>
      </div>
    </div>
    <div class="mt-2 text-lg text-gray-600">
      <p class="space-x-3">
        <span>课程难度：{{ review.difficulty }}</span>
        <span>作业多少：{{ review.homework }}</span>
        <span>给分好坏：{{ review.grade }}</span>
        <span>收获大小：{{ review.reward }}</span>
      </p>
    </div>
    <div class="mt-2 text-sm text-gray-600">
      <p>
        {{ review.content }}
      </p>
      <div class="flex items-center mt-2 space-x-2 text-sm text-gray-500">
        <n-time :time="new Date(review.created_time)" />
        <div v-if="review.edited">
          <span>(最后修改于: <n-time :time="new Date(review.modified_time)" />)</span>
        </div>
        <n-button text>
          回复
        </n-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {Review} from "@/types/courses";

const props = defineProps<{
  review: Review,
}>()

</script>

<style scoped>


</style>