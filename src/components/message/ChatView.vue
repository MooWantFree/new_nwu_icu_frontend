<template>
  <div class="flex-1 flex flex-col bg-white">
    <div class="p-4 border-b flex items-center justify-between">
      <div class="flex items-center gap-3">
        <span class="font-medium">NWUICU</span>
        <span
          class="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600"
        >
          官方
        </span>
      </div>
      <button class="p-1 rounded-full hover:bg-gray-100">
        <MoreVertical class="w-5 h-5 text-gray-500" />
      </button>
    </div>
    <div class="flex-1 overflow-y-auto p-4">
      <div class="max-w-screen-md mx-auto space-y-4">
        <div class="text-center text-sm text-gray-500">没有更多消息了～</div>
        <div class="flex items-start gap-3">
          <n-avatar size="large">
            <img src="" alt="Avatar" />
          </n-avatar>
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-medium text-sm">AAAAAAAA</span>
              <span class="text-sm text-gray-500">12:12</span>
            </div>
            <div class="bg-white rounded-lg p-3 shadow-sm">
              <p class="text-sm">占位符</p>
            </div>
          </div>
        </div>
      </div>

      <div class="max-w-2xl mx-auto">
        <img
          src="https://via.placeholder.com/600x800"
          alt="Game promotional content"
          class="rounded-lg shadow-lg w-full"
        />
        <div class="mt-4 text-sm text-gray-500 text-center">
          2024年11月7日 16:00
        </div>
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
            v-model="message"
          />
          <button
            class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
          >
            发送
            <Send class="w-4 h-4" />
          </button>
        </div>
        <div class="flex items-center justify-end mt-2 text-sm text-gray-500">
          <span>{{ message.length }}/500</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const message = ref('')
</script>
