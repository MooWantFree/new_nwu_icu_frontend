<template>
  <main class="mx-auto max-w-4xl px-4 py-8 sm:px-6">
    <RouterLink to="/guestbook" class="mb-6 inline-block text-sm text-blue-700 hover:underline">← 返回留言板</RouterLink>
    <GuestbookComposerModal v-if="replyTarget && userInfo" :key="`${userInfo.id}:${replyTarget}`" :user-id="userInfo.id" :parent-id="replyTarget" @close="replyTarget = null" @created="replyCreated" />
    <div v-if="loading" class="py-16 text-center text-gray-500">加载讨论中…</div>
    <template v-else-if="entry">
      <p v-if="!userInfo" class="mb-4 text-sm text-gray-600">登录后可参与讨论。</p>
      <GuestbookThreadNode :key="entry.id" :entry-id="entry.id" :thread="thread" :level="0" :focus-id="focusId" :pending="pending"
        @like="setLike" @reply="startReply" @delete="remove" @report="report" />
    </template>
    <div v-else class="py-16 text-center text-gray-500">留言不存在或暂时无法加载。<button class="ml-2 text-blue-700" @click="refresh">重试</button></div>
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import GuestbookComposerModal from '@/components/guestbook/GuestbookComposerModal.vue'
import GuestbookThreadNode from '@/components/guestbook/GuestbookThreadNode.vue'
import { api } from '@/lib/requests'
import { useUser } from '@/lib/useUser'
import { createGuestbookThread } from '@/lib/useGuestbookThread'
import { useGuestbookActions } from '@/lib/useGuestbookActions'
import type { GuestbookEntry } from '@/types/api/guestbook'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const { userInfo } = useUser()
const { pending, requireLogin, setLike, remove, report } = useGuestbookActions()
const root = ref<number | null>(null)
const loading = ref(true)
const replyTarget = ref<number | null>(null)
const rootId = computed(() => Number(route.params.id))
const focusId = computed(() => Number(route.query.focus || route.query.reply || 0) || undefined)
const thread = createGuestbookThread(async (id, page) => {
  const response = await api.get({ url: '/api/guestbook/:id/replies/', params: { id }, query: { page, pageSize: 10 } })
  if (response.status !== 200) throw new Error('获取回复失败')
  return response.content
})
const entry = computed(() => root.value ? thread.entries[root.value] : null)
let requestVersion = 0
let focusVersion = 0

const revealFocus = async () => {
  const id = focusId.value
  const version = ++focusVersion
  if (!id || !root.value) return
  try {
    const context = await api.get({ url: '/api/guestbook/:id/context/', params: { id } })
    if (version !== focusVersion || context.status !== 200 || context.content.root_id !== root.value) return
    thread.reveal(context.content.entries)
    await nextTick()
    document.getElementById(`guestbook-${id}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  } catch { message.error('定位回复失败，请重试') }
}
const startReply = (target: GuestbookEntry) => {
  if (target.is_deleted || !requireLogin(`/guestbook/${target.root_id ?? target.id}?reply=${target.id}`)) return
  replyTarget.value = target.id
}
const openLinkedReply = () => {
  const id = Number(route.query.reply)
  if (id && userInfo.value && thread.entries[id]) startReply(thread.entries[id])
}
const refresh = async () => {
  const version = ++requestVersion
  ++focusVersion
  loading.value = true
  replyTarget.value = null
  try {
    const response = await api.get({ url: '/api/guestbook/:id/', params: { id: rootId.value } })
    if (version !== requestVersion) return
    if (response.status !== 200) throw new Error('留言不存在')
    root.value = response.content.entry.id
    thread.reset(response.content.entry)
    loading.value = false
    await revealFocus()
    if (version === requestVersion) openLinkedReply()
  } catch (error) {
    if (version === requestVersion) {
      message.error(error instanceof Error ? error.message : '获取讨论失败')
      root.value = null
    }
  } finally { if (version === requestVersion) loading.value = false }
}
const replyCreated = async (reply: GuestbookEntry) => {
  replyTarget.value = null
  thread.addReply(reply)
  await nextTick()
  await router.replace({ query: { ...route.query, reply: undefined, focus: String(reply.id) } })
}
watch([rootId, () => userInfo.value?.id], () => { void refresh() }, { immediate: true })
watch(focusId, () => { if (!loading.value) void revealFocus().then(openLinkedReply) })
</script>
