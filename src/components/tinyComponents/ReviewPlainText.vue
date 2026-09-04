<template>
  <div :class="lineClampClass">{{ processedContent }}</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

const props = withDefaults(defineProps<{
    content: string
    lines?: 1 | 2 | 3
}>(), {
    lines: 3,
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
</script>
