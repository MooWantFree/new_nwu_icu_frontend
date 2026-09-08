<template>
  <div class="min-w-0 rounded-xl border border-blue-100 bg-blue-50/40 p-3">
    <div class="flex items-start space-x-4">
      <!-- <n-avatar round size="small" src="/path/to/user/avatar.jpg" /> -->
      <div class="flex-grow">
        <div class="mb-2 text-sm text-gray-600" v-if="props.replyTo">
          回复 {{ replyTargetName || '这条回复' }}
        </div>
        <textarea
          ref="textarea"
          v-model="replyContent"
          placeholder="写下你的回复..."
          :aria-label="replyTo ? `回复 ${replyTargetName || '这条回复'}` : '回复评价'"
          class="w-full p-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 focus:outline-none"
          :class="{
            'cursor-not-allowed': loadingRef,
            'opacity-50': loadingRef,
          }"
          :disabled="loadingRef"
          rows="2"
        ></textarea>
        <div class="mt-2 flex justify-end items-center gap-3">
          <button type="button" class="text-sm text-gray-500 hover:text-gray-700" :disabled="loadingRef" @click="emit('close')">取消</button>
          <button
            type="button"
            @click="submitReply"
            :disabled="!replyContent.trim() || loadingRef"
            class="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
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
</template>

<script lang="ts" setup>
import { onMounted, ref, useTemplateRef } from 'vue'
import { useMessage } from 'naive-ui'
import { Review } from '@/types/courseReview'
import { api } from '@/lib/requests'

const message = useMessage()

const props = defineProps<{
  review: Review
  replyTo: number
  replyTargetName?: string
}>()

const emit = defineEmits<{
  (e: 'replySubmitted', content: string, parent: number, replyId: number): void
  (e: 'close'): void
}>()

const loadingRef = ref(false)
const replyContent = ref('')
const textareaRef = useTemplateRef('textarea')

const submitReply = async () => {
  if (loadingRef.value || !replyContent.value.trim()) return
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
      emit(
        'replySubmitted',
        replyContent.value,
        props.replyTo,
        data.contents.reply_id
      )
      message.success('回复已成功发表')
    } else {
      throw new Error('Unexpected server response')
    }
    replyContent.value = ''
  } catch (error) {
    console.error('Error submitting reply:', error)
    message.error('发表回复时出错，请稍后重试')
  } finally {
    loadingRef.value = false
  }
}

const focus = () => {
  if (textareaRef.value) {
    textareaRef.value.focus({ preventScroll: true })
  }
}

defineExpose({ focus })
onMounted(focus)
</script>
