<template>
  <section class="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm" :aria-labelledby="titleId">
    <div class="mb-3 flex items-center justify-between gap-3">
      <h3 :id="titleId" class="min-w-0 truncate text-sm font-medium text-zinc-700">
        回复 <span class="font-semibold text-zinc-950">{{ parent.author.nickname }}</span>
      </h3>
      <button type="button" aria-label="关闭回复框" :disabled="busy"
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50"
        @click="close"><X class="h-4 w-4" aria-hidden="true" /></button>
    </div>
    <form @submit.prevent="submit">
      <GuestbookEditor ref="editor" v-model="content" :disabled="busy" appearance="shadcn" placeholder="写下你的回复…" />
      <div class="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
        <span :class="{ 'text-red-600': textLength > 500 }">{{ textLength }} / 500</span>
        <span role="status" :class="saveState === 'failed' ? 'text-red-600' : 'text-zinc-500'">
          {{ saveState === 'failed' ? '草稿保存失败' : saveState === 'pending' ? '正在保存草稿…' : saveState === 'saved' ? '草稿已保存' : '' }}
        </span>
      </div>
      <div class="mt-3 flex flex-wrap justify-end gap-2">
        <button v-if="!clearConfirmation" type="button" :disabled="busy" class="mr-auto h-10 rounded-md px-3 text-sm text-zinc-600 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50" @click="clearConfirmation = true">清空草稿</button>
        <div v-else class="mr-auto flex items-center gap-2">
          <button type="button" :disabled="busy" class="h-10 rounded-md px-3 text-sm text-zinc-600 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:opacity-50" @click="clearConfirmation = false">取消清空</button>
          <button type="button" :disabled="busy" class="h-10 rounded-md bg-zinc-950 px-3 text-sm font-medium text-white hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:opacity-50" @click="clearDraft">确认清空</button>
        </div>
        <button type="button" :disabled="busy" class="h-10 rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-950 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50" @click="close">取消</button>
        <button type="submit" :disabled="busy || !textLength || textLength > 500"
          class="h-10 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
          {{ submitting ? '回复中…' : '回复' }}
        </button>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, useId, useTemplateRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { X } from 'lucide-vue-next'
import { useShadcnToast } from '@/lib/useShadcnToast'
import { useShadcnDialog } from '@/lib/useShadcnDialog'
import GuestbookEditor from './GuestbookEditor.vue'
import { useGuestbookDraft } from '@/lib/useGuestbookDraft'
import { api } from '@/lib/requests'
import type { DiscussionBoard, GuestbookEntry } from '@/types/api/guestbook'

const props = withDefaults(defineProps<{ userId: number; parent: GuestbookEntry; board?: DiscussionBoard }>(), { board: 'guestbook' })
const emit = defineEmits<{
  (event: 'close'): void
  (event: 'created', entry: GuestbookEntry): void
}>()
const message = useShadcnToast()
const dialog = useShadcnDialog()
const router = useRouter()
const editor = useTemplateRef<InstanceType<typeof GuestbookEditor>>('editor')
const titleId = `guestbook-reply-${useId()}`
const ownerId = props.userId
const composerBoard = props.board
const parentId = props.parent.id
const { content, submissionId, textLength, saveState, persist, clear, markPublished } = useGuestbookDraft(props.userId, props.parent.id, props.board)
const submitting = ref(false)
const confirmingLeave = ref(false)
const busy = computed(() => submitting.value || confirmingLeave.value)
let leaveDecision: Promise<boolean> | null = null
let mounted = true
const isCurrentComposer = () => mounted && props.userId === ownerId
  && props.board === composerBoard && props.parent.id === parentId
const clearConfirmation = ref(false)

watch(content, () => { clearConfirmation.value = false })

const clearDraft = () => {
  clear()
  clearConfirmation.value = false
}

const canLeave = () => {
  const saved = persist()
  if (!isCurrentComposer()) return true
  if (submitting.value) {
    message.info('正在回复，请稍候。')
    return false
  }
  if (!textLength.value) return true
  const description = saved ? '草稿已自动保存。确定关闭回复框吗？' : '草稿保存失败，关闭可能丢失内容。确定关闭吗？'
  if (leaveDecision) return leaveDecision
  confirmingLeave.value = true
  leaveDecision = dialog.confirm({ title: '关闭回复框', description, confirmText: '关闭回复框', cancelText: '继续编辑' })
    .then(accepted => isCurrentComposer() && accepted)
    .finally(() => { leaveDecision = null; confirmingLeave.value = false })
  return leaveDecision
}
const close = async () => { if (confirmingLeave.value) return; if (await canLeave() && isCurrentComposer()) emit('close') }
const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  persist()
  if (!textLength.value && !submitting.value) return
  event.preventDefault()
  event.returnValue = ''
}
const handleBeforeLogout = (event: Event) => {
  const saved = persist()
  if (!textLength.value && !busy.value) return
  event.preventDefault()
  message.info(submitting.value ? '正在回复，请稍候。' : saved
    ? '请先关闭回复框，再退出登录。草稿已自动保存。'
    : '草稿保存失败，请先关闭回复框并确认保留内容，再退出登录。')
}
const unregisterGuard = router.beforeEach(canLeave)

const submit = async () => {
  if (!isCurrentComposer() || busy.value || !textLength.value || textLength.value > 500) return
  persist()
  submitting.value = true
  try {
    const request = { params: { id: props.parent.id }, query: { content: content.value, submission_id: submissionId.value } }
    const response = props.board === 'announcements'
      ? await api.post({ url: '/api/announcements/:id/replies/', ...request })
      : await api.post({ url: '/api/guestbook/:id/replies/', ...request })
    if (!isCurrentComposer()) return
    if (response.status !== 201) throw new Error(response.data.message || '回复失败，请稍后重试')
    if (!markPublished()) message.warning('已回复，但浏览器未能清除旧草稿。再次打开时请核对内容。')
    message.success('回复已发布')
    emit('created', response.content.entry)
  } catch (error) {
    if (isCurrentComposer()) message.error(error instanceof Error ? error.message : '回复失败，请稍后重试')
  } finally { submitting.value = false }
}

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
  window.addEventListener('guestbook:before-logout', handleBeforeLogout)
  void nextTick(() => editor.value?.focus?.())
})
onUnmounted(() => {
  mounted = false
  unregisterGuard()
  window.removeEventListener('beforeunload', handleBeforeUnload)
  window.removeEventListener('guestbook:before-logout', handleBeforeLogout)
})
</script>
