<template>
  <ShadcnModal :show="true" :title="isReply ? '添加回复' : `添加${itemLabel}`" :busy="submitting" :suspended="confirmingLeave" @update:show="close">
    <div role="dialog" aria-modal="true" :aria-labelledby="titleId" class="max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto overscroll-contain rounded-xl border border-zinc-200 bg-white p-4 text-zinc-950 shadow-[0_20px_70px_-20px_rgba(0,0,0,0.25)] sm:p-6">
      <div class="mb-5 flex items-center justify-between gap-3">
        <h2 :id="titleId" class="text-lg font-semibold tracking-tight">{{ isReply ? '添加回复' : `添加${itemLabel}` }}</h2>
        <button type="button" aria-label="关闭编辑窗口" :disabled="busy" class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50" @click="close"><X class="h-4 w-4" aria-hidden="true" /></button>
      </div>
      <form @submit.prevent="submit">
        <label v-if="!isReply && board === 'announcements'" class="mb-4 block">
          <span class="mb-1.5 block text-sm font-medium text-zinc-950">公告标题</span>
          <input v-model="title" :disabled="busy" maxlength="100" required type="text"
            class="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="请输入公告标题" />
          <span class="mt-1 block text-right text-xs text-zinc-500">{{ title.length }} / 100</span>
        </label>
        <GuestbookEditor v-model="content" :disabled="busy" appearance="shadcn" :placeholder="isReply ? '写下你的回复…' : `写下你的${itemLabel}…`" />
        <div class="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-zinc-500">
          <label v-if="!isReply && board === 'guestbook'" class="flex cursor-pointer items-center gap-2 text-zinc-700"><input v-model="anonymous" :disabled="busy" type="checkbox" class="h-4 w-4 rounded border border-zinc-300 accent-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed" />匿名发布</label>
          <span v-else>{{ isReply ? '回复' : itemLabel }}将显示你的昵称和头像</span>
          <span :class="{ 'text-red-600': textLength > 500 }">{{ textLength }} / 500</span>
        </div>
        <p class="mt-2 text-xs leading-5" :class="saveState === 'failed' ? 'text-red-600' : 'text-zinc-500'" role="status">
          {{ saveState === 'failed' ? '草稿保存失败，请复制内容后再离开。' : saveState === 'saved' ? '草稿已自动保存在当前浏览器。' : saveState === 'pending' ? '正在保存草稿…' : '草稿会自动保存在当前浏览器。' }}
        </p>
        <div class="mt-5 flex flex-wrap justify-end gap-2 border-t border-zinc-100 pt-4">
          <button v-if="!clearConfirmation" type="button" :disabled="busy" class="mr-auto h-10 rounded-md px-3 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50" @click="clearConfirmation = true">清空草稿</button>
          <div v-else class="mr-auto flex items-center gap-2">
            <button type="button" :disabled="busy" class="h-10 rounded-md px-3 text-sm text-zinc-600 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:opacity-50" @click="clearConfirmation = false">取消清空</button>
            <button type="button" :disabled="busy" class="h-10 rounded-md bg-zinc-950 px-3 text-sm font-medium text-white hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:opacity-50" @click="clearDraft">确认清空</button>
          </div>
          <button type="button" :disabled="busy" class="h-10 rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50" @click="close">取消</button>
          <button type="submit" :disabled="busy || !textLength || textLength > 500 || (!isReply && board === 'announcements' && !title.trim())" class="h-10 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">{{ submitting ? '发布中…' : '发布' }}</button>
        </div>
      </form>
    </div>
  </ShadcnModal>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, useId, watch } from 'vue'
import { useRouter } from 'vue-router'
import ShadcnModal from '@/components/common/ShadcnModal.vue'
import { X } from 'lucide-vue-next'
import { useShadcnToast } from '@/lib/useShadcnToast'
import { useShadcnDialog } from '@/lib/useShadcnDialog'
import GuestbookEditor from './GuestbookEditor.vue'
import { useGuestbookDraft } from '@/lib/useGuestbookDraft'
import { api } from '@/lib/requests'
import type { DiscussionBoard, GuestbookEntry } from '@/types/api/guestbook'

