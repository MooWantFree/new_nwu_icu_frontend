<template>
  <button
    type="button"
    aria-label="返回主页"
    class="flex h-11 w-11 items-center justify-center rounded-lg transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
    @click="handleLogoClick"
  >
    <img alt="NWU.ICU logo" src="@/assets/logo.png" class="h-9 w-9 object-contain" />
  </button>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()

const emit = defineEmits<{
  (event: 'showMessage', message: string): void
}>()

const handleLogoClick = () => {
  if (route.path === '/') {
    emit('showMessage', '你已经在主页了')
    return
  }

  void router.push('/')
}
</script>
