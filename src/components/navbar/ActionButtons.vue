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
      class="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
      title="通知"
    >
      <Mail class="h-5 w-5" />
    </router-link>
  </div>
</template>

<script setup lang="ts">
import {
  Search,
  Mail,
} from 'lucide-vue-next'

defineEmits<{
  (e: 'showSearchModal'): void
}>()
</script>
