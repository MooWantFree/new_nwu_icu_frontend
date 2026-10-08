<template>
  <div class="mt-3 flex flex-wrap items-center gap-1 text-sm text-zinc-500">
    <template v-if="!review.is_deleted">
      <button
        type="button"
        aria-label="认同评价"
        :aria-pressed="review.like.user_option === 1"
        :disabled="isLikeNDislikeButtonDisabled"
        :class="[actionClass, review.like.user_option === 1 ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950']"
        @click="handleLikeNDislike(LikeOption.Like)"
      >
        <ThumbsUp class="h-4 w-4" aria-hidden="true" />
        <span>{{ review.like.like }}</span>
      </button>
      <button
        type="button"
        aria-label="不认同评价"
        :aria-pressed="review.like.user_option === -1"
        :disabled="isLikeNDislikeButtonDisabled"
        :class="[actionClass, review.like.user_option === -1 ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950']"
        @click="handleLikeNDislike(LikeOption.Dislike)"
      >
        <ThumbsDown class="h-4 w-4" aria-hidden="true" />
        <span>{{ review.like.dislike }}</span>
      </button>
    </template>
    <button
      type="button"
      :aria-label="replyExpanded ? '收起评价回复' : '展开评价回复'"
      :aria-expanded="replyExpanded"
      :aria-controls="`review-replies-${review.id}`"
      :class="[actionClass, replyExpanded ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950']"
      @click="emit('toggleReplies')"
    >
      <MessageCircle class="h-4 w-4" aria-hidden="true" />
      <span>{{ replyExpanded ? '收起回复' : '回复' }}</span>
      <span v-if="review.reply_count > 0">{{ review.reply_count }}</span>
      <ChevronDown class="h-3.5 w-3.5 transition-transform" :class="replyExpanded ? 'rotate-180' : ''" aria-hidden="true" />
    </button>
    <div v-if="isAuthor && !review.is_deleted" class="ml-auto">
      <ReviewActions :review-id="review.id" @review-edit="emit('reviewEdit')" @review-delete="emit('reviewDelete')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useUser } from '@/lib/useUser'
import { useShadcnToast } from '@/lib/useShadcnToast'
import { api } from '@/lib/requests'
import { ChevronDown, MessageCircle, ThumbsUp, ThumbsDown } from 'lucide-vue-next'
import type { Review } from '@/types/courseReview'
import ReviewActions from './ReviewActions.vue'

const { review, isAuthor = false, replyExpanded = false } = defineProps<{
  review: Review
  isAuthor?: boolean
  replyExpanded?: boolean
}>()
const emit = defineEmits<{
  (event: 'toggleReplies' | 'reviewEdit' | 'reviewDelete'): void
}>()
const actionClass = 'inline-flex min-h-10 items-center gap-1.5 rounded-md px-2.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
const isLikeNDislikeButtonDisabled = ref(false)
const { isLoggedIn } = useUser()
const message = useShadcnToast()
enum LikeOption { Like = '1', Dislike = '-1' }

const handleLikeNDislike = async (likeValue: LikeOption) => {
  if (isLikeNDislikeButtonDisabled.value) return
  if (!isLoggedIn.value) {
    message.error('请先登录')
    return
  }
  isLikeNDislikeButtonDisabled.value = true
  try {
    const resp = await api.post({
      url: '/api/assessment/reply/like/',
      query: { review_id: review.id, reply_id: 0, like_or_dislike: likeValue },
    })
    if (resp.status !== 200) throw new Error('评价投票失败')
    review.like.dislike = resp.content.like.dislike
    review.like.like = resp.content.like.like
    review.like.user_option = review.like.user_option.toString() === likeValue ? 0 : Number(likeValue)
  } catch {
    message.error(`${likeValue === '1' ? '认同' : '不认同'}失败，请稍后再试`)
  } finally {
    isLikeNDislikeButtonDisabled.value = false
  }
}
</script>
