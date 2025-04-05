<template>
  <button
    @click="handleExpandClick"
    class="group flex items-center px-4 py-2 rounded-full bg-white text-blue-500 hover:text-blue-700 font-semibold shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105"
  >
    <template v-if="expandButtonText">
      {{ expandButtonText }}
    </template>
    <template v-else>
      <span>{{ expanded ? '收起' : '展开' }}</span>
      <ChevronDown 
        class="w-5 h-5 ml-1 transition-transform duration-300 ease-in-out" 
        :class="{ 'rotate-180': !expanded }" 
      />
    </template>
  </button>
</template>

<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'

const { expanded, expandButtonText } = defineProps<{
  expanded: boolean
  expandButtonText?: string
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
  (e: 'buttonClick'): void
}>()

const handleExpandClick = () => {
  emit('toggle')
}
</script>
