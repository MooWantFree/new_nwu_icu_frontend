<template>
  <div class="min-h-[calc(100vh-4rem)] bg-gray-100">
    <div v-if="loading" class="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div class="p-8 bg-white rounded-lg shadow-md">
        <div class="w-16 h-16 mx-auto mb-4 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
        <p class="text-center text-gray-600">加载中...</p>
      </div>
    </div>
    <div v-else class="flex min-h-[calc(100vh-4rem)]">
      <div class="w-80 bg-white border-r border-l flex flex-col shadow-sm">
        <div class="p-4 border-b flex justify-between items-center">
          <h2 class="text-lg font-semibold text-gray-900">我的消息</h2>
          <button @click="fetchMessages(currentPage)" class="p-2 text-blue-700 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors">
            <RefreshCw class="h-5 w-5" />
          </button>
        </div>
        <div class="overflow-y-auto min-h-[calc(100vh-12rem-8px)]">
          <div v-for="(message) in finalMessages" :key="message.chatter.id" @click="selectMessage(message)"
            class="p-4 border-b cursor-pointer transition duration-150 ease-in-out" :class="{
              'bg-blue-50': selectedMessage?.chatter.id === message.chatter.id,
              'hover:bg-gray-100': selectedMessage?.chatter.id !== message.chatter.id,
              'hover:bg-blue-100': selectedMessage?.chatter.id === message.chatter.id
            }">
            <div class="flex items-start space-x-3">
              <div class="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 flex items-center justify-center">
                <UserAvatar
                  :avatar="message.chatter.avatar"
                  :uuid="message.chatter.uuid"
                  :has-avatar="message.chatter.has_avatar"
                  :alt="message.chatter.nickname"
                  class="w-full h-full object-cover"
                />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-1">
                  <span class="font-medium text-gray-900">{{ message.chatter.nickname }}</span>
                  <span v-if="message.unread_count > 0" class="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {{ message.unread_count }}
                  </span>
                </div>
                <p class="text-sm text-gray-500 truncate">
                  {{ message.last_message.content || '开始新对话' }}
                </p>
                <p class="mt-1">
                  <Time v-if="message.last_message.datetime" :time="message.last_message.datetime" />
                </p>
              </div>
            </div>
          </div>
          <div v-if="finalMessages.length === 0" class="p-8 text-center text-gray-500">
            暂无消息
          </div>
        </div>
        <div class="p-4 border-t flex justify-between items-center bg-gray-50">
          <button @click="prevPage" :disabled="currentPage === 1"
            class="px-3 py-1.5 bg-blue-600 text-white rounded-md disabled:opacity-50 hover:bg-blue-700 transition duration-150 ease-in-out flex items-center">
            <ChevronLeft class="w-4 h-4 mr-1" />
            上一页
          </button>
          <span class="text-sm text-gray-600">{{ currentPage }} / {{ totalPages || 1 }}</span>
          <button @click="nextPage" :disabled="currentPage === totalPages"
            class="px-3 py-1.5 bg-blue-600 text-white rounded-md disabled:opacity-50 hover:bg-blue-700 transition duration-150 ease-in-out flex items-center">
            下一页
            <ChevronRight class="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
      <div class="flex-1 bg-white shadow-sm">
        <ChatView v-if="selectedMessage" :chatTarget="selectedMessage" @read="handleConversationRead" />
        <div v-else class="h-full flex flex-col items-center justify-center bg-gray-50">
          <MessageSquare class="h-16 w-16 text-gray-300 mb-4" />
          <p class="text-gray-500 text-lg">
            {{ messages?.length === 0 ? '暂时还没有消息' : '请选择一个对话' }}
          </p>
          <p class="text-gray-400 text-sm mt-2">
            {{ messages?.length === 0 ? '开始与他人交流吧' : '点击左侧列表开始聊天' }}
          </p>
        </div>
      </div>
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
import { RefreshCw, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-vue-next'
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
    const selectedId = selectedMessage.value?.chatter.id
    const resp = await api.get({
      url: '/api/message/user/',
      query: { page },
    })
    if (resp.status.toString().startsWith('2')) {
      messages.value = resp.data.contents.results
      totalPages.value = resp.data.contents.max_page
      currentPage.value = page
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

const handleConversationRead = () => {
  if (!selectedMessage.value) return
  selectedMessage.value.unread_count = 0
  const listed = messages.value?.find(item => item.chatter.id === selectedMessage.value?.chatter.id)
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
