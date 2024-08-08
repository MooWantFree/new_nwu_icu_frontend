<template>
  <div v-if="reply" class="w-full">
    <div class="pr-4 pl-4 pt-4 rounded flex flex-row">
      <div class="flex flex-col w-full flex-7">
        <p><strong>课程名称: </strong>
          <router-link :to="`/review/course/${reply.id}`">
            <span style="color: #18A058;">{{ reply.course.name }}({{ reply.course.semester }})</span>
          </router-link>
        </p>
        <p><strong>评价内容: </strong>

          <span class="text-contentGray">{{ reply.content }})</span>

        </p>


        <div class="flex flex-row">
          <p class="whitespace-nowrap pr-1"><strong>回复内容: </strong></p>

          <p>{{ reply.reply.content }}
          </p>
        </div>


        <div class="flex flex-row pt-4">
          <p class="pr-3 text-customGray">
            <n-time :time="new Date(reply.datetime)" format="yyyy-MM-dd hh:mm:ss"/>
          </p>


          <n-icon size="20">
            <ThumbsUp/>
          </n-icon>
          <p>{{ reply.like.like }}</p>
          <n-icon class="pl-2" size="20">
            <ThumbsDown/>
          </n-icon>
          <p class="pl-2">{{ reply.like.dislike }}</p>

        </div>
      </div>
      <div class="flex flex-row items-start flex-1 w-full justify-end">

        <n-dropdown class="justify-items-start" trigger="click" :options="options" @select="handleSelect"
                    :render-label="renderMenuLabel">
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
    <p>期待你回复更多~</p>
  </div>
</template>

<script lang="ts" setup>
import {Component, h} from 'vue'
import {NIcon, useMessage} from 'naive-ui'
import {EllipsisVerticalSharp, ThumbsDown, ThumbsUp, TrashBinOutline,} from '@vicons/ionicons5'
import type {Reply} from '@/types/myReply'
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
  reply?: Reply
}>()
const handleSelect = (key: string | number) => {
  message.info(String(key))
}
</script>

<style scoped>
</style>
