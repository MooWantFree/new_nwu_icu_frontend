<template>
  <button
    @click="$emit('toggle')"
    class="expand-button bg-white text-blue-500 hover:text-blue-700 font-semibold py-2 px-4 rounded-full shadow-md transition duration-300 ease-in-out transform hover:scale-105 flex items-center"
  >
    {{ expanded ? '收起' : '展开' }}
    <n-icon size="18" class="ml-1">
      <chevron-down v-if="!expanded" />
      <chevron-up v-if="expanded" />
    </n-icon>
  </button>
</template>

<script setup lang="ts">
import { NIcon } from 'naive-ui'
import { ChevronDown, ChevronUp } from '@vicons/ionicons5'

defineProps<{
  expanded: boolean
}>()

defineEmits<{
  (e: 'toggle'): void
}>()
</script>

<style scoped>
.expand-button {
  transition: all 0.3s ease
}
.expand-button:hover {
  box-shadow: 0 4px 6px rgba(50, 50, 93, 0.11), 0 1px 3px rgba(0, 0, 0, 0.08)
}
</style>
