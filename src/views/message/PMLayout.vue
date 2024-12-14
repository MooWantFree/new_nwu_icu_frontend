<template>
  <div
    v-if="isLoading"
    class="flex items-center justify-center h-[calc(100vh-42px)] bg-gray-50"
  >
    <div
      class="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
    ></div>
  </div>
  <div v-else-if="isLoggedIn" class="flex h-[calc(100vh-42px)] bg-gray-50">
    <!-- Sidebar -->
    <div class="w-48 bg-white border-r flex flex-col">
      <div class="p-4 border-b">
        <div class="flex items-center justify-between">
          <span class="font-medium">消息中心</span>
        </div>
      </div>
      <nav class="flex-1 overflow-y-auto p-2 space-y-1">
        <router-link
          to="/message/inbox"
          class="flex items-center px-3 py-2 text-sm rounded-lg text-gray-700 hover:bg-gray-100"
          active-class="bg-blue-50 text-blue-600"
        >
          <MessageSquare class="w-4 h-4 mr-3" />
          我的消息
        </router-link>
        <router-link
          to="/message/replies"
          class="flex items-center px-3 py-2 text-sm rounded-lg text-gray-700 hover:bg-gray-100"
          active-class="bg-blue-50 text-blue-600"
        >
          <Users class="w-4 h-4 mr-3" />
          回复我的
        </router-link>
        <router-link
          to="/message/at-me"
          class="flex items-center px-3 py-2 text-sm rounded-lg text-gray-700 hover:bg-gray-100"
          active-class="bg-blue-50 text-blue-600"
        >
          <Send class="w-4 h-4 mr-3" />
          @ 我的
        </router-link>
        <router-link
          to="/message/likes"
          class="flex items-center px-3 py-2 text-sm rounded-lg text-gray-700 hover:bg-gray-100"
          active-class="bg-blue-50 text-blue-600"
        >
          <ThumbsUp class="w-4 h-4 mr-3" />
          收到的赞
        </router-link>
        <router-link
          to="/message/system"
          class="flex items-center px-3 py-2 text-sm rounded-lg text-gray-700 hover:bg-gray-100"
          active-class="bg-blue-50 text-blue-600"
        >
          <Bell class="w-4 h-4 mr-3" />
          系统通知
        </router-link>
      </nav>
      <div class="p-4 border-t">
        <button class="flex items-center text-sm text-gray-700">
          <Settings class="w-4 h-4 mr-2" />
          消息设置
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-4">
      <router-view />
    </div>
  </div>
  <div
    v-else
    class="flex items-center justify-center h-[calc(100vh-42px)] bg-gray-50"
  >
    <p class="text-lg text-gray-600">请先登录以访问消息中心</p>
  </div>
</template>

<script setup lang="ts">
import {
  Bell,
  ThumbsUp,
  MessageSquare,
  Send,
  Settings,
  Users,
} from 'lucide-vue-next'
import { useUser } from '@/lib/useUser'

const { isLoggedIn, isLoading } = useUser()
</script>
