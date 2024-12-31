<template>
  <div class="line-clamp-3">{{ processedContent }}</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

const { content } = defineProps<{
    content: string
}>()
const processedContent = computed(() => {
    let newContent = content.replace(/<img[^>]*>/g, '[图片]\n')
    const doc = new DOMParser().parseFromString(newContent, 'text/html')
    return doc.body.textContent
})

</script>