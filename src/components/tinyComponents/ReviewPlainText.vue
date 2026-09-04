<template>
  <div :class="lineClampClass">
    <template v-for="(part, index) in highlightedParts" :key="index">
      <mark v-if="part.highlighted" class="rounded bg-amber-100 px-0.5 text-inherit">{{ part.text }}</mark>
      <template v-else>{{ part.text }}</template>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

const props = withDefaults(defineProps<{
    content: string
    lines?: 1 | 2 | 3
    highlightRanges?: [number, number][]
}>(), {
    lines: 3,
    highlightRanges: () => [],
})

const lineClampClass = computed(() => ({
    'line-clamp-1': props.lines === 1,
    'line-clamp-2': props.lines === 2,
    'line-clamp-3': props.lines === 3,
}))

const processedContent = computed(() => {
    const newContent = props.content.replace(/<img[^>]*>/g, '[图片]\n')
    const doc = new DOMParser().parseFromString(newContent, 'text/html')
    return doc.body.textContent
})

const highlightedParts = computed(() => {
    const parts: { text: string, highlighted: boolean }[] = []
    let currentIndex = 0

    for (const [start, end] of props.highlightRanges) {
        const safeStart = Math.max(currentIndex, start)
        const safeEnd = Math.min(processedContent.value.length, end)
        if (safeStart >= safeEnd) continue

        if (currentIndex < safeStart) {
            parts.push({ text: processedContent.value.slice(currentIndex, safeStart), highlighted: false })
        }
        parts.push({ text: processedContent.value.slice(safeStart, safeEnd), highlighted: true })
        currentIndex = safeEnd
    }

    if (currentIndex < processedContent.value.length) {
        parts.push({ text: processedContent.value.slice(currentIndex), highlighted: false })
    }

    return parts
})
</script>
