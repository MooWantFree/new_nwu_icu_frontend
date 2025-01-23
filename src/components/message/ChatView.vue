<template>
  <div class="flex-1 flex flex-col bg-white">
    <div class="p-4 border-b flex items-center justify-between">
      <div class="flex items-center gap-3">
        <span class="font-medium">{{ chatTarget.chatter.nickname }}</span>
      </div>
      <button class="p-1 rounded-full hover:bg-gray-100">
        <MoreVertical class="w-5 h-5 text-gray-500" />
      </button>
    </div>
    <div class="flex-1 overflow-y-auto p-4 min-h-[calc(100vh-12rem)] max-h-[calc(100vh-12rem)]" ref="messageContainer">
      <div v-if="isLoading" class="flex justify-center items-center h-full">
        <Loader2 class="w-8 h-8 text-blue-500 animate-spin" />
      </div>
      <div v-else class="max-w-screen-md mx-auto space-y-4">
        <div v-if="finalMessageList.length === 0" class="text-center text-sm text-gray-500">
          <InboxIcon class="w-12 h-12 mx-auto mb-2 text-gray-400" />
          没有更多消息了～
        </div>
        <template v-else>
          <template v-for="(msg, index) in finalMessageList" :key="msg.id">
            <div v-if="showDateDivider(msg, index)" class="text-center text-sm text-gray-500 my-4 flex items-center justify-center">
              <CalendarIcon class="w-4 h-4 mr-2" />
              {{ formatDate(msg.datetime) }}
            </div>
            <div :class="[
              'flex items-start gap-3',
              { 'flex-row-reverse': msg.chatter.id !== chatTarget.chatter.id }
            ]">
              <div class="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-200 flex items-center justify-center">
                <img v-if="msg.chatter.avatar" :src="`/api/download/${msg.chatter.avatar}`" :alt="msg.chatter.nickname" class="w-full h-full object-cover" />
                <User v-else class="w-6 h-6 text-gray-400" />
              </div>
              <div :class="[
                'flex flex-col',
                { 'items-end': msg.chatter.id !== chatTarget.chatter.id }
              ]">
                <div class="flex items-center gap-2 mb-1" :class="{ 'flex-row-reverse': msg.chatter.id !== chatTarget.chatter.id }">
                  <span class="font-medium text-sm">{{ msg.chatter.nickname }}</span>
                  <span class="text-sm text-gray-500 flex items-center">
                    <Clock class="w-3 h-3 mr-1" />
                    {{ formatTime(msg.datetime) }}
                  </span>
                </div>
                <div :class="[
                  'rounded-lg p-3 shadow-sm max-w-xs',
                  msg.chatter.id === chatTarget.chatter.id ? 'bg-gray-100' : 'bg-blue-500 text-white'
                ]">
                  <p class="text-sm">{{ msg.content }}</p>
                </div>
              </div>
            </div>
          </template>
        </template>
      </div>
    </div>

    <div class="p-4 border-t">
      <div class="max-w-2xl mx-auto">
        <div class="flex items-center gap-2">
          <button class="p-2 hover:bg-gray-100 rounded-lg">
            <ImageIcon class="w-5 h-5 text-gray-500" />
          </button>
          <input
            type="text"
            placeholder="发送消息..."
            class="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            v-model="newMessage"
            @keyup.enter="sendMessage"
          />
          <button
            @click="sendMessage"
            class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
            :disabled="!newMessage.trim() || isSending"
          >
            <span v-if="!isSending">发送</span>
            <Loader2 v-else class="w-4 h-4 animate-spin" />
            <Send class="w-4 h-4" />
          </button>
        </div>
        <div class="flex items-center justify-end mt-2 text-sm text-gray-500">
          <span :class="{ 'text-red-500': newMessage.length >= 500 }">{{ newMessage.length }}/500</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick, useTemplateRef, computed, onUnmounted } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { useMessage } from 'naive-ui'
import { api } from '@/lib/requests'
import { APIUserMessageDetail, APIUserMessageList } from '@/types/api/messages/inbox'
import { useUser } from '@/lib/useUser'
import { MoreVertical, Image as ImageIcon, Send, Loader2, User, Clock, CalendarIcon, MessageSquare, InboxIcon } from 'lucide-vue-next'

