<template>
  <div class="mt-4">
    <div
      class="flex justify-between items-center mb-2"
      v-if="review.reply && review.reply.length > 0"
    >
      <div class="flex items-center space-x-2">
        <h3 class="font-semibold text-gray-900 text-lg">评论</h3>
        <button
          v-if="isLoggedIn"
          @click="toggleReply(0)"
          class="text-blue-600 hover:text-blue-800 bg-transparent border-none cursor-pointer"
        >
          {{ showReply && replyTarget === 0 ? '取消回复' : '添加回复' }}
        </button>
      </div>

      <div>
        <span>排序：</span>
        <button
          @click="toggleReplyOrder"
          class="text-blue-600 hover:text-blue-800 bg-transparent border-none cursor-pointer"
        >
          {{ reverseReplies ? '最新回复' : '最早回复' }}
        </button>
      </div>
    </div>
    <div class="space-y-2">
      <div v-for="reply in orderedReplies" ref="replies" :key="reply.id">
        <div
          class="bg-gray-50 p-3 rounded-md flex justify-between items-start relative group"
          :data-reply-id="reply.id"
        >
          <div class="flex flex-1">
            <div class="flex flex-col flex-1">
              <div class="flex">
                <p class="text-sm text-gray-700 flex-1">
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
                    ?.created_by.id! > 0
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
                      @click="handleJmpClick(reply.parent, reply.id)"
                    >
                      #{{
                        orderedReplies.find((it) => it.id === reply.parent)
                          ?.floorNumber
                      }}
                    </button>
                    )
                  </span>
                  <span class="text-gray-800 break-all">
                    : {{ reply.content }}
                  </span>
                </p>
                <span class="text-sm text-gray-500 ml-4"
                >#{{ reply.floor_number }}</span
                >
              </div>
              <div>
                <div class="flex text-xs text-gray-500 mt-3">
                  <Time type="relative" :time="new Date(reply.created_time)" />
                  <div class="flex-grow"></div>
                  <button
                    v-if="isLoggedIn && reply.created_by.id === userInfo?.id  && !reply.is_deleted"
                    @click="() => handleDeleteReply(reply.id)"
                    class=""
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 32 32"
                      class="inline-block w-4 h-4"
                    >
                      <path d="M12 12h2v12h-2z" fill="currentColor"></path>
                      <path d="M18 12h2v12h-2z" fill="currentColor"></path>
                      <path
                        d="M4 6v2h2v20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8h2V6zm4 22V8h16v20z"
                        fill="currentColor"
                      ></path>
                      <path d="M12 2h8v2h-8z" fill="currentColor"></path>
                    </svg>
                    <span>删除</span>
                  </button>
                  <p>&nbsp;&nbsp;</p>
                  <button
                    v-if="isLoggedIn && !reply.is_deleted"
                    @click="() => toggleReply(reply.id)"
                    class=""
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      class="inline-block w-4 h-4"
                    >
                      <g fill="none">
                        <path
                          d="M10.48 13.842h4.92c.896 0 1.6-.713 1.6-1.566v-6.71C17 4.713 16.296 4 15.4 4H4.6C3.704 4 3 4.713 3 5.566v6.71c0 .853.704 1.566 1.6 1.566h1.6V17h.003l.002-.001l4.276-3.157zM6.8 17.803a1.009 1.009 0 0 1-1.4-.199a.978.978 0 0 1-.199-.59v-2.172h-.6c-1.436 0-2.6-1.149-2.6-2.566v-6.71C2 4.149 3.164 3 4.6 3h10.8C16.836 3 18 4.149 18 5.566v6.71c0 1.418-1.164 2.566-2.6 2.566h-4.59l-4.011 2.961z"
                          fill="currentColor"
                        ></path>
                      </g>
                    </svg>
                    <span
                      v-if="
                        replyTarget === reply.id &&
                        showReply &&
                        formerReplyTarget != 0
                      "
                      class="font-black underline underline-offset-1"
                    >取消</span
                    >
                    <span v-else>回复</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <!-- Jump Back Button -->
          <div
            class="absolute -right-12 sm:-right-36 top-0 w-12 sm:w-36 h-12 bg-gray-50 overflow-hidden rounded-r-lg border border-gray-200"
            v-if="
              jumpHistory.length > 0 &&
              jumpHistory[jumpHistory.length - 1].to === reply.id
            "
            @click="handleJmpBackClick"
          >
            <button
              class="absolute inset-0 flex items-center justify-center w-full h-full text-sm font-medium text-blue-600 bg-white bg-opacity-90 hover:bg-opacity-100 hover:text-blue-800 transition-all duration-300 rounded-r-lg shadow-md group-hover:shadow-lg"
            >
              <svg
                class="w-4 h-4 sm:mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                ></path>
              </svg>
              <span class="hidden sm:inline">
                (#{{
                  orderedReplies.find(
                    (it) => it.id === jumpHistory[jumpHistory.length - 1].from,
                  )?.floorNumber
                }})
              </span>
            </button>
          </div>
        </div>
        <ReviewReplyInput
          ref="replyTextArea"
          v-if="isLoggedIn && showReply && replyTarget === reply.id"
          :review="review"
          :reply-to="replyTarget"
          :reply-target-floor="
            orderedReplies.find((it) => it.id === replyTarget)?.floorNumber
          "
          @close="toggleReply"
          class="mt-4"
          @replySubmitted="onReplySubmitted"
        />
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
      {{ showReply && formerReplyTarget == 0 ? '取消回复' : '回复' }}
    </n-button>
    <span v-else> 登录以后才能回复 </span>
  </div>
  <ReviewReplyInput
    ref="replyTextArea"
    v-if="isLoggedIn && showReply && replyTarget === 0"
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
import { Review } from '@/types/courseReview'
import { computed, nextTick, onMounted, ref, useTemplateRef } from 'vue'
import { useMessage } from 'naive-ui'
import { api } from '@/lib/requests'
import ReviewReplyInput from './ReviewReplyInput.vue'
import Time from '@/components/tinyComponents/Time.vue'
import { useRoute } from 'vue-router'

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
const formerReplyTarget = ref(0)
const replyTextArea = useTemplateRef('replyTextArea')
const toggleReply = (replyTo: number = 0) => {
  replyTarget.value = replyTo
  if (replyTo !== 0) {
    if (!showReply.value) {
      showReply.value = !showReply.value
    } else {
      if (replyTo === formerReplyTarget.value) {
        showReply.value = !showReply.value
      }
    }
  } else {
    if (formerReplyTarget.value !== 0) {
      showReply.value = true
    } else {
      showReply.value = !showReply.value
    }
  }
  if (showReply.value) {
    nextTick(() => {
      if (replyTextArea.value && 'focus' in replyTextArea.value) {
        replyTextArea.value.focus()
      }
    })
  }
  formerReplyTarget.value = replyTo
}

