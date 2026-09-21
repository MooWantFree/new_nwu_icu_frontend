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
import { ref, reactive, watch, onMounted, nextTick, useTemplateRef, computed, onUnmounted } from 'vue'
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
const emit = defineEmits<{ read: [chatterId: number] }>()

const messageList = ref<APIUserMessageDetail['response']['results']>([])
const isLoading = ref(true)
const drafts = reactive(new Map<number, string>())
const sending = reactive(new Set<number>())
const newMessage = computed({
  get: () => drafts.get(props.chatTarget.chatter.id) ?? '',
  set: (content: string) => drafts.set(props.chatTarget.chatter.id, content),
})
const messageContainer = useTemplateRef('messageContainer')
const fetchInterval = ref<number | null>(null)
const isSending = computed(() => sending.has(props.chatTarget.chatter.id))
const isLoadingMore = ref(false)
const hasMoreMessages = ref(true)
const isFetchingNew = ref(false)
const afterCursor = ref(0)
let conversationGeneration = 0
let active = true
type ConversationContext = { id: number; generation: number }
const currentContext = (): ConversationContext => ({
  id: props.chatTarget.chatter.id,
  generation: conversationGeneration,
})
const isCurrent = (context: ConversationContext) => active
  && context.id === props.chatTarget.chatter.id
  && context.generation === conversationGeneration

const mergeMessages = (items: APIUserMessageDetail['response']['results']) => {
  messageList.value = mergeByMessageId(messageList.value, items)
}

const markRead = async (context: ConversationContext, throughMessageId: number) => {
  if (!throughMessageId || !isCurrent(context)) return
  const response = await api.post({
    url: '/api/message/user/:id/read/',
    params: { id: context.id },
    query: { through_message_id: throughMessageId },
  })
  if (!isCurrent(context)) return
  if (!response.status.toString().startsWith('2')) throw new Error('Failed to mark conversation read')
  emit('read', context.id)
}

const loadInitMessages = async (context: ConversationContext) => {
  try {
    const resp = await api.get({
      url: '/api/message/user/:id',
      params: { id: context.id },
      query: {},
    })
    if (!isCurrent(context)) return
    if (resp.status.toString().startsWith('2')) {
      mergeMessages(resp.content.results)
      hasMoreMessages.value = resp.content.has_more
      afterCursor.value = resp.content.snapshot_latest_message_id
      isLoading.value = false
      await nextTick()
      if (!isCurrent(context)) return
      scrollToBottom(context)
      try {
        await markRead(context, resp.content.snapshot_latest_message_id)
      } catch (error) {
        if (isCurrent(context)) console.error('Error marking conversation read:', error)
      }
    } else {
      throw new Error('Failed to fetch messages')
    }
  } catch (e) {
    if (!isCurrent(context)) return
    message.error('获取消息失败，请重试')
    console.error('Error fetching messages:', e)
  } finally {
    if (isCurrent(context)) isLoading.value = false
  }
}

const fetchOldMessage = async () => {
  if (isLoading.value || !firstMessage.value || isLoadingMore.value || !hasMoreMessages.value) return
  const context = currentContext()
  const beforeId = firstMessage.value.id
  try {
    isLoadingMore.value = true
    const resp = await api.get({
      url: '/api/message/user/:id',
      params: { id: context.id },
      query: { before_id: beforeId },
    })
    if (!isCurrent(context)) return
    if (resp.status.toString().startsWith('2')) {
      const oldScrollHeight = messageContainer.value?.scrollHeight || 0
      const oldScrollTop = messageContainer.value?.scrollTop || 0
      const newMessages = resp.content.results
      hasMoreMessages.value = resp.content.has_more
      
      if (newMessages.length > 0) {
        mergeMessages(newMessages)
        
        await nextTick()
        if (isCurrent(context) && messageContainer.value) {
          const newScrollHeight = messageContainer.value.scrollHeight
          messageContainer.value.scrollTop = oldScrollTop + newScrollHeight - oldScrollHeight
        }
      }
    } else {
      throw new Error('Failed to fetch old messages')
    }
  } catch (e) {
    if (isCurrent(context)) console.error('Error fetching old messages:', e)
  } finally {
    if (isCurrent(context)) isLoadingMore.value = false
  }
}