// TODO: Using Cache(LRU) to cache messages while tab switching
const message = useMessage()
const { userInfo } = useUser()

const props = defineProps<{
  chatTarget: APIUserMessageList['response']['results'][0]
}>()

const messageList = ref<APIUserMessageDetail['response']['results']>([])
const currentPage = ref(1)
const isLoading = ref(true)
const newMessage = ref('')
const messageContainer = useTemplateRef('messageContainer')
const fetchInterval = ref<number | null>(null)
const isSending = ref(false)

const loadInitMessages = async (page: number) => {
  try {
    isLoading.value = true
    const resp = await api.get({
      url: '/api/message/user/:id',
      params: { id: props.chatTarget.chatter.id },
      query: { page, order: 'before' },
    })
    if (resp.status.toString().startsWith('2')) {
      messageList.value = resp.data.contents.results
    } else {
      throw new Error('Failed to fetch messages')
    }
  } catch (e) {
    if (props.chatTarget.last_message.datetime === '') {
      // Which means this is the new chat
      messageList.value = []
      return
    }
    message.error('获取消息失败，请重试')
    console.error('Error fetching messages:', e)
  } finally {
    isLoading.value = false
    await nextTick()
    scrollToBottom()
  }
}

const fetchNewMessages = async () => {
  if (!lastMessage.value) return

  try {
    const resp = await api.get({
      url: '/api/message/user/:id',
      params: { id: props.chatTarget.chatter.id },
      query: { order: 'after', last_message_id: lastMessage.value.id },
    })
    if (resp.status.toString().startsWith('2')) {
      messageList.value.push(...resp.data.contents.results)
    } else {
      throw new Error('Failed to fetch new messages')
    }
  } catch (e) {
    console.error('Error fetching new messages:', e)
  }
}

const sendMessage = async () => {
  if (!newMessage.value.trim() || isSending.value) return
  isSending.value = true
  const dateNow = new Date().toISOString()

  try {
    const resp = await api.post({
      url: '/api/message/',
      query: {
        receiver: props.chatTarget.chatter.id,
        content: newMessage.value,
      }
    })
    if (resp.status.toString().startsWith('2')) {
      messageList.value.push({
        id: -1, // FIXME: Remember to change it 
        content: resp.data.contents.content,
        datetime: dateNow,
        chatter: {
          id: userInfo.value?.id!,
          nickname: userInfo.value?.nickname!,
          avatar: userInfo.value?.avatar!,
        }
      })
      newMessage.value = ''
      await nextTick()
      scrollToBottom()
    } else {
      throw new Error('Failed to send message')
    }
  } catch (e) {
    message.error('发送消息失败，请重试')
    console.error('Error sending message:', e)
  } finally {
    isSending.value = false
  }
}

const scrollToBottom = () => {
  if (messageContainer.value) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight
  }
}

const formatDate = (timestamp: string) => {
  const date = new Date(timestamp)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return '今天'
  } else if (date.toDateString() === yesterday.toDateString()) {
    return '昨天'
  } else {
    return date.toLocaleDateString()
  }
}

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const showDateDivider = (msg: APIUserMessageDetail['response']['results'][0], index: number) => {
  if (index === 0) return true
  const prevMsg = finalMessageList.value[index - 1]
  const currDate = new Date(msg.datetime)
  const prevDate = new Date(prevMsg.datetime)
  return currDate.toDateString() !== prevDate.toDateString()
}

const finalMessageList = computed(() => {
  // Sort by time
  return messageList.value.slice().sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())
})

const lastMessage = computed(() => {
  return finalMessageList.value[finalMessageList.value.length - 1]
})

watch(
  () => props.chatTarget,
  useDebounceFn(() => {
    messageList.value = []
    currentPage.value = 1
    loadInitMessages(1)
  }, 0)
)

onMounted(() => {
  loadInitMessages(1)
  fetchInterval.value = setInterval(fetchNewMessages, 5000) as unknown as number
})

onUnmounted(() => {
  if (fetchInterval.value) {
    clearInterval(fetchInterval.value)
  }
})
</script>
