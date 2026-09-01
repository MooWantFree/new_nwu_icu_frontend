<template>
  <main class="mx-auto max-w-5xl px-4 py-8 sm:px-6">
    <div class="mb-8 flex flex-wrap items-center justify-between gap-4">
      <div><h1 class="text-3xl font-bold text-gray-900">留言板</h1><p class="mt-2 text-gray-600">分享想法，也欢迎友善地参与讨论。</p></div>
      <button class="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-blue-700" @click="openComposer">添加留言</button>
    </div>
    <GuestbookComposerModal v-if="composerOpen && userInfo" :key="userInfo.id" :user-id="userInfo.id" @close="composerOpen = false" @created="created" />
    <div v-if="loading" class="py-16 text-center text-gray-500">加载留言中…</div>
    <div v-else-if="loadFailed" class="py-16 text-center text-gray-500">获取留言失败。<button class="ml-2 text-blue-700" @click="load">重试</button></div>
    <div v-else-if="entries.length" class="space-y-4">
      <GuestbookEntryCard v-for="entry in entries" :key="entry.id" :entry="entry" show-thread-link :like-pending="pending.has(entry.id)" @like="setLike" @reply="reply" @delete="remove" @report="report" />
    </div>
    <div v-else class="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center text-gray-500">还没有留言，来写下第一条吧。</div>
    <div v-if="pageCount > 1" class="mt-8 flex justify-center"><n-pagination :page="page" :page-count="pageCount" @update:page="changePage" /></div>
  </main>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import GuestbookComposerModal from '@/components/guestbook/GuestbookComposerModal.vue'
import GuestbookEntryCard from '@/components/guestbook/GuestbookEntryCard.vue'
import { api } from '@/lib/requests'
import { useUser } from '@/lib/useUser'
import { useGuestbookActions } from '@/lib/useGuestbookActions'
import type { GuestbookEntry } from '@/types/api/guestbook'

const route = useRoute()
const router = useRouter()
const { userInfo } = useUser()
const { pending, requireLogin, setLike, remove, report } = useGuestbookActions()
const entries = ref<GuestbookEntry[]>([])
const loading = ref(true)
const loadFailed = ref(false)
const page = computed(() => Math.max(1, Math.floor(Number(route.query.page) || 1)))
const pageCount = ref(0)
const composerOpen = ref(false)
let requestVersion = 0

const load = async () => {
  const version = ++requestVersion
  loading.value = true
  loadFailed.value = false
  try {
    const response = await api.get({ url: '/api/guestbook/', query: { page: page.value, pageSize: 10 } })
    if (version !== requestVersion) return
    if (response.status !== 200) throw new Error('获取留言失败')
    entries.value = response.content.results
    pageCount.value = response.content.max_page
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
  const target = `/guestbook/${entry.root_id ?? entry.id}?reply=${entry.id}`
  if (requireLogin(target)) void router.push(target)
}

watch([page, () => userInfo.value?.id], () => { void load() }, { immediate: true })
watch(() => [userInfo.value?.id, route.query.compose], async ([user, compose]) => {
  if (user && compose === '1') {
    await router.replace({ query: { ...route.query, compose: undefined } })
    composerOpen.value = true
  }
}, { immediate: true })
</script>
