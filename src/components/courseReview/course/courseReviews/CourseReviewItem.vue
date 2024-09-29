<template>
  <div class="bg-gray-100 rounded-lg shadow-md p-6">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="text-xl font-bold text-gray-900">{{ review.name ?? "匿名用户" }}</h3>
        <div class="flex items-center space-x-2 mt-1">
          <div class="flex items-center">
            <n-rate readonly allow-half :default-value="review.rating" />
          </div>
          <div class="text-sm text-gray-600">{{ review.semester }}</div>
        </div>
      </div>
    </div>
    <div class="text-gray-700 mb-4">
      <p class="space-x-4">
        <span>课程难度：{{ review.difficulty }}</span>
        <span>作业多少：{{ review.homework }}</span>
        <span>给分好坏：{{ review.grade }}</span>
        <span>收获大小：{{ review.reward }}</span>
      </p>
    </div>
    <div class="text-gray-800 mb-4">
      <Editor :editable="false" :default-content="review.content" :show-toolbar="false" />
    </div>
    <div class="flex items-center justify-between text-sm text-gray-500">
      <div class="flex items-center space-x-2">
        <Time :time="new Date(review.created_time)" />
        <div v-if="review.edited">
          <span>(最后修改于: <n-time :time="new Date(review.modified_time)" />)</span>
        </div>
      </div>
    </div>
    <div class="mt-4">
      <div class="flex justify-between items-center mb-2" v-if="review.reply && review.reply.length > 0">
        <h4 class="font-semibold text-gray-900">评论</h4>
        <!-- TODO: Change color -->
         <div>
          <span>排序：</span>
          <n-button text @click="toggleReplyOrder" class="text-blue-600 hover:text-blue-800">
          {{ reverseReplies ? '最新回复' : '最早回复' }}
        </n-button>
         </div>
      </div>
      <div class="space-y-2">
        <div v-for="(reply, index) in (reverseReplies ? [...review.reply].reverse() : review.reply)" :key="reply.created_time" class="bg-gray-50 p-3 rounded-md flex justify-between items-start">
          <div>
            <p class="text-sm text-gray-700">
              {{ reply.created_by.name }}: {{ reply.content }}
            </p>
            <p class="text-xs text-gray-500 mt-1">
              <Time type="relative" :time="new Date(reply.created_time)" />
            </p>
          </div>
          <!-- TODO: Hover to show a reply button, and add `> #${id}` to the reply content -->
          <span class="text-sm text-gray-500 ml-2">
            #{{ reverseReplies ? index + 1 : review.reply.length - index }}
          </span>
        </div>
      </div>
    </div>
    <div class="flex justify-end mt-2 mx-2">
      <n-button v-if="isLoggedIn" text @click="toggleReply" class="text-blue-600 hover:text-blue-800">
        {{ showReply ? '取消回复' : '回复' }}
      </n-button>
      <span v-else>
        登录以后才能回复
      </span>
    </div>
    <CourseReviewItemReply v-if="isLoggedIn && showReply" :review="review" @close="toggleReply" class="mt-4" @replySubmitted="onReplySubmitted"/>
  </div>
</template>

<script lang="ts" setup>
import { Review } from "@/types/courses"
import CourseReviewItemReply from "./CourseReviewItemReply.vue"
import { ref } from "vue"
import Time from "@/components/shortcuts/Time.vue"
import { NButton } from 'naive-ui'
import Editor from "../../editor/Editor.vue"
import { useUser } from "@/lib/useUser"

const props = defineProps<{
  review: Review,
}>()

// Display the reply box or not
const showReply = ref(false)

const toggleReply = () => {
  showReply.value = !showReply.value;
  // TODO:
}


const reverseReplies = ref(false)

const toggleReplyOrder = () => {
  reverseReplies.value = !reverseReplies.value
}

const {userInfo, isLoggedIn} = useUser()
const onReplySubmitted = (content: string) => {
  toggleReply()
  // Push the new reply to the review's replies array
  props.review.reply.unshift({
    content,
    created_time: new Date().toISOString(), // Changed 'created_at' to 'created_time'
    created_by: {
      id: userInfo.value.id,
      name: userInfo.value.nickname ?? userInfo.value.username,
      avatar: userInfo.value.avatar
    },
    like: {
      like: 0,
      dislike: 0
    }
  })
}
</script>

<style scoped></style>