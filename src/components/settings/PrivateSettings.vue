<template>
  <div class="max-w-2xl mx-auto">
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <div class="bg-white  rounded px-8 pt-6 pb-8 mb-4">
        <h2 class="text-xl font-semibold mb-4">隐私设定</h2>
        <h4 class="text-base mb-4">此处设定只影响他人查看你个人页面时的结果, 不影响其他任何界面</h4>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">课程评价</label>
          <n-space>
            <n-radio
              v-for="explain in allPrivateExplain"
              :key="explain.key"
              :checked="userReviewPrivate === explain.key"
              :value="explain.key"
              name="review-private"
              @change="handleReviewChange"
            >
              {{ explain.value }}
            </n-radio>
          </n-space>
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">课程评价回复</label>
          <n-space>
            <n-radio
              v-for="explain in allPrivateExplain"
              :key="explain.key"
              :checked="userReplyPrivate === explain.key"
              :value="explain.key"
              name="reply-private"
              @change="handleReplyChange"
            >
              {{ explain.value }}
            </n-radio>
          </n-space>
        </div>
        <div class="flex justify-end">
          <button
            type="submit"
            class="flex items-center justify-center px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
            :disabled="isSubmitting"
          >
            <LoaderCircle
              v-if="isSubmitting"
              class="w-5 h-5 mr-2 text-white animate-spin"
            />
            <p>{{ isSubmitting ? '保存中...' : '保存更改' }}</p>
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '@/lib/requests'
import { LoaderCircle } from 'lucide-vue-next'
import { useMessage } from 'naive-ui'

const disabled = ref(true)
const message = useMessage()
const allPrivateExplain = ref([
  { key: 0, value: '允许所有人' },
  { key: 1, value: '仅允许登录用户' },
  { key: 2, value: '禁止所有人' },
])
let userReviewPrivate = ref(0)
let userReplyPrivate = ref(0)
const isSubmitting = ref(false)
const fetchPrivateSettings = async () => {
  try {
    const resp = await api.get({ url: '/api/user/private/' })
    userReviewPrivate.value = resp.data.contents.review.setting
    userReplyPrivate.value = resp.data.contents.reply.setting
  } catch (error) {
    console.error('获取隐私设置失败:', error)
  }
}

onMounted(() => {
  fetchPrivateSettings()
})

const handleReviewChange = (e: Event) => {
  userReviewPrivate.value = Number((e.target as HTMLInputElement).value)
}

const handleReplyChange = (e: Event) => {
  userReplyPrivate.value = Number((e.target as HTMLInputElement).value)
}
const handleSubmit = async () => {
  if (isSubmitting.value) return
  isSubmitting.value = true
  try {
    const resp = await api.post({
      url: '/api/user/private/',
      query: {
        private_review: userReviewPrivate.value,
        private_reply: userReplyPrivate.value,
      },
    })
    if (resp.status !== 200) throw new Error('Failed to update profile')
    message.success('隐私设定更新成功')
  } catch (error) {
    message.error('更新隐私设定失败')
    console.error('Error updating profile:', error)
  } finally {
    isSubmitting.value = false
  }
}
</script>