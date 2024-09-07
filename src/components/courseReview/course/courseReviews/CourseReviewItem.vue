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
      <MilkdownProvider>
        <Render :content="review.content" />
      </MilkdownProvider>
    </div>
    <div class="flex items-center justify-between text-sm text-gray-500">
      <div class="flex items-center space-x-2">
        <Time :time="new Date(review.created_time)" />
        <div v-if="review.edited">
          <span>(最后修改于: <n-time :time="new Date(review.modified_time)" />)</span>
        </div>
      </div>
      <n-button v-if="isLoggedIn" text @click="toggleReply" class="text-blue-600 hover:text-blue-800">
        {{ showReply ? '取消回复' : '回复' }}
      </n-button>
    </div>
    <div class="mt-4">
      <div class="flex justify-between items-center mb-2">
        <h4 class="font-semibold text-gray-900">评论</h4>
        <!-- TODO: Change color -->
        <n-button text @click="toggleReplyOrder" class="text-blue-600 hover:text-blue-800">
          {{ reverseReplies ? '最新回复' : '最早回复' }}
        </n-button>
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
          <span class="text-sm text-gray-500 ml-2">
            #{{ reverseReplies ? review.reply.length - index : index + 1 }}
          </span>
        </div>
      </div>
    </div>
    <CourseReviewItemReply v-if="showReply" :review="review" @close="toggleReply" class="mt-4" />
  </div>
</template>

<script lang="ts" setup>
import { Review } from "@/types/courses"
import Render from "../../editor/Render.vue"
import { MilkdownProvider } from "@milkdown/vue"
import CourseReviewItemReply from "./CourseReviewItemReply.vue"
import { ref, computed } from "vue"
import Time from "@/components/shortcuts/Time.vue"
import { checkLoginStatus } from "@/lib/logins"
import { NButton } from 'naive-ui'

const props = defineProps<{
  review: Review,
}>()

// Display the reply box or not
const showReply = ref(false)

const toggleReply = () => {
  showReply.value = !showReply.value;
  // TODO:
}

const isLoggedIn = computed(() => checkLoginStatus())

const reverseReplies = ref(false)

const toggleReplyOrder = () => {
  reverseReplies.value = !reverseReplies.value
}
</script>

<style scoped></style>