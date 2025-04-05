<template>
  <div class="emoji-picker">
    <div
      class="grid grid-cols-6 sm:grid-cols-8 gap-2 p-3 sm:p-4 bg-white border border-gray-200 rounded-lg shadow-lg overflow-y-auto"
    >
      <div class="col-span-full mb-1 text-xs text-gray-500 font-medium pl-1">常用表情</div>
      <button
        v-for="emoji in commonEmojis"
        :key="emoji"
        @click="$emit('select', emoji)"
        class="p-1.5 sm:p-2 text-lg sm:text-xl hover:bg-gray-100 active:bg-gray-200 rounded transition-colors duration-200 flex items-center justify-center"
      >
        {{ emoji }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

defineEmits<{
  (e: 'select', emoji: string): void
}>()

const commonEmojis = [
  '😀', '😂', '🥰', '😊', '😎', '🤔', '😴', '😭',
  '👍', '👎', '❤️', '💔', '🎉', '✨', '🌟', '💡',
  '🔥', '⭐', '💪', '🤝', '👀', '💯', '🎯', '💖'
]

const updatePosition = () => {
  const picker = document.querySelector('.emoji-picker') as HTMLElement
  if (!picker) return

  const button = picker.parentElement?.querySelector('button')
  if (!button) return

  const rect = button.getBoundingClientRect()
  const pickerHeight = picker.offsetHeight
  const pickerWidth = picker.offsetWidth

  // Check if there's enough space below
  let top = rect.bottom + 5
  if (top + pickerHeight > window.innerHeight) {
    top = rect.top - pickerHeight - 5
  }

  // Check horizontal position
  let left = rect.left
  if (left + pickerWidth > window.innerWidth) {
    left = window.innerWidth - pickerWidth - 10
  }

  picker.style.top = `${Math.max(5, top)}px`
  picker.style.left = `${Math.max(5, left)}px`
}

onMounted(() => {
  updatePosition()
  window.addEventListener('resize', updatePosition)
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('resize', updatePosition)
  document.removeEventListener('click', handleClickOutside)
})

const handleClickOutside = (event: MouseEvent) => {
  const picker = document.querySelector('.emoji-picker') as HTMLElement
  if (!picker) return

  // Check if click is outside the picker and its toggle button
  const isOutside = !picker.contains(event.target as Node) && 
    !picker.parentElement?.querySelector('button')?.contains(event.target as Node)
  
  if (isOutside) {
    // Emit an event that parent component can listen to for closing
    const customEvent = new CustomEvent('emoji-picker-outside-click')
    document.dispatchEvent(customEvent)
  }
}
</script>

<style scoped>
.emoji-picker {
  position: fixed;
  z-index: 50;
}

.emoji-picker > div {
  max-height: min(300px, calc(100vh - 2rem));
  min-width: 260px;
  max-width: min(320px, calc(100vw - 1rem));
}
</style>
