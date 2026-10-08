<template>
  <AppPageLayout
    :title="isAnnouncements ? '公告栏' : '留言板'"
    appearance="shadcn"
    width="reading"
  >
    <template v-if="!loading && !loadFailed && totalEntries > 0" #meta>
      共 {{ totalEntries }} 条{{ itemLabel }}
    </template>
    <template v-if="!isAnnouncements" #actions>
      <button type="button" class="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2" @click="openComposer">
        <Plus class="h-4 w-4" aria-hidden="true" />添加留言
      </button>
    </template>

    <GuestbookComposerModal v-if="composerOpen && userInfo && !isAnnouncements" :key="userInfo.id" :user-id="userInfo.id" :board="board" @close="composerOpen = false" @created="created" />
    <GuestbookListSkeleton v-if="loading" :board="board" />
    <div v-else-if="loadFailed" role="alert" class="rounded-xl border border-zinc-200 bg-white px-5 py-14 text-center shadow-sm sm:px-6">
      <CircleAlert class="mx-auto h-6 w-6 text-red-500" aria-hidden="true" />
      <p class="mt-3 text-sm font-medium text-zinc-950">{{ itemLabel }}加载失败</p>
      <p class="mt-2 text-sm text-zinc-500">暂时无法获取{{ itemLabel }}，请稍后重试。</p>
      <button type="button" class="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2" @click="load">
        <RefreshCw class="h-4 w-4" aria-hidden="true" />
        重试
      </button>
    </div>
    <div v-else-if="entries.length" class="space-y-4">
      <GuestbookThreadNode v-for="entry in entries" :key="entry.id" :entry-id="entry.id" :thread="thread" :level="0"
        :pending="pending" :reply-target-id="replyTarget" :reply-user-id="userInfo?.id" :board="board" :link-title="isAnnouncements"
        @like="setLike" @reply="reply" @delete="remove" @report="report"
        @cancel-reply="replyTarget = null" @reply-created="replyCreated" />
    </div>
    <div v-else class="rounded-xl border border-zinc-200 bg-white px-5 py-14 text-center shadow-sm sm:px-6">
      <component :is="isAnnouncements ? Megaphone : MessageSquare" class="mx-auto mb-3 h-6 w-6 text-zinc-400" aria-hidden="true" />
      <p class="text-sm text-zinc-500">{{ isAnnouncements ? '暂无公告。' : '还没有留言，来写下第一条吧。' }}</p>
    </div>
    <div v-if="pageCount > 1 && !loading && !loadFailed" class="mt-8 flex justify-center">
      <ReviewPagination :page="page" :page-count="pageCount" @update:page="changePage" />
    </div>
  </AppPageLayout>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import GuestbookComposerModal from '@/components/guestbook/GuestbookComposerModal.vue'
import GuestbookListSkeleton from '@/components/guestbook/GuestbookListSkeleton.vue'
import GuestbookThreadNode from '@/components/guestbook/GuestbookThreadNode.vue'
import AppPageLayout from '@/components/layout/AppPageLayout.vue'
import ReviewPagination from '@/components/courseReview/ReviewPagination.vue'
import { CircleAlert, Megaphone, MessageSquare, Plus, RefreshCw } from 'lucide-vue-next'
import { api } from '@/lib/requests'
import { useUser } from '@/lib/useUser'
import { useGuestbookActions } from '@/lib/useGuestbookActions'
import { createGuestbookThread } from '@/lib/useGuestbookThread'
import type { DiscussionBoard, GuestbookEntry } from '@/types/api/guestbook'

const route = useRoute()
const router = useRouter()
const isAnnouncements = computed(() => route.name === 'announcements')
const board = computed<DiscussionBoard>(() => isAnnouncements.value ? 'announcements' : 'guestbook')
const itemLabel = computed(() => isAnnouncements.value ? '公告' : '留言')
const { userInfo } = useUser()
const { pending, requireLogin, setLike, remove, report } = useGuestbookActions(board)
const rootIds = ref<number[]>([])
const loading = ref(true)
const loadFailed = ref(false)
const page = computed(() => Math.max(1, Math.floor(Number(route.query.page) || 1)))
const pageCount = ref(0)
const totalEntries = ref(0)
const composerOpen = ref(false)
const replyTarget = ref<number | null>(null)
let requestVersion = 0
const thread = createGuestbookThread(async (id, replyPage) => {
  const request = { params: { id }, query: { page: replyPage, pageSize: 100 } }
  const response = board.value === 'announcements'
    ? await api.get({ url: '/api/announcements/:id/replies/', ...request })
    : await api.get({ url: '/api/guestbook/:id/replies/', ...request })
  if (response.status !== 200) throw new Error('获取回复失败')
  return response.content
})
const entries = computed(() => rootIds.value.map(id => thread.entries[id]).filter((entry): entry is GuestbookEntry => Boolean(entry)))

const load = async () => {
  const version = ++requestVersion
  loading.value = true
  loadFailed.value = false
  try {
    const query = { page: page.value, pageSize: 10 }
    const response = board.value === 'announcements'
      ? await api.get({ url: '/api/announcements/', query })
      : await api.get({ url: '/api/guestbook/', query })
    if (version !== requestVersion) return
    if (response.status !== 200) throw new Error('获取留言失败')
    thread.resetAll(response.content.results)
    rootIds.value = response.content.results.map(entry => entry.id)
    pageCount.value = response.content.max_page
    totalEntries.value = response.content.count ?? response.content.results.length
    await Promise.all(rootIds.value.map(id => thread.loadAll(id)))
  } catch {
    if (version === requestVersion) loadFailed.value = true
  } finally { if (version === requestVersion) loading.value = false }
}
const changePage = (value: number) => router.push({ query: { ...route.query, page: String(value) } })
const openComposer = () => {
  if (isAnnouncements.value) return
  if (requireLogin(`${isAnnouncements.value ? '/announcements' : '/guestbook'}?compose=1`)) composerOpen.value = true
}
const created = async () => {
  composerOpen.value = false
  if (page.value !== 1) await changePage(1)
  else await load()
}
const reply = (entry: GuestbookEntry) => {
  if (entry.is_deleted || !requireLogin(isAnnouncements.value ? '/announcements' : '/guestbook')) return
  thread.branch(entry.id).collapsed = false
  replyTarget.value = entry.id
}
const replyCreated = async (entry: GuestbookEntry) => {
  thread.addReply(entry)
  replyTarget.value = null
  await nextTick()
  document.getElementById(`guestbook-${entry.id}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
}

watch(board, () => { composerOpen.value = false; replyTarget.value = null })
watch([page, board, () => userInfo.value?.id], () => { void load() }, { immediate: true })
watch(() => [userInfo.value?.id, route.query.compose], async ([user, compose]) => {
  if (user && compose === '1' && !isAnnouncements.value) {
    await router.replace({ query: { ...route.query, compose: undefined } })
    composerOpen.value = true
  }
}, { immediate: true })
</script>
