<template>
  <div class="flex-1 flex flex-col bg-white">
    <div class="p-4 border-b flex items-center justify-between">
      <div class="flex items-center gap-3">
        <span class="font-medium">{{ chatTarget.chatter.nickname }}</span>
        <!-- <span
          v-if="chatTarget.chatter.is_official"
          class="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600"
        >
          官方
        </span> -->
      </div>
      <button class="p-1 rounded-full hover:bg-gray-100">
        <MoreVertical class="w-5 h-5 text-gray-500" />
      </button>
    </div>
    <div class="flex-1 overflow-y-auto p-4 min-h-[calc(100vh-12rem)]" ref="messageContainer">
      <div v-if="isLoading" class="flex justify-center items-center h-full">
        <div class="flex justify-center items-center h-full">
          <LoaderCircle class="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      </div>
      <div v-else class="max-w-screen-md mx-auto space-y-4">
        <div v-if="messageList.length === 0" class="text-center text-sm text-gray-500">没有更多消息了～</div>
        <template v-else>
          <div v-for="msg in messageList" :key="msg.id" class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-full overflow-hidden">
              <img :src="`/api/download/${chatTarget.chatter.avatar}`" :alt="chatTarget.chatter.nickname" class="w-full h-full object-cover" />
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-medium text-sm">{{ chatTarget.chatter.nickname }}</span>
                <span class="text-sm text-gray-500">{{ formatTime(msg.datetime) }}</span>
              </div>
              <div class="bg-white rounded-lg p-3 shadow-sm">
                <p class="text-sm">{{ msg.content }}</p>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <div class="p-4 border-t">
      <div class="max-w-2xl mx-auto">
        <div class="flex items-center gap-2">
          <button class="p-2 hover:bg-gray-100 rounded-lg">
            <Image class="w-5 h-5 text-gray-500" />
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
            :disabled="!newMessage.trim()"
          >
            发送
            <Send class="w-4 h-4" />
          </button>
        </div>
        <div class="flex items-center justify-end mt-2 text-sm text-gray-500">
          <span>{{ newMessage.length }}/500</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick, useTemplateRef } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { useMessage } from 'naive-ui'
import { api } from '@/lib/requests'
import { APIUserMessageDetail, APIUserMessageList } from '@/types/api/messages/inbox'
import { useUser } from '@/lib/useUser'
import { MoreVertical, Image, Send, LoaderCircle } from 'lucide-vue-next'

// TODO: Using Cache(LRU) to cache messages
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

const loadMessages = async (page: number) => {
  try {
    isLoading.value = true
    const resp = await api.get({
      url: '/api/message/user/:id',
      params: { id: props.chatTarget.chatter.id },
      query: { page },
    })
    if (resp.status.toString().startsWith('2')) {
      messageList.value = resp.data.contents.results
    } else {
      throw new Error('Failed to fetch messages')
    }
  } catch (e) {
    message.error('获取消息失败，请重试')
    console.error('Error fetching messages:', e)
  } finally {
    isLoading.value = false
  }
}

const sendMessage = async () => {
  if (!newMessage.value.trim()) return
  const dateNow = new Date().toISOString()
  

  try {
    const resp = await api.post({
      url: '/api/message/',
      query: {
        receiver: props.chatTarget.id,
        content: newMessage.value,
      }
    })
    if (resp.status.toString().startsWith('2')) {
      messageList.value.unshift({
        id: -1,
        content: resp.data.contents.content,
        datetime: dateNow,
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
  }
}

const scrollToBottom = () => {
  if (messageContainer.value) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight
  }
}

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

watch(
  () => props.chatTarget,
  useDebounceFn(() => {
    messageList.value = []
    currentPage.value = 1
    loadMessages(1)
  }, 200)
)

onMounted(() => {
  loadMessages(1)
})
</script>
