<template>
  <div class="min-w-0 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
    <div class="flex min-w-0 items-start">
      <div class="min-w-0 flex-1">
        <div class="mb-2 break-words text-xs text-zinc-600" v-if="props.replyTo">
          回复 {{ replyTargetName || '这条回复' }}
        </div>
        <textarea
          ref="textarea"
          v-model="replyContent"
          maxlength="2000"
          placeholder="写下你的回复..."
          :aria-label="replyTo ? `回复 ${replyTargetName || '这条回复'}` : '回复评价'"
          class="w-full min-w-0 resize-y rounded-md border border-zinc-200 bg-white p-3 text-sm leading-6 text-zinc-950 shadow-sm placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:ring-offset-2"
          :class="{
            'cursor-not-allowed': loadingRef,
            'opacity-50': loadingRef,
          }"
          :disabled="loadingRef"
          rows="2"
          @input="clearConfirmation = false"
        ></textarea>
        <div class="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
          <span>{{ replyContent.length }} / 2,000</span>
          <span role="status" :class="saveState === 'failed' ? 'text-red-600' : 'text-zinc-500'">
            {{ saveState === 'failed' ? '草稿保存失败' : saveState === 'pending' ? '正在保存草稿…' : saveState === 'saved' ? '草稿已保存' : '草稿会自动保存' }}
          </span>
        </div>
        <div class="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <button v-if="!clearConfirmation" type="button" class="rounded-sm text-xs text-zinc-500 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2" :disabled="loadingRef" @click="clearConfirmation = true">清空草稿</button>
            <template v-else>
              <button type="button" class="rounded-sm text-xs text-zinc-500 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2" :disabled="loadingRef" @click="clearConfirmation = false">取消清空</button>
              <button type="button" class="rounded-md bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2" :disabled="loadingRef" @click="clearDraft">确认清空</button>
            </template>
          </div>
          <div class="flex items-center gap-3">
            <button type="button" class="rounded-sm text-xs text-zinc-500 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2" :disabled="loadingRef" @click="emit('close')">取消</button>
            <button
              type="button"
              @click="submitReply"
              :disabled="!replyContent.trim() || loadingRef"
              class="inline-flex min-h-9 items-center justify-center rounded-md bg-zinc-950 px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:opacity-50"
              :class="{
                'cursor-not-allowed': !replyContent.trim() || loadingRef,
                'opacity-50': loadingRef,
              }"
            >
              发表回复
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, useTemplateRef } from 'vue'
import { useMessage } from 'naive-ui'
import { Review } from '@/types/courseReview'
import { api } from '@/lib/requests'
import { useCourseReviewReplyDraft } from '@/lib/useCourseReviewReplyDraft'

const message = useMessage()

const props = defineProps<{
  review: Review
  replyTo: number
  replyTargetName?: string
  userId: number
}>()

const emit = defineEmits<{
  (e: 'replySubmitted', content: string, parent: number, replyId: number): void
  (e: 'close'): void
}>()

const loadingRef = ref(false)
const { content: replyContent, saveState, persist, clear, markPublished } = useCourseReviewReplyDraft(props.userId, props.review.id, props.replyTo)
const clearConfirmation = ref(false)
const textareaRef = useTemplateRef('textarea')

const submitReply = async () => {
  if (loadingRef.value || !replyContent.value.trim()) return
  persist()
  const submittedContent = replyContent.value
  loadingRef.value = true
  try {
    const { status, data } = await api.post({
      url: '/api/assessment/reply/',
      query: {
        content: replyContent.value,
        review_id: props.review.id,
        parent_id: props.replyTo,
      },
    })

    if (status !== 201) {
      throw new Error('Network response was not ok')
    }

    if (data.message === '成功创建课程评价回复') {
      if (!markPublished()) message.warning('已回复，但浏览器未能清除旧草稿。再次打开时请核对内容。')
      emit(
        'replySubmitted',
        submittedContent,
        props.replyTo,
        data.contents.reply_id
      )
      message.success('回复已成功发表')
    } else {
      throw new Error('Unexpected server response')
    }
  } catch (error) {
    console.error('Error submitting reply:', error)
    message.error('发表回复时出错，请稍后重试')
  } finally {
    loadingRef.value = false
  }
}

const clearDraft = () => {
  clear()
  clearConfirmation.value = false
}

const focus = () => {
  if (textareaRef.value) {
    textareaRef.value.focus({ preventScroll: true })
  }
}

defineExpose({ focus })
onMounted(focus)
</script>
