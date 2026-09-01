<template>
  <main class="mx-auto max-w-4xl px-4 py-8 sm:px-6">
    <RouterLink to="/guestbook" class="mb-6 inline-block text-sm text-blue-700 hover:underline">← 返回留言板</RouterLink>
    <GuestbookComposerModal v-if="replyTarget && userInfo" :user-id="userInfo.id" :parent-id="replyTarget" @close="closeReply" @created="replyCreated" />
    <div v-if="loading" class="py-16 text-center text-gray-500">加载讨论中…</div>
    <GuestbookThreadNode v-else-if="entry && userInfo" :entry="entry" :level="0" :user-id="userInfo.id" :focus-id="focusId" :open-path="openPath" @changed="refresh" />
    <div v-else-if="entry" class="rounded-xl border border-gray-200 bg-white p-4"><p class="mb-3 text-sm text-gray-600">登录后可参与讨论。</p><GuestbookEntryCard :entry="entry" /></div>
    <div v-else class="py-16 text-center text-gray-500">留言不存在或已被移除。</div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import GuestbookEntryCard from '@/components/guestbook/GuestbookEntryCard.vue'
import GuestbookComposerModal from '@/components/guestbook/GuestbookComposerModal.vue'
import GuestbookThreadNode from '@/components/guestbook/GuestbookThreadNode.vue'
import { api } from '@/lib/requests'
import { useUser } from '@/lib/useUser'
import type { GuestbookEntry } from '@/types/api/guestbook'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const { userInfo } = useUser()
const entry = ref<GuestbookEntry | null>(null)
const loading = ref(true)
const openPath = ref<number[]>([])
const rootId = computed(() => Number(route.params.id))
const focusId = computed(() => Number(route.query.focus || route.query.reply || 0) || undefined)
const replyTarget = computed(() => Number(route.query.reply || 0) || undefined)

const refresh = async () => {
  loading.value = true
  try {
    const response = await api.get({ url: '/api/guestbook/:id/', params: { id: rootId.value } })
    if (response.status !== 200) throw new Error('留言不存在')
    entry.value = response.content.entry
    if (focusId.value) {
      const context = await api.get({ url: '/api/guestbook/:id/context/', params: { id: focusId.value } })
      if (context.status === 200) openPath.value = context.content.path
    }
  } catch (error) { message.error(error instanceof Error ? error.message : '获取讨论失败'); entry.value = null } finally { loading.value = false }
}
watch(() => route.fullPath, () => { void refresh() })
const closeReply = () => { void router.replace({ query: { ...route.query, reply: undefined } }) }
const replyCreated = () => { closeReply(); void refresh() }
onMounted(() => { void refresh() })
</script>
