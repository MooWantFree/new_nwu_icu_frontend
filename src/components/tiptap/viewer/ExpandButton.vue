<template>
  <button
    type="button"
    :aria-expanded="expanded"
    @click="handleExpandClick"
    class="group inline-flex min-h-10 items-center justify-center gap-1.5 rounded-md border border-zinc-200 bg-white/95 px-4 py-2 text-sm font-medium leading-5 text-zinc-950 shadow-sm backdrop-blur-sm transition-colors duration-200 hover:bg-zinc-100 active:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 motion-reduce:transition-none"
  >
    <template v-if="expandButtonText">
      {{ expandButtonText }}
    </template>
    <template v-else>
      <span>{{ expanded ? '收起全文' : '展开全文' }}</span>
      <ChevronDown
        aria-hidden="true"
        class="h-4 w-4 transition-transform duration-200 ease-out motion-reduce:transition-none"
        :class="{ 'rotate-180': expanded }"
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
