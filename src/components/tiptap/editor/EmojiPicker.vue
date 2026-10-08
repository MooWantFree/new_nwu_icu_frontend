<template>
  <div class="w-64 max-w-[calc(100vw-2rem)]" role="group" :aria-labelledby="titleId">
    <h3 :id="titleId" class="mb-2 px-1 text-xs font-medium text-zinc-500">常用表情</h3>
    <div class="grid grid-cols-6 gap-1">
      <button v-for="(emoji, index) in commonEmojis" :key="emoji" type="button" :aria-label="'插入表情 ' + emoji" class="inline-flex h-10 w-10 items-center justify-center rounded-md text-xl transition-colors hover:bg-zinc-100 active:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400" @click="$emit('select', emoji)" @keydown="moveFocus($event, index)">{{ emoji }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useId } from 'vue'
defineEmits<{ (event: 'select', emoji: string): void }>()
const titleId = 'emoji-picker-' + useId()
const commonEmojis = [
  '😀', '😂', '🥰', '😊', '😎', '🤔', '😴', '😭',
  '👍', '👎', '❤️', '💔', '🎉', '✨', '🌟', '💡',
  '🔥', '⭐', '💪', '🤝', '👀', '💯', '🎯', '💖',
]
const moveFocus = (event: KeyboardEvent, index: number) => {
  const directions: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -6, ArrowDown: 6 }
  if (!(event.key in directions) && !['Home', 'End'].includes(event.key)) return
  event.preventDefault(); event.stopPropagation()
  const buttons = (event.currentTarget as HTMLElement).parentElement?.querySelectorAll<HTMLButtonElement>('button')
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? commonEmojis.length - 1 : (index + directions[event.key] + commonEmojis.length) % commonEmojis.length
  buttons?.[next]?.focus()
}
</script>