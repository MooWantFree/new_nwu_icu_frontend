<template>
  <div class="flex items-center justify-between text-sm text-gray-500">
    <div class="flex items-center space-x-4">
      <!-- Dropdown Menu -->
      <div
        v-if="isAuthor"
        class="relative inline-block text-left"
        ref="dropdownMenuRef"
      >
        <button
          @click="toggleDropdownMenu"
          id="dropdownButton"
          type="button"
          class="inline-flex items-center p-2 text-sm font-medium text-gray-700 bg-white rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          aria-expanded="true"
          aria-haspopup="true"
        >
          <span class="sr-only">打开下拉菜单</span>
          <svg
            class="w-5 h-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"
            />
          </svg>
        </button>

        <div
          v-if="showDropdownMenu"
          id="dropdownMenu"
          class="z-50 origin-top-right absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="dropdownButton"
          tabindex="-1"
        >
          <div class="py-1" role="none">
            <button
              @click="handleEdit"
              class="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
              role="menuitem"
              tabindex="-1"
              id="editButton"
            >
              <svg
                class="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
                />
              </svg>
              编辑评价
            </button>
            <button
              @click="handleDelete"
              class="group flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-100 hover:text-red-900 w-full text-left"
              role="menuitem"
              tabindex="-1"
              id="deleteButton"
            >
              <svg
                class="mr-3 h-5 w-5 text-red-400 group-hover:text-red-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                />
              </svg>
              删除评价
            </button>
          </div>
        </div>
      </div>

      <div class="flex items-center space-x-2">
        <button
          @click="()=>{handleLikeNDislike(LikeOption.Like)}"
          :disabled="isLikeNDislikeButtonDisabled"
          :class="[
            'flex items-center px-3 py-1 rounded transition-colors text-sm',
            review.like.user_option === 1
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-blue-500 hover:text-white',
            isLikeNDislikeButtonDisabled ? 'opacity-50 cursor-not-allowed' : '',
          ]"
        >
          <ThumbsUpOutline class="w-4 h-4 mr-1 inline-block" />
          <span class="inline-block whitespace-nowrap">{{ review.like.like }}</span>
        </button>
        <button
          @click="()=>{handleLikeNDislike(LikeOption.Dislike)}"
          :disabled="isLikeNDislikeButtonDisabled"
          :class="[
            'flex items-center px-3 py-1 rounded transition-colors text-sm',
            review.like.user_option === -1
              ? 'bg-red-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-red-500 hover:text-white',
            isLikeNDislikeButtonDisabled ? 'opacity-50 cursor-not-allowed' : '',
          ]"
        >
          <ThumbsDownOutline class="w-4 h-4 mr-1" />
          <span>{{ review.like.dislike }}</span>
        </button>
      </div>
    </div>

    <div class="flex flex-col items-center space-x-2">
      <Time :time="new Date(review.created_time)" />
      <div v-if="review.edited">
        <span
          >(最后修改于: <Time :time="new Date(review.modified_time)" />)</span
        >
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Review } from '@/types/courses'
import { ref } from 'vue'
import { onClickOutside } from '@vueuse/core'
import Time from '@/components/tinyComponents/Time.vue'
import { useUser } from '@/lib/useUser'
import { useMessage } from 'naive-ui'
import { api } from '@/lib/requests'
import { ReplyLikeResponse } from '@/types/api/course'
import { ThumbsUpOutline, ThumbsDownOutline } from '@vicons/ionicons5'

const { review, isAuthor } = defineProps<{
  review: Review
  isAuthor: boolean
}>()

const emit = defineEmits<{
  (e: 'reviewEdit'): void
  (e: 'reviewDelete'): void
}>()

const dropdownMenuRef = ref(null)
const showDropdownMenu = ref(false)

onClickOutside(dropdownMenuRef, () => {
  showDropdownMenu.value = false
})

const toggleDropdownMenu = () => {
  showDropdownMenu.value = !showDropdownMenu.value
}

const handleEdit = () => {
  emit('reviewEdit')
  showDropdownMenu.value = false
}

const handleDelete = () => {
  emit('reviewDelete')
  showDropdownMenu.value = false
}

const isLikeNDislikeButtonDisabled = ref(false)
const { isLoggedIn } = useUser()
const message = useMessage()
enum LikeOption {
  Like = 1,
  Dislike = -1,
}
const handleLikeNDislike = async (likeValue: LikeOption) => {
  if (isLikeNDislikeButtonDisabled.value) return

  if (!isLoggedIn.value) {
    message.error('请先登录')
    return
  }

  isLikeNDislikeButtonDisabled.value = true

  const resp = await api.post<ReplyLikeResponse>(
    '/api/assessment/reply/like/',
    {
      review_id: review.id,
      reply_id: 0,
      like_or_dislike: likeValue,
    }
  )

  if (resp.status === 200) {
    review.like.dislike = resp.content.like.dislike
    review.like.like = resp.content.like.like
    if (review.like.user_option === likeValue) {
      review.like.user_option = 0
    } else {
      review.like.user_option = likeValue
    }
  } else {
    message.error(`${likeValue === 1 ? '认同' : '不认同'}失败，请稍后再试`)
  }

  isLikeNDislikeButtonDisabled.value = false
}
</script>
