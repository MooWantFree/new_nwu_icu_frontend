<template>
  <div class="flex items-center space-x-2">
    <!-- Search button -->
    <button
      type="button"
      @click="$emit('showSearchModal')"
      class="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-500 shadow-sm transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
      aria-label="打开全局搜索"
      aria-haspopup="dialog"
      title="全局搜索"
    >
      <Search class="h-4 w-4" aria-hidden="true" />
      <span>搜索…</span>
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
import { computed } from 'vue'

const { userInfo } = useUser()
const unreadCount = computed(() => userInfo.value?.unread)

defineEmits<{
  (e: 'showSearchModal'): void
}>()
</script>
