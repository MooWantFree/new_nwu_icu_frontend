<template>
  <NModal :show="true" @update:show="close">
    <div role="dialog" aria-modal="true" aria-labelledby="guestbook-composer-title" class="mx-4 w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
      <div class="mb-4 flex items-center justify-between">
        <h2 id="guestbook-composer-title" class="text-xl font-semibold">{{ isReply ? '添加回复' : '添加留言' }}</h2>
        <button type="button" aria-label="关闭编辑窗口" :disabled="submitting" class="px-2 text-xl text-gray-500" @click="close">×</button>
      </div>
      <form @submit.prevent="submit">
        <GuestbookEditor v-model="content" :disabled="submitting" :placeholder="isReply ? '写下你的回复…' : '写下你的留言…'" />
        <div class="mt-3 flex flex-wrap justify-between gap-2 text-sm text-gray-500">
          <label v-if="!isReply" class="flex items-center gap-2"><input v-model="anonymous" :disabled="submitting" type="checkbox" />匿名发布</label>
          <span v-else>回复将显示你的昵称和头像</span>
          <span :class="{ 'text-red-600': textLength > 500 }">{{ textLength }} / 500</span>
        </div>
        <p class="mt-2 text-xs" :class="saveState === 'failed' ? 'text-red-600' : 'text-gray-500'" role="status">
          {{ saveState === 'failed' ? '草稿保存失败，请复制内容后再离开。' : saveState === 'saved' ? '草稿已自动保存在当前浏览器。' : saveState === 'pending' ? '正在保存草稿…' : '草稿会自动保存在当前浏览器。' }}
        </p>
        <div class="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" :disabled="submitting" class="mr-auto rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100" @click="clear">清空草稿</button>
          <button type="button" :disabled="submitting" class="rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100" @click="close">取消</button>
          <button type="submit" :disabled="submitting || !textLength || textLength > 500" class="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{{ submitting ? '发布中…' : '发布' }}</button>
        </div>
      </form>
    </div>
  </NModal>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { NModal, useMessage } from 'naive-ui'
import GuestbookEditor from './GuestbookEditor.vue'
import { useGuestbookDraft } from '@/lib/useGuestbookDraft'
import { api } from '@/lib/requests'
import type { GuestbookEntry } from '@/types/api/guestbook'

const props = defineProps<{ userId: number; parentId?: number | null }>()
const emit = defineEmits<{ (event: 'close'): void; (event: 'created', entry: GuestbookEntry): void }>()
const message = useMessage()
const router = useRouter()
// A composer belongs to one account and target for its entire lifetime.
const parentId = props.parentId ?? null
const isReply = parentId !== null
const { content, anonymous, submissionId, textLength, saveState, persist, clear, markPublished } = useGuestbookDraft(props.userId, parentId)
const submitting = ref(false)

const canLeave = () => {
  const saved = persist()
  if (submitting.value) {
    message.info('正在发布，请稍候。')
    return false
  }
  return !textLength.value || confirm(saved ? '草稿已自动保存。确定要离开编辑窗口吗？' : '草稿保存失败，离开可能丢失内容。确定要离开吗？')
}
const close = () => { if (canLeave()) emit('close') }
const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  persist()
  if (!textLength.value && !submitting.value) return
  event.preventDefault()
  event.returnValue = ''
}
const handleBeforeLogout = (event: Event) => { if (!canLeave()) event.preventDefault() }
const unregisterGuard = router.beforeEach(canLeave)

const submit = async () => {
  if (submitting.value || !textLength.value || textLength.value > 500) return
  persist()
  submitting.value = true
  try {
    const query = { content: content.value, submission_id: submissionId.value }
    const response = isReply
      ? await api.post({ url: '/api/guestbook/:id/replies/', params: { id: parentId! }, query })
      : await api.post({ url: '/api/guestbook/', query: { ...query, anonymous: anonymous.value } })
    if (response.status !== 201) throw new Error(response.data.message || '发布失败，请稍后重试')
    if (!markPublished()) message.warning('已发布，但浏览器未能清除旧草稿。再次打开时请核对内容。')
    submitting.value = false
    message.success(isReply ? '回复已发布' : '留言已发布')
    emit('created', response.content.entry)
  } catch (error) {
    message.error(error instanceof Error ? error.message : '发布失败，请稍后重试')
  } finally { submitting.value = false }
}
onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
  window.addEventListener('guestbook:before-logout', handleBeforeLogout)
})
onUnmounted(() => {
  unregisterGuard()
  window.removeEventListener('beforeunload', handleBeforeUnload)
  window.removeEventListener('guestbook:before-logout', handleBeforeLogout)
})
</script>
