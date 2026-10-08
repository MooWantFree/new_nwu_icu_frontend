<template>
  <article class="min-w-0 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
    <div ref="courseReviewItem">
      <div v-if="review.is_deleted" class="mb-4 flex items-center gap-3 text-zinc-500">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100" aria-hidden="true">×</div>
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
  ref,
} from 'vue'
import { useRoute } from 'vue-router'
import { useShadcnToast } from '@/lib/useShadcnToast'
import { useShadcnDialog } from '@/lib/useShadcnDialog'
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

const message = useShadcnToast()
const dialog = useShadcnDialog()
const deleting = ref(false)
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

const handleDeleteReview = async () => {
  if (deleting.value) return
  deleting.value = true
  try {
    if (!(await dialog.confirm({
      title: '删除评价',
      description: '你确定要删除这条评价吗？删除以后不可恢复。',
      confirmText: '删除评价',
      destructive: true,
    }))) return
    const response = await api.delete({
      url: '/api/assessment/review/',
      query: { review_id: review.id },
    })
    if (response.status !== 200) {
      throw new Error(response.errors?.map(error => error.err_msg).filter(Boolean).join('；') || '删除失败')
    }
    message.success('评价已成功删除')
    emit('reviewDeleted', review.id)
  } catch (error) {
    console.error('Error deleting review:', error)
    message.error('删除评价失败，请稍后重试\n' + error)
  } finally {
    deleting.value = false
  }
}

const isAuthor = computed(() => review.author.id === userInfo.value?.id)

const handleReplyDeleted = (reviewId: number, replyId: number) => {
  emit('replyDeleted', reviewId, replyId)
}
</script>
