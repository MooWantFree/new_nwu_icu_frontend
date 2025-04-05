<template>
  <div class="flex items-center space-x-2">
    <!-- Search button -->
    <button
      @click="$emit('showSearchModal')"
      class="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
      title="搜索"
    >
      <Search class="h-5 w-5" />
    </button>

    <!-- Notifications button -->
    <router-link
      to="/message/inbox"
      class="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors relative"
      title="通知"
    >
      <Mail class="h-5 w-5" />
      <span 
        v-if="unreadCount && unreadCount.total > 0" 
        class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
      >
        {{ unreadCount.total > 99 ? '99+' : unreadCount.total }}
      </span>
    </router-link>
  </div>
</template>

<script setup lang="ts">
import {
  Search,
  Mail,
} from 'lucide-vue-next'
import { useUser } from '@/lib/useUser'

const { userInfo } = useUser()
const unreadCount = userInfo.value?.unread

defineEmits<{
  (e: 'showSearchModal'): void
}>()
</script>
