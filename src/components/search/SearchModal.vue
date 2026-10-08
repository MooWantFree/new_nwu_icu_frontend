<template>
  <ShadcnModal :show="true" title="全局搜索" :auto-focus="false" :suspended="creating" :mask-closable="!creating" :close-on-esc="!creating" @update:show="handleVisibility">
    <div role="dialog" aria-modal="true" aria-label="全局搜索" :aria-hidden="creating || undefined" :inert="creating || undefined" tabindex="-1"
      class="w-[calc(100vw-2rem)] max-w-2xl rounded-xl border border-zinc-200 bg-white text-zinc-950 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.25)] outline-none">
      <SearchComponent @close="close" @update:creating="creating = $event" />
    </div>
  </ShadcnModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ShadcnModal from '@/components/common/ShadcnModal.vue'
import SearchComponent from './Search.vue'

const emit = defineEmits<{ (event: 'close'): void }>()
const creating = ref(false)
const close = () => { if (!creating.value) emit('close') }
const handleVisibility = (show: boolean) => { if (!show) close() }
</script>
