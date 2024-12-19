<template>
  <div class="mt-4">
    <div
      class="flex justify-between items-center mb-2"
      v-if="review.reply && review.reply.length > 0"
    >
      <h3 class="font-semibold text-gray-900 text-lg">评论</h3>
      <!-- TODO: Change color -->
      <div>
        <span>排序：</span>
        <n-button
          text
          @click="toggleReplyOrder"
          class="text-blue-600 hover:text-blue-800"
        >
          {{ reverseReplies ? '最新回复' : '最早回复' }}
        </n-button>
      </div>
    </div>
    <div class="space-y-2">
      <div
        v-for="(reply, index) in orderedReplies"
        ref="replies"
        :key="reply.id"
        :data-id="reply.id"
        class="bg-gray-50 p-3 rounded-md flex justify-between items-start relative group"
      >
        <div>
          <p class="text-sm text-gray-700">
            <span>
              <router-link
                v-if="reply.created_by.id > 0"
                :to="`/user/${reply.created_by.id}`"
                class="text-blue-600 hover:underline"
              >
                {{ reply.created_by.name }}
              </router-link>
              <span v-else>
                {{ reply.created_by.name }}
              </span>
            </span>
            <span v-if="reply.parent > 0">
              回复了
              <router-link
                v-if="
                  orderedReplies.find((it) => it.id === reply.parent)
                    ?.created_by.id > 0
                "
                :to="`/user/${
                  orderedReplies.find((it) => it.id === reply.parent)
                    ?.created_by.id
                }`"
                class="text-blue-600 hover:underline"
              >
                {{
                  orderedReplies.find((it) => it.id === reply.parent)
                    ?.created_by.name
                }}
              </router-link>
              (
              <button
                class="text-blue-600 hover:underline"
                @click="handleJmpClick(reply.parent)"
              >
                #{{
                  orderedReplies.find((it) => it.id === reply.parent)
                    ?.floorNumber
                }}
              </button>
              )
            </span>
            <span class="text-gray-800 break-words whitespace-normal">
              : {{ reply.content }}
            </span>
          </p>
          <p class="text-xs text-gray-500 mt-1">
            <Time type="relative" :time="new Date(reply.created_time)" />
            &nbsp;
            <button
              v-if="isLoggedIn && reply.created_by.id === userInfo.id"
              text
              @click="() => handleDeleteReply(reply.id)"
              class="absolute text-sm text-red-600 hover:text-red-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pl-2 whitespace-nowrap"
            >
              删除
            </button>
          </p>
        </div>
        <div v-if="isLoggedIn" class="relative mx-1 z-50">
          <span
            class="text-sm text-gray-500 ml-2 transition-opacity duration-300 group-hover:opacity-0"
          >
            #{{ reply.floorNumber }}
          </span>
          <button
            @click="() => toggleReply(reply.id)"
            class="absolute top-0 right-0 text-sm text-blue-600 hover:text-blue-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pl-2 whitespace-nowrap"
          >
            回复
          </button>
        </div>
        <span v-else class="text-sm text-gray-500 ml-2">
          #{{ reply.floorNumber }}
        </span>
      </div>
    </div>
  </div>
  <div class="flex justify-end mt-2 mx-2">
    <n-button
      v-if="isLoggedIn"
      text
      @click="() => toggleReply()"
      class="text-blue-600 hover:text-blue-800"
    >
      {{ showReply ? '取消回复' : '回复' }}
    </n-button>
    <span v-else> 登录以后才能回复 </span>
  </div>
  <ReviewReplyInput
    ref="replyTextArea"
    v-if="isLoggedIn && showReply"
    :review="review"
    :reply-to="replyTarget"
    :reply-target-floor="
      orderedReplies.find((it) => it.id === replyTarget)?.floorNumber
    "
    @close="toggleReply"
    class="mt-4"
    @replySubmitted="onReplySubmitted"
  />
  <template></template>
</template>

<script lang="ts" setup>
import { useUser } from '@/lib/useUser'
import { Review } from '@/types/courses'
import { computed } from 'vue'
import { useTemplateRef } from 'vue'
import { ref } from 'vue'
import { nextTick } from 'vue'
import { useMessage } from 'naive-ui'
import { api } from '@/lib/requests'
import ReviewReplyInput from './ReviewReplyInput.vue'

const { review } = defineProps<{
  review: Review
}>()

const emit = defineEmits<{
  (e: 'replyDeleted', reviewId: number, replyId: number): void
}>()

const message = useMessage()

// Display the reply box or not
const showReply = ref(false)

const replyTarget = ref(0)
const replyTextArea = useTemplateRef('replyTextArea')
const toggleReply = (replyTo: number = 0) => {
  replyTarget.value = replyTo
  if (replyTo !== 0) {
    if (!showReply.value) {
      showReply.value = !showReply.value
    }
  } else {
    showReply.value = !showReply.value
  }
  if (showReply.value) {
    nextTick(() => {
      replyTextArea.value?.focus()
    })
  }
}

const reverseReplies = ref(false)

const handleDeleteReply = async (repyId: number) => {
  if (confirm(`你确定要删掉这条回复吗？！`)) {
    try {
      const resp = await api.delete('/api/assessment/reply/', {
        reply_id: repyId,
        review_id: review.id,
      })
      if (resp.status === 200) {
        message.success('回复已成功删除')
        emit('replyDeleted', review.id, repyId)
      } else {
        throw new Error(
          resp.errors.reduce(
            (acc, cur) => acc + cur.field + ': ' + cur.err_msg + '\n',
            ''
          )
        )
      }
    } catch (error) {
      console.error('Error deleting reply:', error)
      message.error('删除回复失败，请稍后重试\n' + error)
    }
  }
}

const repliesRefs = useTemplateRef('replies')

const handleJmpClick = async (targetReplyId: number) => {
  if (repliesRefs.value) {
    const targetElement = repliesRefs.value.find(
      (el) => el.getAttribute('data-id') === targetReplyId.toString()
    )
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      await new Promise<void>((resolve) => {
        const observer = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting) {
            observer.disconnect()
            resolve()
          }
        })
        observer.observe(targetElement)
      })
      // await the element to be in the viewport
      await new Promise((resolve) => setTimeout(resolve, 200))

      await nextTick()

      targetElement.classList.add(
        'transition-transform',
        'duration-300',
        'scale-110'
      )
      setTimeout(() => {
        targetElement.classList.remove('scale-110')
        targetElement.classList.add('scale-100')
      }, 300)
      setTimeout(() => {
        targetElement.classList.remove(
          'transition-transform',
          'duration-300',
          'scale-100'
        )
      }, 600)
    }
  }
}

const toggleReplyOrder = () => {
  reverseReplies.value = !reverseReplies.value
}

const orderedReplies = computed(() => {
  const replies = [...review.reply].reverse().map((it, index) => {
    return {
      ...it,
      floorNumber: index + 1,
    }
  })

  return reverseReplies.value ? replies.reverse() : replies
})

const { userInfo, isLoggedIn } = useUser()
const onReplySubmitted = (content: string, parent: number, replyId: number) => {
  toggleReply()
  // Push the new reply to the review's replies array
  review.reply.unshift({
    id: replyId,
    parent,
    content,
    created_time: new Date().toISOString(),
    created_by: {
      id: userInfo.value.id,
      name: userInfo.value.nickname ?? userInfo.value.username,
      avatar: userInfo.value.avatar,
    },
    like: {
      like: 0,
      dislike: 0,
      user_option: 0,
    },
  })
}
</script>
