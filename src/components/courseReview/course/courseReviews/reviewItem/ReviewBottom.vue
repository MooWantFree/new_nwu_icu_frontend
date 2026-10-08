<template>
  <div class="mt-4 flex flex-wrap items-center border-t border-zinc-100 pt-3 text-sm text-zinc-500">
      <div class="flex items-center space-x-2">
        <button
          type="button"
          aria-label="认同评价"
          :aria-pressed="review.like.user_option === 1"
          @click="
            () => {
              handleLikeNDislike(LikeOption.Like)
            }
          "
          :disabled="isLikeNDislikeButtonDisabled"
          :class="[
            'inline-flex min-h-9 items-center gap-1.5 rounded-md border px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2',
            review.like.user_option === 1
              ? 'border-zinc-950 bg-zinc-950 text-white'
              : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950',
            isLikeNDislikeButtonDisabled ? 'opacity-50 cursor-not-allowed' : '',
          ]"
        >
          <ThumbsUp class="h-3.5 w-3.5" aria-hidden="true" />
          <span class="inline-block whitespace-nowrap">{{
            review.like.like
          }}</span>
        </button>
        <button
          type="button"
          aria-label="不认同评价"
          :aria-pressed="review.like.user_option === -1"
          @click="
            () => {
              handleLikeNDislike(LikeOption.Dislike)
            }
          "
          :disabled="isLikeNDislikeButtonDisabled"
          :class="[
            'inline-flex min-h-9 items-center gap-1.5 rounded-md border px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2',
            review.like.user_option === -1
              ? 'border-zinc-950 bg-zinc-950 text-white'
              : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950',
            isLikeNDislikeButtonDisabled ? 'opacity-50 cursor-not-allowed' : '',
          ]"
        >
          <ThumbsDown class="h-3.5 w-3.5" aria-hidden="true" />
          <span>{{ review.like.dislike }}</span>
        </button>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useUser } from '@/lib/useUser'
import { useShadcnToast } from '@/lib/useShadcnToast'
import { api } from '@/lib/requests'
import { ThumbsUp, ThumbsDown } from 'lucide-vue-next'
import { Review } from '@/types/courseReview'

const { review } = defineProps<{
  review: Review
}>()

const isLikeNDislikeButtonDisabled = ref(false)
const { isLoggedIn } = useUser()
const message = useShadcnToast()
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