const reverseReplies = ref(false)

const handleDeleteReply = async (repyId: number) => {
  if (confirm(`你确定要删掉这条回复吗？！`)) {
    try {
      const resp = await api.delete({
        url: '/api/assessment/reply/',
        query: {
          reply_id: repyId,
          review_id: review.id,
        },
      })
      if (resp.status === 200) {
        message.success('回复已成功删除')
        emit('replyDeleted', review.id, repyId)
      } else {
        throw new Error(
          resp.errors?.reduce(
            (acc, cur) => acc + cur.field + ': ' + cur.err_msg + '\n',
            '',
          ),
        )
      }
    } catch (error) {
      console.error('Error deleting reply:', error)
      message.error('删除回复失败，请稍后重试\n' + error)
    }
  }
}

const route = useRoute()


onMounted(async () => {
  await nextTick()
  const hash = route.hash
  if (hash && hash.includes('reply-')) {
    const replyId = parseInt(hash.split('-')[1])
    handleJmpClick(replyId)
  }
})

const repliesRefs = useTemplateRef('replies')
const jumpHistory = ref<{ from: number; to: number }[]>([]) // Now stores reply IDs instead of floor numbers

const handleJmp = async (targetElement: HTMLElement) => {
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
      'scale-110',
    )
    setTimeout(() => {
      targetElement.classList.remove('scale-110')
      targetElement.classList.add('scale-100')
    }, 300)
    setTimeout(() => {
      targetElement.classList.remove(
        'transition-transform',
        'duration-300',
        'scale-100',
      )
    }, 600)
  }
}

const handleJmpClick = async (
  targetReplyId: number,
  currentReplyId?: number,
) => {
  if (repliesRefs.value) {
    const domElements = Array.from(repliesRefs.value)
    const targetElement = domElements.find(el =>
      el.querySelector(`[data-reply-id="${targetReplyId}"]`),
    )

    if (targetElement) {
      if (currentReplyId != null) {
        if (jumpHistory.value.length > 0 && currentReplyId != jumpHistory.value[jumpHistory.value.length - 1].to) {
          jumpHistory.value = []
        }
        jumpHistory.value.push({ from: currentReplyId, to: targetReplyId })
      }
      handleJmp(targetElement.querySelector(`[data-reply-id="${targetReplyId}"]`))
    }
  }
}

const handleJmpBackClick = () => {
  if (jumpHistory.value.length > 0) {
    const previousReplyInfo = jumpHistory.value.pop()
    if (previousReplyInfo !== undefined) {
      const domElements = Array.from(repliesRefs.value)
      const targetElement = domElements.find(el =>
        el.querySelector(`[data-reply-id="${previousReplyInfo.from}"]`),
      )

      if (targetElement) {
        handleJmp(targetElement.querySelector(`[data-reply-id="${previousReplyInfo.from}"]`))
      }
    }
  }
}

const toggleReplyOrder = () => {
  reverseReplies.value = !reverseReplies.value
}

const orderedReplies = computed(() => {
  const replies = [...review.reply].map((it) => {
    return {
      ...it,
      floorNumber: it.floor_number,
    }
  })

  replies.sort((a, b) => {
    const timeA = new Date(a.created_time).getTime()
    const timeB = new Date(b.created_time).getTime()
    return reverseReplies.value ? timeB - timeA : timeA - timeB
  })

  return replies
})

const { userInfo, isLoggedIn } = useUser()
const onReplySubmitted = async (
  content: string,
  parent: number,
  replyId: number,
) => {
  showReply.value = false
  replyTarget.value = 0
  formerReplyTarget.value = 0
  if (!userInfo.value) return

  const maxFloorNumber = review.reply.reduce((max, reply) =>
    Math.max(max, reply.floor_number || 0), 0)
  const newFloorNumber = maxFloorNumber + 1

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
    floor_number: newFloorNumber,
    like: {
      like: 0,
      dislike: 0,
      user_option: 0,
    },
  })
  await nextTick()
  await handleJmpClick(replyId, parent)
}
</script>
