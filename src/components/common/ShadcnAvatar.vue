<template>
  <AvatarRoot as="span" class="relative inline-flex shrink-0 overflow-hidden border border-zinc-200 bg-zinc-100" :class="round ? 'rounded-full' : 'rounded-md'" :style="dimensions">
    <AvatarImage v-if="src" :src="src" :alt="alt" class="h-full w-full object-cover" />
    <AvatarFallback class="flex h-full w-full items-center justify-center text-sm font-medium text-zinc-600">
      <slot name="fallback">{{ fallback }}</slot>
    </AvatarFallback>
  </AvatarRoot>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AvatarFallback, AvatarImage, AvatarRoot } from 'reka-ui'

const props = withDefaults(defineProps<{
  src?: string
  alt?: string
  fallback?: string
  size?: number
  round?: boolean
}>(), { src: '', alt: '', fallback: '?', size: 40, round: true })
const dimensions = computed(() => ({ width: `${props.size}px`, height: `${props.size}px` }))
</script>
