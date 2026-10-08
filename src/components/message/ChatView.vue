<template>
  <div class="flex h-full min-w-0 flex-1 flex-col bg-white text-zinc-950">
    <div class="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 px-4 sm:px-5">
      <div class="flex min-w-0 items-center gap-3">
        <button type="button" aria-label="返回会话列表" class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 shadow-sm transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 sm:hidden" @click="emit('close')">
          <ArrowLeft class="h-4 w-4" />
        </button>
        <UserAvatar
          :avatar="chatTarget.chatter.avatar"
          :uuid="chatTarget.chatter.uuid"
          :has-avatar="chatTarget.chatter.has_avatar"
          :alt="chatTarget.chatter.nickname"
          class="h-9 w-9 shrink-0 rounded-full border border-zinc-200 bg-zinc-100 object-cover"
        />
        <div class="min-w-0">
          <span class="block truncate text-sm font-semibold">{{ chatTarget.chatter.nickname }}</span>
          <span class="mt-0.5 block text-xs text-zinc-500">站内私信</span>
        </div>
      </div>
    </div>
    <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white p-4 sm:p-5" ref="messageContainer" @scroll="handleScroll">
      <div v-if="isLoading" role="status" aria-label="正在加载消息" class="flex h-full items-center justify-center">
        <Loader2 class="h-5 w-5 animate-spin text-zinc-500" />
      </div>
      <div v-else class="mx-auto max-w-screen-md space-y-5">
        <div v-if="finalMessageList.length === 0" class="flex min-h-56 flex-col items-center justify-center gap-3 text-center text-sm text-zinc-500">
          <span class="inline-flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50">
            <InboxIcon class="h-5 w-5 text-zinc-400" />
          </span>
          没有更多消息了～
        </div>
        <template v-else>
          <div v-if="isLoadingMore" role="status" class="flex items-center justify-center gap-2 py-2 text-xs text-zinc-500">
            <Loader2 class="h-4 w-4 animate-spin" />
            <span>加载更多消息...</span>
          </div>
          <template v-for="(msg, index) in finalMessageList" :key="msg.id">
            <div v-if="showDateDivider(msg, index)"
              class="flex items-center justify-center gap-3 py-2 text-xs text-zinc-400">
              <span class="h-px max-w-16 flex-1 bg-zinc-200" aria-hidden="true" />
              <span class="inline-flex items-center gap-1.5 rounded-md bg-zinc-50 px-2 py-1">
                <CalendarIcon class="h-3 w-3" />
                <Time :time="msg.datetime" mode="message" class="!text-zinc-500" />
              </span>
              <span class="h-px max-w-16 flex-1 bg-zinc-200" aria-hidden="true" />
            </div>
            <div :class="[
              'flex items-start gap-2.5',
              { 'flex-row-reverse': msg.chatter.id !== chatTarget.chatter.id }
            ]">
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-zinc-100">
                <UserAvatar
                  :avatar="msg.chatter.avatar"
                  :uuid="msg.chatter.uuid"
                  :has-avatar="msg.chatter.has_avatar"
                  :alt="msg.chatter.nickname"
                  class="h-full w-full object-cover"
                />
              </div>
              <div :class="[
                'flex min-w-0 max-w-[calc(100%_-_3rem)] flex-col',
                { 'items-end': msg.chatter.id !== chatTarget.chatter.id }
              ]">
                <div class="mb-1.5 flex flex-wrap items-center gap-2 text-xs text-zinc-500"
                  :class="{ 'flex-row-reverse': msg.chatter.id !== chatTarget.chatter.id }">
                  <span class="font-medium text-zinc-700">{{ msg.chatter.nickname }}</span>
                  <span class="inline-flex shrink-0 items-center gap-1 text-zinc-400">
                    <Clock class="h-3 w-3" />
                    <Time :time="msg.datetime" mode="message" class="!text-zinc-500" />
                  </span>
                </div>
                <div :class="[
                  'max-w-sm rounded-xl px-3.5 py-2.5',
                  msg.chatter.id === chatTarget.chatter.id ? 'rounded-tl-sm bg-zinc-100 text-zinc-900' : 'rounded-tr-sm bg-zinc-950 text-white'
                ]">
                  <p class="whitespace-pre-wrap break-words text-sm [overflow-wrap:anywhere]">{{ msg.content }}</p>
                </div>
              </div>
            </div>
          </template>
        </template>
      </div>
    </div>

    <div class="shrink-0 border-t border-zinc-200 bg-white p-3 sm:p-4">
      <div class="max-w-2xl mx-auto">
        <div class="flex items-center gap-2">
          <input type="text" aria-label="消息内容" placeholder="发送消息..." maxlength="500"
            :disabled="isSending"
            class="h-10 min-w-0 flex-1 rounded-md border border-zinc-200 bg-white px-3 text-sm shadow-sm transition-shadow placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:opacity-60"
            v-model="newMessage" @keyup.enter="sendMessage" />
          <button type="button" @click="sendMessage" aria-label="发送消息" :aria-busy="isSending"
            class="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            :disabled="!newMessage.trim() || isSending">
            <span v-if="!isSending">发送</span>
            <Loader2 v-else class="w-4 h-4 animate-spin" />
            <Send class="w-4 h-4" />
          </button>
        </div>
        <div class="mt-2 flex items-center justify-end text-xs text-zinc-400">
          <span :class="{ 'text-red-600': newMessage.length >= 500 }">{{ newMessage.length }}/500</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, nextTick, useTemplateRef, computed, onUnmounted } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { useShadcnToast } from '@/lib/useShadcnToast'
import { api } from '@/lib/requests'
import { APIUserMessageDetail, APIUserMessageList } from '@/types/api/messages/inbox'
import { useUser } from '@/lib/useUser'
import { ArrowLeft, Send, Loader2, Clock, CalendarIcon, InboxIcon } from 'lucide-vue-next'
import UserAvatar from '@/components/common/UserAvatar.vue'
import Time from '@/components/tinyComponents/Time.vue'
import { drainAfterCursor, mergeByMessageId } from '@/lib/messageCursor'

// TODO: Using Cache(LRU) to cache messages while tab switching
const message = useShadcnToast()
const { userInfo } = useUser()

const props = defineProps<{
  chatTarget: APIUserMessageList['response']['results'][0]
}>()
const emit = defineEmits<{ read: [chatterId: number]; close: [] }>()

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

const isMissingConversation = (response: { status: number; errors?: { err_code: string }[] }) =>
  response.status === 404 && response.errors?.some(error => error.err_code === 'chat_not_exist')

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
    if (isMissingConversation(resp)) {
      // Opening a profile's message link before either user has sent a message is an empty chat.
      hasMoreMessages.value = false
      return
    }
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
      if (isMissingConversation(response)) return
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
