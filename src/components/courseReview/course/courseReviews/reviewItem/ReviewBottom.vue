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
          <EllipsisVertical class="w-5 h-5" />
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
              <Pencil class="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
              编辑评价
            </button>
            <button
              @click="handleDelete"
              class="group flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-100 hover:text-red-900 w-full text-left"
              role="menuitem"
              tabindex="-1"
              id="deleteButton"
            >
              <Trash2 class="mr-3 h-5 w-5 text-red-400 group-hover:text-red-500" />
              删除评价
            </button>
          </div>
        </div>
      </div>

      <div class="flex items-center space-x-2">
        <button
          @click="
            () => {
              handleLikeNDislike(LikeOption.Like)
            }
          "
          :disabled="isLikeNDislikeButtonDisabled"
          :class="[
            'flex items-center px-3 py-1 rounded transition-colors text-sm',
            review.like.user_option === 1
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-blue-500 hover:text-white',
            isLikeNDislikeButtonDisabled ? 'opacity-50 cursor-not-allowed' : '',
          ]"
        >
          <ThumbsUp class="w-4 h-4 mr-1 inline-block" />
          <span class="inline-block whitespace-nowrap">{{
            review.like.like
          }}</span>
        </button>
        <button
          @click="
            () => {
              handleLikeNDislike(LikeOption.Dislike)
            }
          "
          :disabled="isLikeNDislikeButtonDisabled"
          :class="[
            'flex items-center px-3 py-1 rounded transition-colors text-sm',
            review.like.user_option === -1
              ? 'bg-red-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-red-500 hover:text-white',
            isLikeNDislikeButtonDisabled ? 'opacity-50 cursor-not-allowed' : '',
          ]"
        >
          <ThumbsDown class="w-4 h-4 mr-1" />
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
import { ref } from 'vue'
import { onClickOutside } from '@vueuse/core'
import Time from '@/components/tinyComponents/Time.vue'
import { useUser } from '@/lib/useUser'
import { useMessage } from 'naive-ui'
import { api } from '@/lib/requests'
import { ThumbsUp, ThumbsDown, EllipsisVertical, Pencil, Trash2 } from 'lucide-vue-next'
import { Review } from '@/types/courseReview'

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
  Like = '1',
  Dislike = '-1',
}
const handleLikeNDislike = async (likeValue: LikeOption) => {
  if (isLikeNDislikeButtonDisabled.value) return

  if (!isLoggedIn.value) {
    message.error('请先登录')
    return
  }

  isLikeNDislikeButtonDisabled.value = true

  const resp = await api.post({
    url: '/api/assessment/reply/like/',
    query: {
      review_id: review.id,
      reply_id: 0,
      like_or_dislike: likeValue,
    },
  })

  if (resp.status === 200) {
    review.like.dislike = resp.content.like.dislike
    review.like.like = resp.content.like.like
    if (review.like.user_option.toString() === likeValue) {
      review.like.user_option = 0
    } else {
      review.like.user_option = parseInt(likeValue)
    }
  } else {
    message.error(`${likeValue === '1' ? '认同' : '不认同'}失败，请稍后再试`)
  }

  isLikeNDislikeButtonDisabled.value = false
}
</script>
