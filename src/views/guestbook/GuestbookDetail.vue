<template>
  <main class="min-h-[calc(100vh-7rem)] bg-zinc-50 text-zinc-950">
    <div class="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <h1 class="sr-only">{{ isAnnouncements ? '公告详情' : '留言详情' }}</h1>
      <RouterLink :to="isAnnouncements ? '/announcements' : '/guestbook'" class="mb-6 inline-flex items-center gap-2 rounded-sm text-sm text-zinc-500 transition-colors hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2">
        <ArrowLeft class="h-4 w-4" aria-hidden="true" />
        返回{{ isAnnouncements ? '公告栏' : '留言板' }}
      </RouterLink>
      <template v-if="loading">
        <GuestbookListSkeleton :board="board" :count="1" />
      </template>
      <template v-else-if="entry">
        <div v-if="!userInfo" class="mb-4 flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-500">
          <p>登录后可参与讨论。</p>
          <RouterLink :to="{ name: 'login', query: { redirect: route.fullPath, intent: board } }" class="shrink-0 rounded-sm font-medium text-zinc-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400">登录</RouterLink>
        </div>
        <GuestbookThreadNode :key="entry.id" :entry-id="entry.id" :thread="thread" :level="0" :focus-id="focusId" :pending="pending"
          :reply-target-id="replyTarget" :reply-user-id="userInfo?.id" :board="board"
          @like="setLike" @reply="startReply" @delete="remove" @report="report"
          @cancel-reply="replyTarget = null" @reply-created="replyCreated" />
      </template>
      <div v-else class="rounded-xl border border-zinc-200 bg-white px-5 py-14 text-center shadow-sm sm:px-6" role="alert">
        <CircleAlert class="mx-auto h-6 w-6 text-red-500" aria-hidden="true" />
        <p class="mt-3 text-sm font-medium text-zinc-950">{{ isAnnouncements ? '公告' : '留言' }}暂时无法加载</p>
        <p class="mt-2 text-sm text-zinc-500">{{ isAnnouncements ? '公告' : '留言' }}不存在，或当前无法获取内容。</p>
        <button type="button" class="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2" @click="refresh">
          <RefreshCw class="h-4 w-4" aria-hidden="true" />
          重试
        </button>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
const message = useShadcnToast()
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
  } catch { message.error('定位回复失败，请重试') }
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
watch([rootId, board, () => userInfo.value?.id], () => { void refresh() }, { immediate: true })
watch(focusId, () => { if (!loading.value) void revealFocus().then(openLinkedReply) })
</script>
