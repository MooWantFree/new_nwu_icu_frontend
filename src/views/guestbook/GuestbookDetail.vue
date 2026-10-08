<template>
  <main :class="isAnnouncements ? 'min-h-[calc(100vh-7rem)] bg-zinc-50 text-zinc-950' : undefined">
    <div :class="isAnnouncements ? 'mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8' : 'mx-auto max-w-4xl px-4 py-8 sm:px-6'">
      <h1 v-if="isAnnouncements" class="sr-only">公告详情</h1>
      <RouterLink :to="isAnnouncements ? '/announcements' : '/guestbook'" :class="isAnnouncements ? 'mb-6 inline-flex items-center gap-2 rounded-sm text-sm text-zinc-500 transition-colors hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2' : 'mb-6 inline-block text-sm text-blue-700 hover:underline'">
        <ArrowLeft v-if="isAnnouncements" class="h-4 w-4" aria-hidden="true" />
        <template v-else>← </template>返回{{ isAnnouncements ? '公告栏' : '留言板' }}
      </RouterLink>
      <template v-if="loading">
        <GuestbookListSkeleton v-if="isAnnouncements" board="announcements" :count="1" />
        <div v-else class="py-16 text-center text-gray-500">加载讨论中…</div>
      </template>
      <template v-else-if="entry">
        <div v-if="!userInfo && isAnnouncements" class="mb-4 flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-500">
          <p>登录后可参与讨论。</p>
          <RouterLink :to="{ name: 'login', query: { redirect: route.fullPath, intent: 'announcements' } }" class="shrink-0 rounded-sm font-medium text-zinc-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400">登录</RouterLink>
        </div>
        <p v-else-if="!userInfo" class="mb-4 text-sm text-gray-600">登录后可参与讨论。</p>
        <GuestbookThreadNode :key="entry.id" :entry-id="entry.id" :thread="thread" :level="0" :focus-id="focusId" :pending="pending"
          :reply-target-id="replyTarget" :reply-user-id="userInfo?.id" :board="board"
          @like="setLike" @reply="startReply" @delete="remove" @report="report"
          @cancel-reply="replyTarget = null" @reply-created="replyCreated" />
      </template>
      <div v-else :class="isAnnouncements ? 'rounded-xl border border-zinc-200 bg-white px-5 py-14 text-center shadow-sm sm:px-6' : 'py-16 text-center text-gray-500'" role="alert">
        <template v-if="isAnnouncements">
          <CircleAlert class="mx-auto h-6 w-6 text-red-500" aria-hidden="true" />
          <p class="mt-3 text-sm font-medium text-zinc-950">公告暂时无法加载</p>
          <p class="mt-2 text-sm text-zinc-500">公告不存在，或当前无法获取内容。</p>
          <button type="button" class="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2" @click="refresh">
            <RefreshCw class="h-4 w-4" aria-hidden="true" />
            重试
          </button>
        </template>
        <template v-else>留言不存在或暂时无法加载。<button class="ml-2 text-blue-700" @click="refresh">重试</button></template>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { ArrowLeft, CircleAlert, RefreshCw } from 'lucide-vue-next'
import { useShadcnToast } from '@/lib/useShadcnToast'
import GuestbookListSkeleton from '@/components/guestbook/GuestbookListSkeleton.vue'
import GuestbookThreadNode from '@/components/guestbook/GuestbookThreadNode.vue'
import { api } from '@/lib/requests'
import { useUser } from '@/lib/useUser'
import { createGuestbookThread } from '@/lib/useGuestbookThread'
import { useGuestbookActions } from '@/lib/useGuestbookActions'
import type { DiscussionBoard, GuestbookEntry } from '@/types/api/guestbook'

const route = useRoute()
const router = useRouter()
const isAnnouncements = computed(() => route.name === 'announcementDetail')
const board = computed<DiscussionBoard>(() => isAnnouncements.value ? 'announcements' : 'guestbook')
const legacyMessage = useMessage()
const shadcnMessage = useShadcnToast()
const message = computed(() => isAnnouncements.value ? shadcnMessage : legacyMessage)
const { userInfo } = useUser()
const { pending, requireLogin, setLike, remove, report } = useGuestbookActions(board)
const root = ref<number | null>(null)
const loading = ref(true)
const replyTarget = ref<number | null>(null)
const rootId = computed(() => Number(route.params.id))
const focusId = computed(() => Number(route.query.focus || route.query.reply || 0) || undefined)
const thread = createGuestbookThread(async (id, page) => {
  const request = { params: { id }, query: { page, pageSize: 10 } }
  const response = board.value === 'announcements'
    ? await api.get({ url: '/api/announcements/:id/replies/', ...request })
    : await api.get({ url: '/api/guestbook/:id/replies/', ...request })
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
    const context = board.value === 'announcements'
      ? await api.get({ url: '/api/announcements/:id/context/', params: { id } })
      : await api.get({ url: '/api/guestbook/:id/context/', params: { id } })
    if (version !== focusVersion || context.status !== 200 || context.content.root_id !== root.value) return
    thread.reveal(context.content.entries)
    await nextTick()
    document.getElementById(`guestbook-${id}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  } catch { message.value.error('定位回复失败，请重试') }
}
const startReply = (target: GuestbookEntry) => {
  if (target.is_deleted || !requireLogin(`/${board.value}/${target.root_id ?? target.id}?reply=${target.id}`)) return
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
    const response = board.value === 'announcements'
      ? await api.get({ url: '/api/announcements/:id/', params: { id: rootId.value } })
      : await api.get({ url: '/api/guestbook/:id/', params: { id: rootId.value } })
    if (version !== requestVersion) return
    if (response.status !== 200) throw new Error(`${isAnnouncements.value ? '公告' : '留言'}不存在`)
    root.value = response.content.entry.id
    thread.reset(response.content.entry)
    await thread.loadAll(response.content.entry.id)
    if (version !== requestVersion) return
    loading.value = false
    await revealFocus()
    if (version === requestVersion) openLinkedReply()
  } catch (error) {
    if (version === requestVersion) {
      message.value.error(error instanceof Error ? error.message : '获取讨论失败')
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
watch([rootId, board, () => userInfo.value?.id], () => { void refresh() }, { immediate: true })
watch(focusId, () => { if (!loading.value) void revealFocus().then(openLinkedReply) })
</script>
