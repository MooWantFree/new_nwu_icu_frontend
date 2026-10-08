<template>
  <div class="h-full min-w-0 overflow-hidden bg-zinc-50">
    <div v-if="loading" class="flex h-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white text-sm text-zinc-500" role="status">
      <LoaderCircle class="h-5 w-5 animate-spin" aria-hidden="true" />正在加载会话…
    </div>
    <div v-else class="flex h-full min-w-0 overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <section class="h-full w-full shrink-0 flex-col border-r border-zinc-200 bg-white sm:w-64 lg:w-72" :class="selectedMessage ? 'hidden sm:flex' : 'flex'" aria-label="会话列表">
        <header class="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-zinc-200 px-4">
          <div class="min-w-0"><h1 class="truncate text-lg font-semibold tracking-tight">我的消息</h1><p class="mt-0.5 text-xs text-zinc-500">站内私信</p></div>
          <button type="button" aria-label="刷新会话" :disabled="isFetchingMessages" class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50" @click="fetchMessages(currentPage)">
            <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': isFetchingMessages }" aria-hidden="true" />
          </button>
        </header>
        <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div v-if="loadError" class="m-3 rounded-md border border-red-200 bg-red-50/50 p-3 text-sm" role="alert">
            <p class="text-red-600">{{ loadError }}</p>
            <button type="button" :disabled="isFetchingMessages" class="mt-2 inline-flex h-8 items-center rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium shadow-sm hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:opacity-50" @click="fetchMessages(currentPage)">{{ finalMessages.length ? '重试' : '重新加载' }}</button>
          </div>
          <button v-for="item in finalMessages" :key="item.chatter.id" type="button" :aria-label="`与${item.chatter.nickname}的对话`" :aria-pressed="selectedMessage?.chatter.id === item.chatter.id"
            class="block w-full border-b border-zinc-100 px-4 py-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-400" :class="selectedMessage?.chatter.id === item.chatter.id ? 'bg-zinc-100' : 'bg-white hover:bg-zinc-50'" @click="selectMessage(item)">
            <span class="flex min-w-0 items-start gap-3">
              <span class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-zinc-100">
                <UserAvatar :avatar="item.chatter.avatar" :uuid="item.chatter.uuid" :has-avatar="item.chatter.has_avatar" :alt="item.chatter.nickname" class="h-full w-full object-cover" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="mb-1 flex items-center justify-between gap-2"><span class="truncate text-sm font-medium">{{ item.chatter.nickname }}</span><span v-if="item.unread_count > 0" data-unread-badge class="min-w-5 shrink-0 rounded-md bg-zinc-950 px-1.5 py-0.5 text-center text-xs font-medium tabular-nums text-white">{{ item.unread_count > 99 ? '99+' : item.unread_count }}</span></span>
                <span class="block truncate text-xs leading-5 text-zinc-500">{{ item.last_message.content || '开始新对话' }}</span>
                <span v-if="item.last_message.datetime" class="mt-1.5 block text-xs text-zinc-400"><Time :time="item.last_message.datetime" mode="message" /></span>
              </span>
            </span>
          </button>
          <div v-if="!loadError && finalMessages.length === 0" class="flex h-full flex-col items-center justify-center gap-3 px-5 text-center">
            <span class="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50"><MessageSquare class="h-5 w-5 text-zinc-400" aria-hidden="true" /></span>
            <p class="text-sm font-medium">暂无消息</p><p class="text-xs text-zinc-500">从同学主页发起对话</p>
          </div>
        </div>
        <footer class="flex shrink-0 items-center justify-between gap-2 border-t border-zinc-200 px-4 py-3">
          <button type="button" aria-label="上一页" :disabled="currentPage <= 1 || isFetchingMessages" class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-40" @click="prevPage"><ChevronLeft class="h-4 w-4" aria-hidden="true" /></button>
          <span class="text-xs tabular-nums text-zinc-500">{{ currentPage }} / {{ totalPages || 1 }}</span>
          <button type="button" aria-label="下一页" :disabled="currentPage >= totalPages || isFetchingMessages" class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-40" @click="nextPage"><ChevronRight class="h-4 w-4" aria-hidden="true" /></button>
        </footer>
      </section>
      <section class="min-w-0 flex-1 overflow-hidden bg-white" :class="selectedMessage ? 'flex' : 'hidden sm:flex'" aria-label="当前对话">
        <ChatView v-if="selectedMessage" :chatTarget="selectedMessage" @read="handleConversationRead" @close="closeConversation" />
        <div v-else class="flex h-full flex-1 flex-col items-center justify-center gap-3 bg-zinc-50/50 px-6 text-center">
          <span class="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white"><MessageSquare class="h-5 w-5 text-zinc-400" aria-hidden="true" /></span>
          <p class="text-sm font-medium">{{ messages?.length === 0 ? '暂时还没有消息' : '请选择一个对话' }}</p>
          <p class="text-xs text-zinc-500">{{ messages?.length === 0 ? '从同学主页发起对话' : '点击左侧列表开始聊天' }}</p>
        </div>
      </section>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, watch, onMounted, computed, onUnmounted } from 'vue'
