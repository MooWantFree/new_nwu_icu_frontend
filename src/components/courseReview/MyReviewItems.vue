<template>
  <div v-if="review" class="w-full">
    <div class="pr-4 pl-4 pt-4 rounded flex flex-row">
      <div class="flex flex-col w-full flex-7">
        <p><strong>课程名称: </strong>
          <router-link :to="`/review/course/${review.course.course_id}`">
            <span style="color: #18A058;">{{ review.course.course_name }} ({{ review.semester }})</span>
          </router-link>
        </p>
        <p><strong>教师名字: </strong>
          <span v-for="teacher in review.teachers" :key="teacher.teacher_id">
            <router-link :to="`/course/teacher/${teacher.teacher_id}`">
            <span style="color: #18A058;">{{ teacher.teacher_name }}</span>
          </router-link>
        </span>
        </p>

        <p><strong>匿名状态: </strong> {{ review.anonymous ? '是' : '否' }}</p>
        <div class="flex flex-row">
          <p class="whitespace-nowrap pr-1"><strong>当前内容: </strong></p>

          <p>{{ review.content.current_content }}
            <n-icon size="20">
              <ArrowRedoOutline/>
            </n-icon>
          </p>
        </div>


        <div class="flex flex-row pt-4">
          <p class="pr-3 text-customGray">
            <n-time :time="new Date(review.datetime)" format="yyyy-MM-dd hh:mm:ss"/>
          </p>


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

        <n-dropdown class="justify-items-start" trigger="click" :options="options" @select="handleSelect" :render-label="renderMenuLabel" >
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
  <div class="flex justify-center items-center" v-else>
    <p>划到底了~~~</p>
  </div>
</template>

<script lang="ts" setup>
import {Component, h} from 'vue'
import {NIcon, NText, useMessage} from 'naive-ui'
import {
  ArrowRedoOutline,
  CreateOutline,
  EllipsisVerticalSharp,
  ThumbsDown,
  ThumbsUp,
  TimeOutline,
  TrashBinOutline,
} from '@vicons/ionicons5'
import type {Review} from '@/types/myReview'
import {renderMenuLabel} from "@/lib/h";

const message = useMessage()
const renderIcon = (icon: Component) => {
  return () => {
    if (icon.name === TrashBinOutline.name) {
      return h(NIcon, {
        color: '#FF0000'
      }, {
      default: () => h(icon)
    })
    } else {
      return h(NIcon, null, {
      default: () => h(icon)
    })
    }
  }
}
const options = [
  {
    label: '编辑',
    key: 'editReview',
    icon: renderIcon(CreateOutline)
  },
  {
    label: '编辑历史',
    key: 'editHistory',
    icon: renderIcon(TimeOutline)
  },
  {
    key: 'deleteReview',
    label: '删除',
    icon: renderIcon(TrashBinOutline),
    meta: {
      style: {
        color: 'red'
      }
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
</style>
