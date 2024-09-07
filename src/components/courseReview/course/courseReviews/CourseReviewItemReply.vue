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
import { NAvatar, NInput, NCheckbox, NButton } from 'naive-ui'
import { Review } from "@/types/courses"
import { useMessage } from 'naive-ui'; 

const message = useMessage()

const props = defineProps<{
  review: Review
}>()

// TODO: Figure out what did here
const emit = defineEmits<{
  (e: 'replySubmitted', content: string): void
  (e: 'close'): void
}>()

const loadingRef = ref(false)

const replyContent = ref('')
const submitReply = async () => {
  loadingRef.value = true
  try {
    const response = await fetch(`/api/review/reply/${props.review.id}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1] || ''
      },
      body: JSON.stringify({ content: replyContent.value })
    })

    if (!response.ok) {
      throw new Error('Network response was not ok')
    }

    const data = await response.json()
    if (data.message === "成功创建课程评价回复") {
      // Emit an event to notify parent component
      emit('replySubmitted', replyContent.value)
      // Show success message
      message.success('回复已成功发表')
    } else {
      throw new Error('Unexpected server response')
    }
  } catch (error) {
    console.error('Error submitting reply:', error)
    message.error('发表回复时出错，请稍后重试')
  }
  // After submit
  replyContent.value = ''
  loadingRef.value = false
  // TODO: emit event and show what replied
}
</script>