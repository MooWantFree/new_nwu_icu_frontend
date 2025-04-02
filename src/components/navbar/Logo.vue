<template>
  <div 
    class="flex items-center cursor-pointer" 
    @click="handleLogoClick"
  >
    <img 
      alt="logo image" 
      src="@/assets/logo.png"
      class="mr-3 h-8 w-8"
    />
    <button 
      class="px-2 py-1 text-black border border-dashed border-black rounded hover:bg-gray-100 transition-colors"
    >
      NWU.ICU
    </button>
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const handleLogoClick = () => {
  if (route.path === '/') {
    // Using a custom event instead of directly showing a message
    // This allows the parent component to handle the notification
    emit('showMessage', '你已经在主页了')
    return
  }
  router.push('/')
}

const emit = defineEmits<{
  (e: 'showMessage', message: string): void
}>()
</script>
