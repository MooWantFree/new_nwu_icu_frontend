<template>
  <div class="bg-gray-100 rounded-lg shadow-md p-6">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="text-xl font-bold text-gray-900">{{ review.author.name ?? "匿名用户" }}</h3>
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
      <Viewer :value="review.content" />
    </div>
    <div class="flex items-center justify-between text-sm text-gray-500">
      <!-- Dropdown Menu -->
      <div v-if="isAuthor" class="relative inline-block text-left" ref="dropdownMenu">
        <button @click="toggleDropdownMenu" id="dropdownButton" type="button"
          class="inline-flex items-center p-2 text-sm font-medium text-gray-700 bg-white rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          aria-expanded="true" aria-haspopup="true">
          <span class="sr-only">打开下拉菜单</span>
          <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
            aria-hidden="true">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>

        <div v-if="showDropdownMenu" id="dropdownMenu"
          class=" origin-top-right absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none"
          role="menu" aria-orientation="vertical" aria-labelledby="dropdownButton" tabindex="-1">
          <div class="py-1" role="none">
            <button @click="handleEdit"
              class="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
              role="menuitem" tabindex="-1" id="editButton">
              <svg class="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              编辑评价
            </button>
            <button @click="handleDelete"
              class="group flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-100 hover:text-red-900 w-full text-left"
              role="menuitem" tabindex="-1" id="deleteButton">
              <svg class="mr-3 h-5 w-5 text-red-400 group-hover:text-red-500" xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clip-rule="evenodd" />
              </svg>
              删除评价
            </button>
          </div>
        </div>
      </div>
      <!-- <n-button v-if="isAuthor" type="error" size="small" @click="handleDelete" class="mr-auto">
        删除评价
      </n-button> -->
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
        <div v-for="(reply, index) in (reverseReplies ? [...review.reply].reverse() : review.reply)"
          :key="reply.created_time" class="bg-gray-50 p-3 rounded-md flex justify-between items-start">
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
    <CourseReviewItemReply v-if="isLoggedIn && showReply" :review="review" @close="toggleReply" class="mt-4"
      @replySubmitted="onReplySubmitted" />
  </div>
</template>

<script lang="ts" setup>
import { Review } from "@/types/courses"
import CourseReviewItemReply from "./CourseReviewItemReply.vue"
import { onUnmounted, ref } from "vue"
import Time from "@/components/shortcuts/Time.vue"
import { NButton, useMessage } from 'naive-ui'
import Viewer from "@/components/tiptap/viewer/Viewer.vue"
import { useUser } from "@/lib/useUser"
import { api } from "@/lib/requests"
import { computed } from "vue"
import { watch } from "vue"
import { useTemplateRef } from "vue"

const props = defineProps<{
  review: Review,
}>()

const emit = defineEmits<{
  (e: 'reviewDeleted', id: number): void,
  (e: 'reviewEdit'): void,
}>()

const message = useMessage()

// Display the reply box or not
const showReply = ref(false)
const isAuthor = computed(() => {
  return props.review.author.id === userInfo.value.id
})

const toggleReply = () => {
  showReply.value = !showReply.value;
  // TODO:
}

const reverseReplies = ref(false)

const toggleReplyOrder = () => {
  reverseReplies.value = !reverseReplies.value
}

const { userInfo, isLoggedIn } = useUser()
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

// Dropdown menu
const dropdownMenuRef = useTemplateRef('dropdownMenu')
const showDropdownMenu = ref(false)
const toggleDropdownMenu = () => {
  handleDropdownMenuOpened()
  showDropdownMenu.value = !showDropdownMenu.value
}
const handleClickEvent = (e: MouseEvent) => {
  if (dropdownMenuRef && !dropdownMenuRef.value.contains(e.target as Node)) {
    showDropdownMenu.value = false
  }
}
const handleDropdownMenuClosed = () => {
  document.removeEventListener('click', handleClickEvent)
}
const handleDropdownMenuOpened = () => {
  document.addEventListener('click', handleClickEvent)
}
onUnmounted(() => {
  document.removeEventListener('click', handleClickEvent)
})
watch(showDropdownMenu, (newValue) => {
  if (!newValue) {
    handleDropdownMenuClosed()
  }
})

const handleEdit = () => {
  emit('reviewEdit')
  showDropdownMenu.value = false
}

const handleDelete = async () => {
  if (confirm('你确定你想要删除这条评价吗？删除以后不可恢复！')) {
    try {
      const response = await api.delete(`/api/assessment/review/${props.review.id}`)
      if (response.status === 200) {
        message.success('评价已成功删除')
        emit('reviewDeleted', props.review.id)
      } else {
        throw new Error(response.errors.reduce((acc, cur) => acc + cur.field + ': ' + cur.err_msg + '\n', ''))
      }
    } catch (error) {
      console.error('Error deleting review:', error)
      message.error('删除评价失败，请稍后重试\n' + error)
    }
  }
}
</script>

<style scoped></style>