<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4" role="dialog" aria-modal="true">
    <div class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
      <div class="flex items-center justify-between border-b border-gray-200 px-5 py-4">
        <div>
          <h2 class="text-xl font-bold text-gray-900">{{ isReply ? '回复留言' : '添加留言' }}</h2>
          <p v-if="isReply" class="mt-1 text-sm text-amber-700">回复会显示你的昵称和头像。</p>
        </div>
        <button class="rounded-full p-2 text-gray-500 hover:bg-gray-100" aria-label="关闭" @click="close">×</button>
      </div>
      <form class="space-y-4 p-5" @submit.prevent="submit">
        <GuestbookEditor v-model="content" :placeholder="isReply ? '写下你的回复…' : '写下你的留言…'" />
        <div class="flex items-center justify-between gap-4 text-sm">
          <label v-if="!isReply" class="flex cursor-pointer items-center gap-2 text-gray-700">
            <input v-model="anonymous" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-blue-600" />
            匿名发布
          </label>
          <span v-else />
          <span :class="plainText.length > 500 ? 'text-red-600' : 'text-gray-500'">{{ plainText.length }}/500</span>
        </div>
        <p v-if="hasDraft" class="text-xs text-gray-500">草稿已自动保存到当前浏览器。</p>
        <div class="flex justify-end gap-3">
          <button type="button" class="rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100" @click="clearDraft">清空草稿</button>
          <button type="button" class="rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100" @click="close">取消</button>
          <button type="submit" :disabled="submitting || !plainText || plainText.length > 500" class="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
            {{ submitting ? '发布中…' : '发布' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useMessage } from 'naive-ui'

import GuestbookEditor from './GuestbookEditor.vue'
import { clearGuestbookDraft, guestbookPlainText, loadGuestbookDraft, saveGuestbookDraft } from '@/lib/guestbook'
import { api } from '@/lib/requests'
import type { GuestbookEntry } from '@/types/api/guestbook'

const props = defineProps<{ userId: number; parentId?: number | null }>()
const emit = defineEmits<{ (event: 'close'): void; (event: 'created', entry: GuestbookEntry): void }>()
const message = useMessage()
const content = ref('')
const anonymous = ref(false)
const submitting = ref(false)
const hasDraft = ref(false)
let saveTimer: ReturnType<typeof setTimeout> | undefined

const isReply = computed(() => props.parentId != null)
const plainText = computed(() => guestbookPlainText(content.value))
const hasContent = computed(() => plainText.value.length > 0)

const persistDraft = () => {
  if (!hasContent.value) return
  saveGuestbookDraft(props.userId, props.parentId ?? null, {
    content: content.value,
    anonymous: anonymous.value,
    updatedAt: new Date().toISOString(),
  })
  hasDraft.value = true
}

watch([content, anonymous], () => {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(persistDraft, 500)
})

const clearDraft = () => {
  content.value = ''
  anonymous.value = false
  clearGuestbookDraft(props.userId, props.parentId ?? null)
  hasDraft.value = false
}

const close = () => {
  persistDraft()
  if (hasContent.value && !confirm('草稿已自动保存。确定要关闭编辑窗口吗？')) return
  emit('close')
}

const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  persistDraft()
  if (!hasContent.value) return
  event.preventDefault()
  event.returnValue = ''
}

const submit = async () => {
  if (!plainText.value || plainText.value.length > 500) return
  submitting.value = true
  try {
    const response = isReply.value
      ? await api.post({ url: '/api/guestbook/:id/replies/', params: { id: props.parentId! }, query: { content: content.value } })
      : await api.post({ url: '/api/guestbook/', query: { content: content.value, anonymous: anonymous.value } })
    if (response.status !== 201) throw new Error(response.data.message || '发布失败')
    clearGuestbookDraft(props.userId, props.parentId ?? null)
    message.success(isReply.value ? '回复已发布' : '留言已发布')
    emit('created', response.content.entry)
  } catch (error) {
    message.error(error instanceof Error ? error.message : '发布失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  const draft = loadGuestbookDraft(props.userId, props.parentId ?? null)
  if (draft) {
    content.value = draft.content
    anonymous.value = !isReply.value && draft.anonymous
    hasDraft.value = true
  }
  window.addEventListener('beforeunload', handleBeforeUnload)
})
onUnmounted(() => {
  if (saveTimer) clearTimeout(saveTimer)
  persistDraft()
  window.removeEventListener('beforeunload', handleBeforeUnload)
})
</script>