import ChatView from './ChatView.vue'
import { api } from '@/lib/requests'
import { useShadcnToast } from '@/lib/useShadcnToast'
import { useRoute, useRouter } from 'vue-router'
import { APIUserMessageList } from '@/types/api/messages/inbox'
import { RefreshCw, MessageSquare, ChevronLeft, ChevronRight, LoaderCircle } from 'lucide-vue-next'
import UserAvatar from '@/components/common/UserAvatar.vue'
import Time from '@/components/tinyComponents/Time.vue'

// TODO: Change this to inf scroll
const route = useRoute()
const router = useRouter()
const message = useShadcnToast()
const loadError = ref('')
const loading = ref(true)
const messages = ref<APIUserMessageList['response']['results'] | null>(null)
const totalPages = ref(0)
const currentPage = ref(1)
const selectedMessage = ref<
  APIUserMessageList['response']['results'][0] | null
>(null)
const isFetchingMessages = ref(false)
let active = true

const fetchMessages = async (page: number = 1) => {
  if (isFetchingMessages.value) return
  try {
    isFetchingMessages.value = true
    const resp = await api.get({
      url: '/api/message/user/',
      query: { page },
    })
    if (!active) return
    if (resp.status.toString().startsWith('2')) {
      messages.value = resp.data.contents.results
      totalPages.value = resp.data.contents.max_page
      currentPage.value = page
      const selectedId = selectedMessage.value?.chatter.id
      if (selectedId) {
        selectedMessage.value = messages.value.find(item => item.chatter.id === selectedId) || selectedMessage.value
      }
      loadError.value = ''
    } else throw new Error('Failed to fetch conversations')
  } catch (e) {
    if (!active) return
    console.error('Error fetching messages:', e)
    if (!loadError.value) message.error('获取消息失败，请重试')
    loadError.value = '获取消息失败，请重试'
  } finally {
    isFetchingMessages.value = false
  }
}

const nextPage = () =>
  currentPage.value < totalPages.value && fetchMessages(currentPage.value + 1)
const prevPage = () =>
  currentPage.value > 1 && fetchMessages(currentPage.value - 1)
const selectMessage = (msg: APIUserMessageList['response']['results'][0]) => {
  selectedMessage.value = msg
  void router.push({ query: { ...route.query, talkTo: String(msg.chatter.id) } })
}
const closeConversation = () => {
  selectedMessage.value = null
  void router.push({ query: { ...route.query, talkTo: undefined } })
}

const handleConversationRead = (chatterId: number) => {
  if (selectedMessage.value?.chatter.id === chatterId) selectedMessage.value.unread_count = 0
  const listed = messages.value?.find(item => item.chatter.id === chatterId)
  if (listed) listed.unread_count = 0
}

const newMessage = ref<{
  chatter: {
    id: number
    nickname: string
    avatar: string
    uuid: string
    has_avatar: boolean
  }
}>()

const finalMessages = computed(() => {
  const result = [...(messages.value || [])]
  if (newMessage.value && !result.find((msg) => msg.chatter.id === newMessage.value!.chatter.id)) {
    result.unshift({
      conversation_id: 0,
      chatter: {
        id: newMessage.value.chatter.id,
        nickname: newMessage.value.chatter.nickname,
        avatar: newMessage.value.chatter.avatar,
        uuid: newMessage.value.chatter.uuid,
        has_avatar: newMessage.value.chatter.has_avatar,
      },
      last_message: {
        id: null,
        content: '',
        datetime: null,
      },
      unread_count: 0,
    })
  }
  return result
})

const fetchInterval = ref<number | null>(null)

watch(() => route.query.talkTo, async (target, _oldTarget, onCleanup) => {
  let current = true
  onCleanup(() => { current = false })
  selectedMessage.value = null
  newMessage.value = undefined
  if (target === undefined) return
  const userId = Number(target)
  if (typeof target !== 'string' || !Number.isSafeInteger(userId) || userId <= 0) {
    message.error('无效的对话对象')
    return
  }
  const existing = messages.value?.find(msg => msg.chatter.id === userId)
  if (existing) {
    selectedMessage.value = existing
    return
  }
  try {
    const resp = await api.get({ url: '/api/user/profile/:id/', params: { id: userId } })
    if (!current) return
    if (resp.status !== 200) throw new Error('Failed to fetch conversation target')
    newMessage.value = { chatter: {
      id: resp.content.id, nickname: resp.content.nickname, avatar: resp.content.avatar,
      uuid: resp.content.uuid, has_avatar: resp.content.has_avatar,
    } }
    selectedMessage.value = finalMessages.value.find(msg => msg.chatter.id === userId) || null
  } catch (error) {
    if (current) message.error('获取消息对象失败，请重试')
  }
}, { immediate: true })

onMounted(async () => {
  await fetchMessages()
  if (!active) return
  loading.value = false
  fetchInterval.value = setInterval(() => fetchMessages(currentPage.value), 5000) as unknown as number
})

onUnmounted(() => {
  active = false
  if (fetchInterval.value) {
    clearInterval(fetchInterval.value)
  }
})
</script>
