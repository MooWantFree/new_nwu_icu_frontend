<template>
  <div class="h-full bg-gray-100">
    <div v-if="loading" class="flex items-center justify-center h-full">
      <div class="p-8 bg-white rounded-lg shadow-md">
        <div
          class="w-16 h-16 mx-auto mb-4 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"
        />
        <p class="text-center text-gray-600">加载中...</p>
      </div>
    </div>
    <div v-else class="flex h-full">
      <div class="w-72 bg-white border-r flex flex-col">
        <div class="p-4 border-b">
          <h2 class="font-semibold text-lg text-gray-800">我的消息</h2>
        </div>
        <div class="overflow-y-auto flex-grow">
          <div
            v-for="message in paginatedMessages"
            :key="message.id"
            @click="selectMessage(message)"
            class="p-4 border-b cursor-pointer transition duration-150 ease-in-out"
            :class="{
              'bg-blue-50 hover:bg-blue-100':
                selectedMessage?.id === message.id,
              'hover:bg-gray-50': selectedMessage?.id !== message.id,
            }"
          >
            <div class="flex items-start space-x-3">
              <img
                :src="message.chatter.avatar"
                :alt="message.last_message.content"
                class="w-10 h-10 rounded-full object-cover"
              />
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-1">
                  <div class="flex items-center space-x-2">
                    <span class="font-medium text-sm text-gray-900">{{
                      message.chatter.nickname
                    }}</span>
                    <!-- <span v-if="message.isOfficial"
                      class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                      官方
                    </span> -->
                  </div>
                  <span
                    v-if="message.unread_count > 0"
                    class="bg-red-500 text-white text-xs px-2 py-1 rounded-full"
                  >
                    {{ message.unread_count }}
                  </span>
                </div>
                <p class="text-sm text-gray-500 truncate">
                  {{ message.last_message.content }}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div
          class="p-4 border-t flex justify-between items-center bg-gray-50 h-9"
        >
          <button
            @click="prevPage"
            :disabled="currentPage === 1"
            class="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50 hover:bg-blue-600 transition duration-150 ease-in-out"
          >
            上一页
          </button>
          <span class="text-sm text-gray-600"
            >{{ currentPage }} / {{ totalPages }}</span
          >
          <button
            @click="nextPage"
            :disabled="currentPage === totalPages"
            class="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50 hover:bg-blue-600 transition duration-150 ease-in-out"
          >
            下一页
          </button>
        </div>
      </div>
      <ChatView
        v-if="selectedMessage"
        :message="selectedMessage"
        class="flex-1"
      />
      <div v-else class="flex-1 flex items-center justify-center bg-gray-50">
        <p v-if="messages?.length === 0" class="text-gray-500">
          暂时还没有消息呢
        </p>
        <p v-else class="text-gray-500">请选择一个消息</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import ChatView from './ChatView.vue'
import { api } from '@/lib/requests'
import { useMessage } from 'naive-ui'
import { APIUserMessageList } from '@/types/api/messages/inbox'

const message = useMessage()
const loading = ref(true)
const messages = ref<APIUserMessageList['response']['results'] | null>(null)
const totalPages = ref(0)
const currentPage = ref(1)
const selectedMessage = ref<APIUserMessageList['response']['results'][0] | null>(null)

const paginatedMessages = computed(() => messages.value || [])

const fetchMessages = async (page: number = 1) => {
  try {
    loading.value = true
    const resp = await api.get({
      url: '/api/message/user/',
      query: {
        page,
      },
    })
    if (resp.status.toString().startsWith('2')) {
      messages.value = resp.data.contents.results
      totalPages.value = resp.data.contents.max_page
      currentPage.value = page
    }
  } catch (e) {
    console.error('Error fetching messages:', e)
    message.error('获取消息失败，请重试')
  } finally {
    loading.value = false
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    fetchMessages(currentPage.value + 1)
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    fetchMessages(currentPage.value - 1)
  }
}

const selectMessage = (message: APIUserMessageList['response']['results'][0]) => {
  selectedMessage.value = message
}

onMounted(async () => {
  await fetchMessages()
})
</script>
