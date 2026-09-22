<template>
  <div class="h-full min-w-0 overflow-hidden bg-slate-50 p-3 sm:p-4">
    <div v-if="loading" class="flex h-full items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="text-center">
        <LoaderCircle class="mx-auto h-9 w-9 animate-spin text-blue-700" />
        <p class="mt-3 text-sm text-slate-500">正在加载会话…</p>
      </div>
    </div>
    <div v-else class="flex h-full min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <section
        class="h-full w-full shrink-0 flex-col border-r border-slate-200 bg-white sm:w-72 lg:w-80"
        :class="selectedMessage ? 'hidden sm:flex' : 'flex'"
        aria-label="会话列表"
      >
        <header class="flex min-h-20 items-center justify-between border-b border-slate-200 px-5">
          <div>
            <h1 class="text-xl font-bold tracking-tight text-slate-900">我的消息</h1>
            <p class="mt-1 text-xs text-slate-500">与同学的站内私信</p>
          </div>
          <button type="button" aria-label="刷新会话" @click="fetchMessages(currentPage)" class="rounded-xl p-2 text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
            <RefreshCw class="h-5 w-5" :class="{ 'animate-spin': isFetchingMessages }" />
          </button>
        </header>
        <div class="min-h-0 flex-1 overflow-y-auto">
          <div v-for="(message) in finalMessages" :key="message.chatter.id" @click="selectMessage(message)"
            class="cursor-pointer border-b border-slate-100 px-4 py-4 transition-colors" :class="{
              'bg-blue-50': selectedMessage?.chatter.id === message.chatter.id,
              'hover:bg-slate-50': selectedMessage?.chatter.id !== message.chatter.id,
              'hover:bg-blue-100/70': selectedMessage?.chatter.id === message.chatter.id
            }">
            <div class="flex min-w-0 items-start gap-3">
              <div class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
                <UserAvatar
                  :avatar="message.chatter.avatar"
                  :uuid="message.chatter.uuid"
                  :has-avatar="message.chatter.has_avatar"
                  :alt="message.chatter.nickname"
                  class="w-full h-full object-cover"
                />
              </div>
              <div class="flex-1 min-w-0">
                <div class="mb-1 flex items-center justify-between gap-2">
                  <span class="truncate text-sm font-semibold text-slate-900">{{ message.chatter.nickname }}</span>
                  <span v-if="message.unread_count > 0" data-unread-badge class="min-w-5 shrink-0 rounded-full bg-blue-600 px-1.5 py-0.5 text-center text-xs font-bold text-white">
                    {{ message.unread_count }}
                  </span>
                </div>
                <p class="truncate text-sm text-slate-500">
                  {{ message.last_message.content || '开始新对话' }}
                </p>
                <p class="mt-1.5">
                  <Time v-if="message.last_message.datetime" :time="message.last_message.datetime" />
                </p>
              </div>
            </div>
          </div>
          <div v-if="finalMessages.length === 0" class="flex h-full flex-col items-center justify-center px-6 text-center">
            <MessageSquare class="h-10 w-10 text-slate-300" />
            <p class="mt-3 font-medium text-slate-600">暂无消息</p>
            <p class="mt-1 text-sm text-slate-400">从同学主页发起一段对话吧</p>
          </div>
        </div>
        <footer class="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3">
          <button @click="prevPage" :disabled="currentPage === 1"
            class="inline-flex items-center rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-white hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40">
            <ChevronLeft class="w-4 h-4 mr-1" />
            上一页
          </button>
          <span class="text-xs font-medium text-slate-500">{{ currentPage }} / {{ totalPages || 1 }}</span>
          <button @click="nextPage" :disabled="currentPage === totalPages"
            class="inline-flex items-center rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-white hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40">
            下一页
            <ChevronRight class="w-4 h-4 ml-1" />
          </button>
        </footer>
      </section>
      <section class="min-w-0 flex-1 overflow-hidden bg-white" :class="selectedMessage ? 'flex' : 'hidden sm:flex'" aria-label="当前对话">
        <ChatView v-if="selectedMessage" :chatTarget="selectedMessage" @read="handleConversationRead" @close="selectedMessage = null" />
        <div v-else class="flex h-full flex-1 flex-col items-center justify-center bg-slate-50/70 px-6 text-center">
          <div class="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <MessageSquare class="h-9 w-9 text-blue-600" />
          </div>
          <p class="mt-5 text-lg font-semibold text-slate-700">
            {{ messages?.length === 0 ? '暂时还没有消息' : '请选择一个对话' }}
          </p>
          <p class="mt-2 text-sm text-slate-400">
            {{ messages?.length === 0 ? '开始与他人交流吧' : '点击左侧列表开始聊天' }}
          </p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted, nextTick } from 'vue'
