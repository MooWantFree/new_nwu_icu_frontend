<template>
  <template v-for="(part, index) in highlightedParts" :key="index">
    <mark v-if="part.highlighted" class="rounded bg-amber-100 px-0.5 text-inherit">{{ part.text }}</mark>
    <template v-else>{{ part.text }}</template>
  </template>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  text: string
  highlightRanges?: [number, number][]
}>(), {
  highlightRanges: () => [],
})

const highlightedParts = computed(() => {
  const parts: { text: string, highlighted: boolean }[] = []
  let currentIndex = 0

  for (const [start, end] of props.highlightRanges) {
    const safeStart = Math.max(currentIndex, start)
    const safeEnd = Math.min(props.text.length, end)
    if (safeStart >= safeEnd) continue

    if (currentIndex < safeStart) {
      parts.push({ text: props.text.slice(currentIndex, safeStart), highlighted: false })
    }
    parts.push({ text: props.text.slice(safeStart, safeEnd), highlighted: true })
    currentIndex = safeEnd
  }

  if (currentIndex < props.text.length) {
    parts.push({ text: props.text.slice(currentIndex), highlighted: false })
  }

  return parts
})
</script>
