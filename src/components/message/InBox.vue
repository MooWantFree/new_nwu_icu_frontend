<template>
  <div class="min-h-[calc(100vh-2rem)] bg-gray-100">
    <div
      v-if="loading"
      class="flex items-center justify-center min-h-[calc(100vh-2rem)]"
    >
      <div class="p-8 bg-white rounded-lg shadow-md">
        <div
          class="w-16 h-16 mx-auto mb-4 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"
        />
        <p class="text-center text-gray-600">加载中...</p>
      </div>
    </div>
    <div v-else class="flex min-h-[calc(100vh-2rem)]">
      <div class="w-80 border border-gray bg-white border-r flex flex-col">
        <div class="p-4 border-b flex justify-between items-center">
          <h2 class="font-semibold text-lg text-gray-800">我的消息</h2>
          <button
            @click="fetchMessages(currentPage)"
            class="text-blue-500 hover:text-blue-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
        <div class="overflow-y-auto flex-grow">
          <div
            v-for="message in paginatedMessages"
            :key="message.id"
            @click="selectMessage(message)"
            class="p-4 border-b cursor-pointer transition duration-150 ease-in-out hover:bg-gray-50"
            :class="{ 'bg-blue-50': selectedMessage?.id === message.id }"
          >
            <div class="flex items-start space-x-3">
              <img
                :src="`/api/download/${message.chatter.avatar}`"
                :alt="message.chatter.nickname"
                class="w-10 h-10 rounded-full object-cover"
              />
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-1">
                  <span class="font-medium text-sm text-gray-900">{{
                    message.chatter.nickname
                  }}</span>
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
        <div class="p-4 border-t flex justify-between items-center bg-gray-50">
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
      <div class="flex-1 bg-white">
        <ChatView v-if="selectedMessage" :chatTarget="selectedMessage" />
        <div v-else class="h-full flex items-center justify-center bg-gray-50">
          <p class="text-gray-500">
            {{ messages?.length === 0 ? '暂时还没有消息' : '请选择一个消息' }}
          </p>
        </div>
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
const selectedMessage = ref<
  APIUserMessageList['response']['results'][0] | null
>(null)

const paginatedMessages = computed(() => messages.value || [])

const fetchMessages = async (page: number = 1) => {
  try {
    loading.value = true
    const resp = await api.get({
      url: '/api/message/user/',
      query: { page },
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

const nextPage = () =>
  currentPage.value < totalPages.value && fetchMessages(currentPage.value + 1)
const prevPage = () =>
  currentPage.value > 1 && fetchMessages(currentPage.value - 1)
const selectMessage = (msg: APIUserMessageList['response']['results'][0]) => {
  // Set the unread count to 0
  msg.unread_count = 0
  selectedMessage.value = msg
}

onMounted(fetchMessages)
</script>
