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
    <div class="flex-1 overflow-y-auto p-4 min-h-[calc(100vh-12rem)] max-h-[calc(100vh-12rem)]" ref="messageContainer" @scroll="handleScroll">
      <div v-if="isLoading" class="flex justify-center items-center h-full">
        <Loader2 class="w-8 h-8 text-blue-700 animate-spin" />
      </div>
      <div v-else class="max-w-screen-md mx-auto space-y-4">
        <div v-if="finalMessageList.length === 0" class="text-center text-sm text-gray-500">
          <InboxIcon class="w-12 h-12 mx-auto mb-2 text-gray-400" />
          没有更多消息了～
        </div>
        <template v-else>
          <div v-if="isLoadingMore" class="text-center py-2">
            <Loader2 class="w-5 h-5 text-blue-700 animate-spin mx-auto" />
            <span class="text-xs text-gray-500">加载更多消息...</span>
          </div>
          <template v-for="(msg, index) in finalMessageList" :key="msg.id">
            <div v-if="showDateDivider(msg, index)"
              class="text-center text-sm text-gray-500 my-4 flex items-center justify-center">
              <CalendarIcon class="w-4 h-4 mr-2" />
              <Time :time="msg.datetime" />
            </div>
            <div :class="[
              'flex items-start gap-3',
              { 'flex-row-reverse': msg.chatter.id !== chatTarget.chatter.id }
            ]">
              <div
                class="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-200 flex items-center justify-center">
                <UserAvatar
                  :avatar="msg.chatter.avatar"
                  :uuid="msg.chatter.uuid"
                  :has-avatar="msg.chatter.has_avatar"
                  :alt="msg.chatter.nickname"
                  class="w-full h-full object-cover"
                />
              </div>
              <div :class="[
                'flex flex-col',
                { 'items-end': msg.chatter.id !== chatTarget.chatter.id }
              ]">
                <div class="flex items-center gap-2 mb-1"
                  :class="{ 'flex-row-reverse': msg.chatter.id !== chatTarget.chatter.id }">
                  <span class="font-medium text-sm">{{ msg.chatter.nickname }}</span>
                  <span class="flex items-center">
                    <Clock class="w-3 h-3 mr-1" />
                    <Time :time="msg.datetime" />
                  </span>
                </div>
                <div :class="[
                  'rounded-lg p-3 shadow-sm max-w-xs',
                  msg.chatter.id === chatTarget.chatter.id ? 'bg-gray-100' : 'bg-blue-600 text-white'
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
          <input type="text" placeholder="发送消息..." maxlength="500"
            :disabled="isSending"
            class="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            v-model="newMessage" @keyup.enter="sendMessage" />
          <button @click="sendMessage"
            class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            :disabled="!newMessage.trim() || isSending">
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
import { MoreVertical, Send, Loader2, Clock, CalendarIcon, InboxIcon } from 'lucide-vue-next'
import UserAvatar from '@/components/common/UserAvatar.vue'
import Time from '@/components/tinyComponents/Time.vue'
import { drainAfterCursor, mergeByMessageId } from '@/lib/messageCursor'

// TODO: Using Cache(LRU) to cache messages while tab switching
const message = useMessage()
const { userInfo } = useUser()

const props = defineProps<{
  chatTarget: APIUserMessageList['response']['results'][0]
}>()
const emit = defineEmits<{ read: [] }>()

const messageList = ref<APIUserMessageDetail['response']['results']>([])
const isLoading = ref(true)
const newMessage = ref('')
const messageContainer = useTemplateRef('messageContainer')
const fetchInterval = ref<number | null>(null)
const isSending = ref(false)
const isLoadingMore = ref(false)
const hasMoreMessages = ref(true)
const isFetchingNew = ref(false)
let conversationGeneration = 0

const mergeMessages = (items: APIUserMessageDetail['response']['results']) => {
  messageList.value = mergeByMessageId(messageList.value, items)
}

const markRead = async (throughMessageId: number) => {
  if (!throughMessageId) return
  const response = await api.post({
    url: '/api/message/user/:id/read/',
    params: { id: props.chatTarget.chatter.id },
    query: { through_message_id: throughMessageId },
  })
  if (!response.status.toString().startsWith('2')) throw new Error('Failed to mark conversation read')
  emit('read')
}

