<template>
  <div class="bg-gray-100 rounded-lg shadow-md p-6" ref="courseReviewItem">
    <ReviewHeader :review="review" :is-author="isAuthor" />
    <ReviewContent :review="review" />
    <ReviewBottom
      :review="review"
      :is-author="isAuthor"
      @review-edit="handleEdit"
      @review-delete="handleDeleteReview"
    />
    <ReviewReplies :review="review" @reply-deleted="handleReplyDeleted" />
  </div>
</template>

<script lang="ts" setup>
import { Review } from '@/types/courseReview'
import {
  onMounted,
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

// Scroll if has hash
onMounted(async () => {
  const hash = route.hash
  if (hash && hash.includes(`review-${review.id}`)) {
    await nextTick()
    if (courseReviewItem.value) {
      const scrollPromise = new Promise((resolve) => {
        const scrollEndHandler = () => {
          window.removeEventListener('scrollend', scrollEndHandler)
          resolve(null)
        }
        window.addEventListener('scrollend', scrollEndHandler)
      })
      courseReviewItem.value.scrollIntoView({ behavior: 'smooth' })
      await scrollPromise
      courseReviewItem.value.classList.add(
        'transition-transform',
        'duration-300',
        'scale-110'
      )
      setTimeout(() => {
        courseReviewItem.value?.classList.remove('scale-110')
        courseReviewItem.value?.classList.add('scale-100')
      }, 300)
      setTimeout(() => {
        courseReviewItem.value?.classList.remove(
          'transition-transform',
          'duration-300',
          'scale-100'
        )
      }, 600)
    }
  }
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
