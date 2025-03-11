<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 overflow-hidden"
    @click.self="$emit('close')"
  >
    <div class="w-full max-w-2xl bg-white rounded-lg shadow-xl overflow-hidden">
      <SearchComponent @close="$emit('close')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import SearchComponent from './Search.vue'

onMounted(() => {
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  document.body.style.overflow = ''
})

defineEmits<{
  (e: 'close'): void
}>()
</script>
