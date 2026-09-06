<template>
  <section class="rounded-xl border border-blue-200 bg-blue-50/30 p-4" :aria-labelledby="titleId">
    <div class="mb-3 flex items-center justify-between gap-3">
      <h3 :id="titleId" class="min-w-0 truncate text-sm font-medium text-gray-700">
        回复 <span class="font-semibold text-gray-900">{{ parent.author.nickname }}</span>
      </h3>
      <button type="button" aria-label="关闭回复框" :disabled="submitting"
        class="shrink-0 rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        @click="close">×</button>
    </div>
    <form @submit.prevent="submit">
      <GuestbookEditor ref="editor" v-model="content" :disabled="submitting" placeholder="写下你的回复…" />
      <div class="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
        <span :class="{ 'text-red-600': textLength > 500 }">{{ textLength }} / 500</span>
        <span role="status" :class="saveState === 'failed' ? 'text-red-600' : 'text-gray-500'">
          {{ saveState === 'failed' ? '草稿保存失败' : saveState === 'pending' ? '正在保存草稿…' : saveState === 'saved' ? '草稿已保存' : '' }}
        </span>
      </div>
      <div class="mt-3 flex flex-wrap justify-end gap-2">
        <button type="button" :disabled="submitting" class="rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100" @click="close">取消</button>
        <button type="submit" :disabled="submitting || !textLength || textLength > 500"
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
          {{ submitting ? '回复中…' : '回复' }}
        </button>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import GuestbookEditor from './GuestbookEditor.vue'
import { useGuestbookDraft } from '@/lib/useGuestbookDraft'
import { api } from '@/lib/requests'
import type { DiscussionBoard, GuestbookEntry } from '@/types/api/guestbook'

const props = withDefaults(defineProps<{ userId: number; parent: GuestbookEntry; board?: DiscussionBoard }>(), { board: 'guestbook' })
const emit = defineEmits<{
  (event: 'close'): void
  (event: 'created', entry: GuestbookEntry): void
}>()
const message = useMessage()
const router = useRouter()
const editor = useTemplateRef<InstanceType<typeof GuestbookEditor>>('editor')
const titleId = `guestbook-reply-title-${props.parent.id}`
const { content, submissionId, textLength, saveState, persist, markPublished } = useGuestbookDraft(props.userId, props.parent.id, props.board)
const submitting = ref(false)

const canLeave = () => {
  const saved = persist()
  if (submitting.value) {
    message.info('正在回复，请稍候。')
    return false
  }
  return !textLength.value || confirm(saved ? '草稿已自动保存。确定关闭回复框吗？' : '草稿保存失败，关闭可能丢失内容。确定关闭吗？')
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
    const request = { params: { id: props.parent.id }, query: { content: content.value, submission_id: submissionId.value } }
    const response = props.board === 'announcements'
      ? await api.post({ url: '/api/announcements/:id/replies/', ...request })
      : await api.post({ url: '/api/guestbook/:id/replies/', ...request })
    if (response.status !== 201) throw new Error(response.data.message || '回复失败，请稍后重试')
    if (!markPublished()) message.warning('已回复，但浏览器未能清除旧草稿。再次打开时请核对内容。')
    message.success('回复已发布')
    emit('created', response.content.entry)
  } catch (error) {
    message.error(error instanceof Error ? error.message : '回复失败，请稍后重试')
  } finally { submitting.value = false }
}

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
  window.addEventListener('guestbook:before-logout', handleBeforeLogout)
  void nextTick(() => editor.value?.focus?.())
})
onUnmounted(() => {
  unregisterGuard()
  window.removeEventListener('beforeunload', handleBeforeUnload)
  window.removeEventListener('guestbook:before-logout', handleBeforeLogout)
})
</script>
