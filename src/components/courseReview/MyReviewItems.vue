<template>
  <div v-if="review" class="w-full">
    <div class="p-4 rounded flex flex-row">
      <div class="flex flex-col w-full flex-5">
        <a :href="`/course/${review.course.course_id}`"><strong>课程名称:</strong> {{
            review.course.course_name
          }}({{ review.semester }})</a>
        <p><strong>匿名:</strong> {{ review.anonymous ? '是' : '否' }}</p>
        <p><strong>内容:</strong> {{ review.content.current_content }}</p>
        <p><strong>教师:</strong>
          <span v-for="teacher in review.teachers" :key="teacher.teacher_id">
          <a :href="`/course/teacher/${teacher.teacher_id}`">{{ teacher.teacher_name }}</a>
        </span>
        </p>
        <div class="flex flex-row">
          <n-icon size="20">
            <ThumbsUp/>
          </n-icon>
          <p>{{ review.like.like }}</p>
          <n-icon class="pl-2" size="20">
            <ThumbsDown/>
          </n-icon>
          <p class="pl-2">{{ review.like.dislike }}</p>
        </div>
      </div>
      <div class="flex flex-row items-start flex-1 w-full justify-end">
        <p>
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-time :time="new Date(review.datetime)" type="relative"/>
            </template>
            <n-time :time="new Date(review.datetime)" format="yyyy-MM-dd hh:mm:ss"/>
          </n-tooltip>
        </p>
        <n-dropdown class="justify-items-start" trigger="click" :options="options" @select="handleSelect">
          <n-button text>
            <template #icon>
              <n-icon>
                <EllipsisVerticalSharp/>
              </n-icon>
            </template>
          </n-button>
        </n-dropdown>
      </div>

    </div>

  </div>
  <div v-else>
    <p>划到底了~~~</p>
  </div>
</template>

<script lang="ts" setup>
import {Component, h} from 'vue'
import {NIcon, useMessage} from 'naive-ui'
import {
  CreateOutline,
  EllipsisVerticalSharp,
  ThumbsDown,
  ThumbsUp,
  TimeOutline,
  TrashBinOutline
} from '@vicons/ionicons5'
import type {Review} from '@/types/myReview'

const message = useMessage()
const renderIcon = (icon: Component) => {
  return () => {
    return h(NIcon, null, {
      default: () => h(icon)
    })
  }
}
const options = [
  {
    label: '编辑',
    key: 'editReview',
    icon: renderIcon(CreateOutline)
  },
  {
    label: '查看历史',
    key: 'editHistory',
    icon: renderIcon(TimeOutline)
  },
  {
    label: '删除',
    key: 'deleteReview',
    icon: renderIcon(TrashBinOutline),
    renderLabel: () => {
      return h('span', {style: 'color: red;'}, '删除')
    }

  }
]
const props = defineProps<{
  review?: Review
}>()
const handleSelect = (key: string | number) => {
  message.info(String(key))
}
</script>

<style scoped>
.review-item {
  padding: 1rem;
  border-radius: 5px;
}
</style>
