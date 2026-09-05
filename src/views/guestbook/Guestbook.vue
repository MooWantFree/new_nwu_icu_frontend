<template>
  <AppPageLayout
    title="留言板"
    description="分享想法，也欢迎友善地参与讨论。"
  >
    <template #actions>
      <button class="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-blue-700" @click="openComposer">添加留言</button>
    </template>

    <GuestbookComposerModal v-if="composerOpen && userInfo" :key="userInfo.id" :user-id="userInfo.id" @close="composerOpen = false" @created="created" />
    <div v-if="loading" class="py-16 text-center text-gray-500">加载留言中…</div>
    <div v-else-if="loadFailed" class="py-16 text-center text-gray-500">获取留言失败。<button class="ml-2 text-blue-700" @click="load">重试</button></div>
    <div v-else-if="entries.length" class="space-y-4">
      <GuestbookThreadNode v-for="entry in entries" :key="entry.id" :entry-id="entry.id" :thread="thread" :level="0"
        :pending="pending" :reply-target-id="replyTarget" :reply-user-id="userInfo?.id"
        @like="setLike" @reply="reply" @delete="remove" @report="report"
        @cancel-reply="replyTarget = null" @reply-created="replyCreated" />
    </div>
    <div v-else class="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center text-gray-500">还没有留言，来写下第一条吧。</div>
    <div v-if="pageCount > 1" class="mt-8 flex justify-center"><n-pagination :page="page" :page-count="pageCount" @update:page="changePage" /></div>
  </AppPageLayout>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import GuestbookComposerModal from '@/components/guestbook/GuestbookComposerModal.vue'
import GuestbookThreadNode from '@/components/guestbook/GuestbookThreadNode.vue'
import AppPageLayout from '@/components/layout/AppPageLayout.vue'
import { api } from '@/lib/requests'
import { useUser } from '@/lib/useUser'
import { useGuestbookActions } from '@/lib/useGuestbookActions'
import { createGuestbookThread } from '@/lib/useGuestbookThread'
import type { GuestbookEntry } from '@/types/api/guestbook'

const route = useRoute()
const router = useRouter()
const { userInfo } = useUser()
const { pending, requireLogin, setLike, remove, report } = useGuestbookActions()
const rootIds = ref<number[]>([])
const loading = ref(true)
const loadFailed = ref(false)
const page = computed(() => Math.max(1, Math.floor(Number(route.query.page) || 1)))
const pageCount = ref(0)
const composerOpen = ref(false)
const replyTarget = ref<number | null>(null)
let requestVersion = 0
const thread = createGuestbookThread(async (id, replyPage) => {
  const response = await api.get({ url: '/api/guestbook/:id/replies/', params: { id }, query: { page: replyPage, pageSize: 100 } })
  if (response.status !== 200) throw new Error('获取回复失败')
  return response.content
})
const entries = computed(() => rootIds.value.map(id => thread.entries[id]).filter((entry): entry is GuestbookEntry => Boolean(entry)))

const load = async () => {
  const version = ++requestVersion
  loading.value = true
  loadFailed.value = false
  try {
    const response = await api.get({ url: '/api/guestbook/', query: { page: page.value, pageSize: 10 } })
    if (version !== requestVersion) return
    if (response.status !== 200) throw new Error('获取留言失败')
    thread.resetAll(response.content.results)
    rootIds.value = response.content.results.map(entry => entry.id)
    pageCount.value = response.content.max_page
    await Promise.all(rootIds.value.map(id => thread.loadAll(id)))
  } catch {
    if (version === requestVersion) loadFailed.value = true
  } finally { if (version === requestVersion) loading.value = false }
}
const changePage = (value: number) => router.push({ query: { ...route.query, page: String(value) } })
const openComposer = () => {
  if (requireLogin('/guestbook?compose=1')) composerOpen.value = true
}
const created = async () => {
  composerOpen.value = false
  if (page.value !== 1) await changePage(1)
  else await load()
}
const reply = (entry: GuestbookEntry) => {
  if (entry.is_deleted || !requireLogin('/guestbook')) return
  thread.branch(entry.id).collapsed = false
  replyTarget.value = entry.id
}
const replyCreated = async (entry: GuestbookEntry) => {
  thread.addReply(entry)
  replyTarget.value = null
  await nextTick()
  document.getElementById(`guestbook-${entry.id}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
}

watch([page, () => userInfo.value?.id], () => { void load() }, { immediate: true })
watch(() => [userInfo.value?.id, route.query.compose], async ([user, compose]) => {
  if (user && compose === '1') {
    await router.replace({ query: { ...route.query, compose: undefined } })
    composerOpen.value = true
  }
}, { immediate: true })
</script>
