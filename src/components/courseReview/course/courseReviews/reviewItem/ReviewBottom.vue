<template>
  <div class="flex items-center pt-3 text-sm text-slate-500">
      <div class="flex items-center space-x-2">
        <button
          @click="
            () => {
              handleLikeNDislike(LikeOption.Like)
            }
          "
          :disabled="isLikeNDislikeButtonDisabled"
          :class="[
            'flex min-h-9 items-center rounded-lg border px-3 py-1 transition-colors text-sm',
            review.like.user_option === 1
              ? 'bg-blue-600 text-white'
              : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700',
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
            'flex min-h-9 items-center rounded-lg border px-3 py-1 transition-colors text-sm',
            review.like.user_option === -1
              ? 'bg-red-600 text-white'
              : 'border-slate-200 bg-white text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700',
            isLikeNDislikeButtonDisabled ? 'opacity-50 cursor-not-allowed' : '',
          ]"
        >
          <ThumbsDown class="w-4 h-4 mr-1" />
          <span>{{ review.like.dislike }}</span>
        </button>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useUser } from '@/lib/useUser'
import { useMessage } from 'naive-ui'
import { api } from '@/lib/requests'
import { ThumbsUp, ThumbsDown } from 'lucide-vue-next'
import { Review } from '@/types/courseReview'

const { review } = defineProps<{
  review: Review
}>()

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