const loadOnScroll = useDebounceFn((context: ConversationContext) => {
  if (!isCurrent(context) || !messageContainer.value) return
  
  // If scrolled to top (with a threshold), load older messages
  if (messageContainer.value.scrollTop < 100 && hasMoreMessages.value) {
    fetchOldMessage()
  }
}, 200)
const handleScroll = () => loadOnScroll(currentContext())

const fetchNewMessages = async () => {
  if (!active || isLoading.value || isFetchingNew.value) return
  const context = currentContext()
  try {
    isFetchingNew.value = true
    const wasAtBottom = isScrolledToBottom()
    const initialCursor = afterCursor.value
    let incoming: APIUserMessageDetail['response']['results']
    let cursor: number
    if (initialCursor === 0) {
      // An empty conversation needs a first page before it has a valid after cursor.
      const response = await api.get({
        url: '/api/message/user/:id',
        params: { id: context.id },
        query: {},
      })
      if (!isCurrent(context)) return
      if (!response.status.toString().startsWith('2')) throw new Error('Failed to fetch new messages')
      incoming = response.content.results
      cursor = response.content.snapshot_latest_message_id
      hasMoreMessages.value = response.content.has_more
    } else {
      const drained = await drainAfterCursor(initialCursor, async afterId => {
        if (!isCurrent(context)) throw new Error('Conversation changed')
        const response = await api.get({
          url: '/api/message/user/:id',
          params: { id: context.id },
          query: { after_id: afterId },
        })
        if (!isCurrent(context)) throw new Error('Conversation changed')
        if (!response.status.toString().startsWith('2')) throw new Error('Failed to fetch new messages')
        return response.content
      })
      incoming = drained.results
      cursor = drained.cursor
    }
    if (!isCurrent(context)) return
    mergeMessages(incoming)
    afterCursor.value = cursor
    if (cursor > initialCursor) {
      await nextTick()
      if (!isCurrent(context)) return
      if (wasAtBottom) scrollToBottom(context)
      await markRead(context, cursor)
    }
  } catch (e) {
    if (isCurrent(context)) console.error('Error fetching new messages:', e)
  } finally {
    if (isCurrent(context)) isFetchingNew.value = false
  }
}

const isScrolledToBottom = () => {
  if (!messageContainer.value) return true
  const { scrollTop, scrollHeight, clientHeight } = messageContainer.value
  return scrollHeight - scrollTop - clientHeight < 50
}

const sendMessage = async () => {
  if (!newMessage.value.trim() || isSending.value) return
  const context = currentContext()
  const content = newMessage.value
  const sender = userInfo.value
  if (!sender) {
    message.error('登录状态已失效')
    return
  }
  sending.add(context.id)

  try {
    const resp = await api.post({
      url: '/api/message/',
      query: {
        receiver: context.id,
        content,
      }
    })
    if (!active) return
    if (resp.status.toString().startsWith('2')) {
      // Complete the original draft even when another conversation is now open.
      if (drafts.get(context.id) === content) drafts.delete(context.id)
      if (!isCurrent(context)) return
      mergeMessages([{
        id: resp.content.message,
        content,
        datetime: resp.content.datetime,
        chatter: {
          id: sender.id,
          nickname: sender.nickname,
          avatar: sender.avatar,
          uuid: sender.uuid,
          has_avatar: sender.has_avatar,
        }
      }])
      await nextTick()
      scrollToBottom(context)
    } else {
      throw new Error('Failed to send message')
    }
  } catch (e) {
    if (isCurrent(context)) {
      message.error('发送消息失败，请重试')
      console.error('Error sending message:', e)
    }
  } finally {
    if (active) sending.delete(context.id)
  }
}

const scrollToBottom = (context: ConversationContext) => {
  if (isCurrent(context) && messageContainer.value) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight
  }
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

watch(
  () => props.chatTarget.chatter.id,
  () => {
    conversationGeneration += 1
    messageList.value = []
    hasMoreMessages.value = true
    isLoading.value = true
    isLoadingMore.value = false
    isFetchingNew.value = false
    afterCursor.value = 0
    void loadInitMessages(currentContext())
  },
  { immediate: true, flush: 'sync' },
)

onMounted(() => {
  fetchInterval.value = setInterval(fetchNewMessages, 5000) as unknown as number
})

onUnmounted(() => {
  active = false
  conversationGeneration += 1
  if (fetchInterval.value) {
    clearInterval(fetchInterval.value)
  }
})
</script>