const props = withDefaults(defineProps<{ userId: number; parentId?: number | null; board?: DiscussionBoard }>(), { board: 'guestbook' })
const emit = defineEmits<{ (event: 'close'): void; (event: 'created', entry: GuestbookEntry): void }>()
const message = useShadcnToast()
const dialog = useShadcnDialog()
const router = useRouter()
// A composer belongs to one account and target for its entire lifetime.
const ownerId = props.userId
const composerBoard = props.board
const parentId = props.parentId ?? null
const isReply = parentId !== null
const itemLabel = props.board === 'announcements' ? '公告' : '留言'
const { title, content, anonymous, submissionId, textLength, saveState, persist, clear, markPublished } = useGuestbookDraft(props.userId, parentId, props.board)
const submitting = ref(false)
const confirmingLeave = ref(false)
const busy = computed(() => submitting.value || confirmingLeave.value)
const titleId = `guestbook-composer-${useId()}`
let leaveDecision: Promise<boolean> | null = null
let mounted = true
const isCurrentComposer = () => mounted && props.userId === ownerId
  && props.board === composerBoard && (props.parentId ?? null) === parentId
const clearConfirmation = ref(false)

watch([title, content, anonymous], () => { clearConfirmation.value = false })

const clearDraft = () => {
  clear()
  clearConfirmation.value = false
}

const canLeave = () => {
  const saved = persist()
  if (!isCurrentComposer()) return true
  if (submitting.value) {
    message.info('正在发布，请稍候。')
    return false
  }
  if (!textLength.value) return true
  if (leaveDecision) return leaveDecision
  confirmingLeave.value = true
  leaveDecision = dialog.confirm({
    title: '关闭编辑窗口',
    description: saved ? '草稿已自动保存。确定要关闭编辑窗口吗？' : '草稿保存失败，关闭可能丢失内容。确定关闭吗？',
    confirmText: '关闭编辑窗口', cancelText: '继续编辑',
  }).then(accepted => isCurrentComposer() && accepted)
    .finally(() => { leaveDecision = null; confirmingLeave.value = false })
  return leaveDecision
}
const close = async () => {
  if (confirmingLeave.value) return
  if (await canLeave() && isCurrentComposer()) emit('close')
}
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
  message.info(submitting.value ? '正在发布，请稍候。' : saved
    ? '请先关闭编辑窗口，再退出登录。草稿已自动保存。'
    : '草稿保存失败，请先关闭编辑窗口并确认保留内容，再退出登录。')
}
const unregisterGuard = router.beforeEach(canLeave)

const submit = async () => {
  if (!isCurrentComposer() || busy.value || !textLength.value || textLength.value > 500
    || (!isReply && props.board === 'announcements' && !title.value.trim())) return
  persist()
  submitting.value = true
  try {
    const query = { content: content.value, submission_id: submissionId.value }
    const response = props.board === 'announcements'
      ? (isReply
        ? await api.post({ url: '/api/announcements/:id/replies/', params: { id: parentId! }, query })
        : await api.post({ url: '/api/announcements/', query: { ...query, title: title.value.trim(), anonymous: false } }))
      : (isReply
        ? await api.post({ url: '/api/guestbook/:id/replies/', params: { id: parentId! }, query })
        : await api.post({ url: '/api/guestbook/', query: { ...query, anonymous: anonymous.value } }))
    if (!isCurrentComposer()) return
    if (response.status !== 201) throw new Error(response.data.message || '发布失败，请稍后重试')
    if (!markPublished()) message.warning('已发布，但浏览器未能清除旧草稿。再次打开时请核对内容。')
    submitting.value = false
    message.success(isReply ? '回复已发布' : `${itemLabel}已发布`)
    emit('created', response.content.entry)
  } catch (error) {
    if (isCurrentComposer()) message.error(error instanceof Error ? error.message : '发布失败，请稍后重试')
  } finally { submitting.value = false }
}
onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
  window.addEventListener('guestbook:before-logout', handleBeforeLogout)
})
onUnmounted(() => {
  mounted = false
  unregisterGuard()
  window.removeEventListener('beforeunload', handleBeforeUnload)
  window.removeEventListener('guestbook:before-logout', handleBeforeLogout)
})
</script>