const loadInitMessages = async () => {
  const generation = ++conversationGeneration
  try {
    isLoading.value = true
    const resp = await api.get({
      url: '/api/message/user/:id',
      params: { id: props.chatTarget.chatter.id },
      query: {},
    })
    if (resp.status.toString().startsWith('2')) {
      if (generation !== conversationGeneration) return
      messageList.value = resp.content.results
      hasMoreMessages.value = resp.content.has_more
      await nextTick()
      scrollToBottom()
      try {
        await markRead(resp.content.snapshot_latest_message_id)
      } catch (error) {
        console.error('Error marking conversation read:', error)
      }
    } else {
      throw new Error('Failed to fetch messages')
    }
  } catch (e) {
    if (!props.chatTarget.last_message.datetime) {
      // Which means this is the new chat
      messageList.value = []
      return
    }
    message.error('获取消息失败，请重试')
    console.error('Error fetching messages:', e)
  } finally {
    isLoading.value = false
    if (generation === conversationGeneration) await nextTick()
  }
}

const fetchOldMessage = async () => {
  if (!firstMessage.value || isLoadingMore.value || !hasMoreMessages.value) return
  
  try {
    isLoadingMore.value = true
    const resp = await api.get({
      url: '/api/message/user/:id',
      params: { id: props.chatTarget.chatter.id },
      query: { before_id: firstMessage.value.id },
    })
    if (resp.status.toString().startsWith('2')) {
      const oldScrollHeight = messageContainer.value?.scrollHeight || 0
      const newMessages = resp.content.results
      
      if (newMessages.length > 0) {
        mergeMessages(newMessages)
        
        await nextTick()
        if (messageContainer.value) {
          const newScrollHeight = messageContainer.value.scrollHeight
          messageContainer.value.scrollTop = newScrollHeight - oldScrollHeight
        }
      }
      hasMoreMessages.value = resp.content.has_more
    } else {
      throw new Error('Failed to fetch old messages')
    }
  } catch (e) {
    console.error('Error fetching old messages:', e)
  } finally {
    isLoadingMore.value = false
  }
}

const handleScroll = useDebounceFn(() => {
  if (!messageContainer.value) return
  
  // If scrolled to top (with a threshold), load older messages
  if (messageContainer.value.scrollTop < 100 && hasMoreMessages.value) {
    fetchOldMessage()
  }
}, 200)

const fetchNewMessages = async () => {
  if (!lastMessage.value || isFetchingNew.value) return

  try {
    isFetchingNew.value = true
    const wasAtBottom = isScrolledToBottom()
    const initialCursor = lastMessage.value.id
    const drained = await drainAfterCursor(initialCursor, async afterId => {
      const response = await api.get({
        url: '/api/message/user/:id',
        params: { id: props.chatTarget.chatter.id },
        query: { after_id: afterId },
      })
      if (!response.status.toString().startsWith('2')) throw new Error('Failed to fetch new messages')
      return response.content
    })
    mergeMessages(drained.results)
    if (drained.cursor > initialCursor) {
      await nextTick()
      if (wasAtBottom) scrollToBottom()
      await markRead(drained.cursor)
    }
  } catch (e) {
    console.error('Error fetching new messages:', e)
  } finally {
    isFetchingNew.value = false
  }
}

const isScrolledToBottom = () => {
  if (!messageContainer.value) return true
  const { scrollTop, scrollHeight, clientHeight } = messageContainer.value
  return scrollHeight - scrollTop - clientHeight < 50
}

const sendMessage = async () => {
  if (!newMessage.value.trim() || isSending.value) return
  isSending.value = true

  try {
    const resp = await api.post({
      url: '/api/message/',
      query: {
        receiver: props.chatTarget.chatter.id,
        content: newMessage.value,
      }
    })
    if (resp.status.toString().startsWith('2')) {
      if (!userInfo.value) throw new Error('登录状态已失效')
      if (!messageList.value.find(msg => msg.id === resp.content.message)) {
        messageList.value.push({
          id: resp.content.message,
          content: newMessage.value,
          datetime: resp.content.datetime,
          chatter: {
            id: userInfo.value.id,
            nickname: userInfo.value.nickname,
            avatar: userInfo.value.avatar,
            uuid: userInfo.value.uuid,
            has_avatar: userInfo.value.has_avatar,
          }
        })
      }
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
  nextTick(() => {
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight
    }
  })
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

const firstMessage = computed(() => {
  return finalMessageList.value[0]
})

const lastMessage = computed(() => {
  return finalMessageList.value[finalMessageList.value.length - 1]
})

watch(
  () => props.chatTarget,
  useDebounceFn(() => {
    messageList.value = []
    hasMoreMessages.value = true
    loadInitMessages()
  }, 0)
)

onMounted(() => {
  loadInitMessages()
  fetchInterval.value = setInterval(fetchNewMessages, 5000) as unknown as number
})

onUnmounted(() => {
  if (fetchInterval.value) {
    clearInterval(fetchInterval.value)
  }
})
</script>