import ChatView from './ChatView.vue'
import { api } from '@/lib/requests'
import { useMessage } from 'naive-ui'
import { useRoute } from 'vue-router'
import { APIUserMessageList } from '@/types/api/messages/inbox'
import { RefreshCw, MessageSquare, ChevronLeft, ChevronRight, LoaderCircle } from 'lucide-vue-next'
import UserAvatar from '@/components/common/UserAvatar.vue'
import Time from '@/components/tinyComponents/Time.vue'

// TODO: Change this to inf scroll
const route = useRoute()
const message = useMessage()
const loading = ref(true)
const messages = ref<APIUserMessageList['response']['results'] | null>(null)
const totalPages = ref(0)
const currentPage = ref(1)
const selectedMessage = ref<
  APIUserMessageList['response']['results'][0] | null
>(null)
const isFetchingMessages = ref(false)

const fetchMessages = async (page: number = 1) => {
  if (isFetchingMessages.value) return
  try {
    isFetchingMessages.value = true
    const resp = await api.get({
      url: '/api/message/user/',
      query: { page },
    })
    if (resp.status.toString().startsWith('2')) {
      messages.value = resp.data.contents.results
      totalPages.value = resp.data.contents.max_page
      currentPage.value = page
      const selectedId = selectedMessage.value?.chatter.id
      if (selectedId) {
        selectedMessage.value = messages.value.find(item => item.chatter.id === selectedId) || selectedMessage.value
      }
    }
  } catch (e) {
    console.error('Error fetching messages:', e)
    message.error('获取消息失败，请重试')
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

onMounted(async () => {
  const talkToQuery = route.query.talkTo as string | undefined
  if (talkToQuery) {
    const userId = Number(talkToQuery)
    if (!isNaN(userId)) {
      const msg = messages.value?.find((msg) => msg.chatter.id === userId)
      if (msg) {
        selectedMessage.value = msg
      } else {
        // Fetch the user info
        try {
          const resp = await api.get({
            url: '/api/user/profile/:id/',
            params: { id: userId },
          })
          if (resp.status.toString().startsWith('2')) {
            newMessage.value = {
              chatter: {
                id: resp.data.contents.id,
                nickname: resp.data.contents.nickname,
                avatar: resp.data.contents.avatar,
                uuid: resp.data.contents.uuid,
                has_avatar: resp.data.contents.has_avatar,
              },
            }
          }
        } catch (e) {
          console.error('Error fetching messages:', e)
          message.error('获取消息对象失败，请重试')
        } finally {
        }
      }
    } else {
      message.error('无效的对话对象')
      return
    }
  }
  loading.value = true
  await fetchMessages()
  await nextTick()
  if (messages.value && finalMessages.value.find((msg) => msg.chatter.id === newMessage.value?.chatter.id)) {
    selectedMessage.value = finalMessages.value.find((msg) => msg.chatter.id === newMessage.value?.chatter.id)!
  }
  loading.value = false
  fetchInterval.value = setInterval(() => fetchMessages(currentPage.value), 5000) as unknown as number
})

onUnmounted(() => {
  if (fetchInterval.value) {
    clearInterval(fetchInterval.value)
  }
})
</script>
