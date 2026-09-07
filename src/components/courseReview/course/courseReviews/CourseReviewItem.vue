<template>
  <article class="min-w-0">
    <div ref="courseReviewItem">
      <ReviewHeader
        :review="review"
        :is-author="isAuthor"
        @review-edit="handleEdit"
        @review-delete="handleDeleteReview"
      />
      <ReviewContent :review="review" />
      <ReviewBottom :review="review" />
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
let clearFocusTimer: number | undefined
let cleanupFocusTimer: number | undefined

const focusReview = () => {
  const element = courseReviewItem.value
  if (!element) return

  if (clearFocusTimer) window.clearTimeout(clearFocusTimer)
  if (cleanupFocusTimer) window.clearTimeout(cleanupFocusTimer)

  element.classList.add(
    'rounded-lg',
    'bg-blue-50/70',
    'ring-2',
    'ring-blue-200',
    'ring-offset-2',
    'transition-all',
    'duration-500',
    'ease-out'
  )
  clearFocusTimer = window.setTimeout(() => {
    element.classList.remove('bg-blue-50/70', 'ring-2', 'ring-blue-200', 'ring-offset-2')
  }, 1600)
  cleanupFocusTimer = window.setTimeout(() => {
    element.classList.remove('rounded-lg', 'transition-all', 'duration-500', 'ease-out')
  }, 2200)
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
  if (clearFocusTimer) window.clearTimeout(clearFocusTimer)
  if (cleanupFocusTimer) window.clearTimeout(cleanupFocusTimer)
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
