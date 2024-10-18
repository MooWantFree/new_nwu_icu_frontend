<template>
  <div class="mt-4 ml-8">
    <div class="flex items-start space-x-4">
      <!-- <n-avatar round size="small" src="/path/to/user/avatar.jpg" /> -->
      <div class="flex-grow">
        <n-input
          v-model:value="replyContent"
          type="textarea"
          placeholder="写下你的回复..."
          :autosize="{ minRows: 2, maxRows: 6 }"
          class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          :disabled="loadingRef"
          :loading="loadingRef"
        />
        <div class="mt-2 flex justify-end items-center">
          <n-button type="primary" @click="submitReply" :disabled="!replyContent.trim()" :loading="loadingRef">
            发表回复
          </n-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { NInput, NButton, useMessage } from 'naive-ui'
import { Review } from '@/types/courses'
import { api } from '@/lib/requests'

const message = useMessage()

const props = defineProps<{
  review: Review,
  replyTo: number,
}>()

const emit = defineEmits<{
  (e: 'replySubmitted', content: string): void
  (e: 'close'): void
}>()

const loadingRef = ref(false)
const replyContent = ref('')

const submitReply = async () => {
  loadingRef.value = true
  try {
    const { status, data } = await api.post(`/api/assessment/reply/`, {
      content: replyContent.value,
      review_id: props.review.id,
      parent_id: props.replyTo,
    })

    if (status !== 200) {
      throw new Error('Network response was not ok')
    }

    if (data.message === "成功创建课程评价回复") {
      emit('replySubmitted', replyContent.value)
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
</script>