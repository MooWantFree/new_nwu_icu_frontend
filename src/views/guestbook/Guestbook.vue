<template>
  <main class="mx-auto max-w-5xl px-4 py-8 sm:px-6">
    <div class="mb-8 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">留言板</h1>
        <p class="mt-2 text-gray-600">分享想法，也欢迎友善地参与讨论。</p>
      </div>
      <button class="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-blue-700" @click="openComposer">添加留言</button>
    </div>
    <GuestbookComposerModal v-if="composerOpen && userInfo" :user-id="userInfo.id" @close="composerOpen = false" @created="created" />
    <div v-if="loading" class="py-16 text-center text-gray-500">加载留言中…</div>
    <div v-else-if="entries.length" class="space-y-4">
      <GuestbookEntryCard v-for="entry in entries" :key="entry.id" :entry="entry" show-thread-link :like-pending="likePending === entry.id" @like="setLike" @reply="reply" @delete="remove" @report="report" />
    </div>
    <div v-else class="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center text-gray-500">还没有留言，来写下第一条吧。</div>
    <div v-if="pageCount > 1" class="mt-8 flex justify-center"><n-pagination v-model:page="page" :page-count="pageCount" @update:page="load" /></div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import GuestbookComposerModal from '@/components/guestbook/GuestbookComposerModal.vue'
import GuestbookEntryCard from '@/components/guestbook/GuestbookEntryCard.vue'
import { api } from '@/lib/requests'
import { useUser } from '@/lib/useUser'
import type { GuestbookEntry } from '@/types/api/guestbook'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const { isLoggedIn, userInfo } = useUser()
const entries = ref<GuestbookEntry[]>([])
const loading = ref(true)
const page = ref(Number(route.query.page) || 1)
const pageCount = ref(0)
const composerOpen = ref(false)
const likePending = ref<number | null>(null)

const load = async (requestedPage = page.value) => {
  loading.value = true
  try {
    const response = await api.get({ url: '/api/guestbook/', query: { page: requestedPage, pageSize: 10 } })
    if (response.status !== 200) throw new Error('获取留言失败')
    entries.value = response.content.results
    pageCount.value = response.content.max_page
    page.value = requestedPage
    if (route.query.page !== String(requestedPage)) await router.replace({ query: { ...route.query, page: String(requestedPage) } })
  } catch (error) {
    message.error(error instanceof Error ? error.message : '获取留言失败')
  } finally {
    loading.value = false
  }
}
const openComposer = async () => {
  if (!isLoggedIn.value) {
    await router.push({ name: 'login', query: { redirect: '/guestbook?compose=1', reason: '请先登录，再发布留言' } })
    return
  }
  composerOpen.value = true
}
const created = () => { composerOpen.value = false; void load(1) }
const reply = async (entry: GuestbookEntry) => { await router.push(`/guestbook/${entry.root_id ?? entry.id}?reply=${entry.id}`) }
const setLike = async (entry: GuestbookEntry) => {
  likePending.value = entry.id
  try {
    const response = await api.put({ url: '/api/guestbook/:id/like/', params: { id: entry.id }, query: { liked: !entry.liked_by_me } })
    if (response.status !== 200) throw new Error()
    entry.liked_by_me = response.content.liked
    entry.like_count = response.content.like_count
  } catch { message.error('点赞失败，请稍后重试') } finally { likePending.value = null }
}
const remove = async (entry: GuestbookEntry) => {
  const response = await api.delete({ url: '/api/guestbook/:id/', params: { id: entry.id } })
  if (response.status === 200) { entry.is_deleted = true; entry.content = '[内容已删除]' } else message.error('删除失败，请稍后重试')
}
const report = async (entry: GuestbookEntry, reason: 'spam' | 'abuse' | 'privacy' | 'other') => {
  const detail = reason === 'other' ? (prompt('请补充举报说明（可选，最多 500 字）：') || '') : ''
  const response = await api.post({ url: '/api/guestbook/:id/reports/', params: { id: entry.id }, query: { reason, detail } })
  if (response.status < 300) message.success(response.content.created ? '举报已提交' : '你已经举报过此内容')
  else message.error('举报失败，请稍后重试')
}

watch(() => [isLoggedIn.value, route.query.compose], ([loggedIn, compose]) => { if (loggedIn && compose === '1') { composerOpen.value = true; void router.replace({ query: { ...route.query, compose: undefined } }) } }, { immediate: true })
onMounted(() => { void load() })
</script>
