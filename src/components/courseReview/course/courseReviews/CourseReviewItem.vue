<template>
  <article class="min-w-0">
    <div ref="courseReviewItem">
      <div v-if="review.is_deleted" class="mb-5 flex items-center gap-3 text-slate-500">
        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100" aria-hidden="true">×</div>
        <span class="font-medium">内容已被删除</span>
      </div>
      <ReviewHeader
        v-else
        :review="review"
        :is-author="isAuthor"
        @review-edit="handleEdit"
        @review-delete="handleDeleteReview"
      />
      <ReviewContent v-if="!review.is_deleted" :review="review" />
      <ReviewBottom v-if="!review.is_deleted" :review="review" />
    </div>
    <ReviewReplies :review="review" @reply-deleted="handleReplyDeleted" />
  </article>
</template>

<script lang="ts" setup>
import { Review } from '@/types/courseReview'
import {
  onMounted,
  onUnmounted,
  computed,
  useTemplateRef,
  nextTick,
} from 'vue'
import { useRoute } from 'vue-router'
import { useMessage, useDialog } from 'naive-ui'
import { useUser } from '@/lib/useUser'
import { api } from '@/lib/requests'
import { focusCourseReviewTarget } from '@/lib/focusCourseReviewTarget'
import ReviewHeader from './reviewItem/ReviewHeader.vue'
import ReviewContent from './reviewItem/ReviewContent.vue'
import ReviewBottom from './reviewItem/ReviewBottom.vue'
import ReviewReplies from './reviewItem/ReviewReplies.vue'

const { review } = defineProps<{
  review: Review
}>()

const emit = defineEmits<{
  (e: 'reviewDeleted', id: number): void
  (e: 'reviewEdit'): void
  (e: 'replyDeleted', reviewId: number, replyId: number): void
}>()

const message = useMessage()
const dialog = useDialog()
const route = useRoute()
const { userInfo } = useUser()
const courseReviewItem = useTemplateRef('courseReviewItem')
let stopFocusAnimation: (() => void) | undefined

const focusReview = () => {
  const element = courseReviewItem.value
  if (!element) return

  stopFocusAnimation?.()
  stopFocusAnimation = focusCourseReviewTarget(element)
}

// Scroll if has hash
onMounted(async () => {
  const hash = route.hash
  if (hash && hash.includes(`review-${review.id}`)) {
    await nextTick()
    if (courseReviewItem.value) {
      courseReviewItem.value.scrollIntoView({ behavior: 'smooth', block: 'center' })
      focusReview()
    }
  }
})

onUnmounted(() => {
  stopFocusAnimation?.()
})

const handleEdit = () => {
  emit('reviewEdit')
}

const handleDeleteReview = () => {
  dialog.warning({
    title: '确认删除',
    content: '你确定你想要删除这条评价吗？删除以后不可恢复！',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const response = await api.delete({
          url: '/api/assessment/review/',
          query: {
            review_id: review.id,
          },
        })
        if (response.status === 200) {
          message.success('评价已成功删除')
          emit('reviewDeleted', review.id)
        } else {
          throw new Error(
            response.errors?.reduce(
              (acc, cur) => acc + cur.field + ': ' + cur.err_msg + '\n',
              ''
            )
          )
        }
      } catch (error) {
        console.error('Error deleting review:', error)
        message.error('删除评价失败，请稍后重试\n' + error)
      }
    },
  })
}

const isAuthor = computed(() => review.author.id === userInfo.value?.id)

const handleReplyDeleted = (reviewId: number, replyId: number) => {
  emit('replyDeleted', reviewId, replyId)
}
</script>
