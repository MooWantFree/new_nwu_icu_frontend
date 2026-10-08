<template>
  <button
    type="button"
    aria-label="返回主页"
    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
    @click="handleLogoClick"
  >
    <img alt="NWU.ICU logo" src="@/assets/logo.png" class="h-8 w-8 object-contain" />
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
