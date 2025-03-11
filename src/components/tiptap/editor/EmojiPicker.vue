<template>
  <div class="emoji-picker">
    <div
      class="grid grid-cols-8 gap-2 p-4 bg-white border border-gray-200 rounded-lg shadow-lg max-h-[300px] overflow-y-auto min-w-[320px]"
    >
      <button
        v-for="emoji in commonEmojis"
        :key="emoji"
        @click="$emit('select', emoji)"
        class="p-2 text-xl hover:bg-gray-100 rounded transition-colors duration-200 flex items-center justify-center"
      >
        {{ emoji }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

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
  let top = rect.bottom + 8
  if (top + pickerHeight > window.innerHeight) {
    top = rect.top - pickerHeight - 8
  }

  // Check horizontal position
  let left = rect.left
  if (left + pickerWidth > window.innerWidth) {
    left = window.innerWidth - pickerWidth - 16
  }

  picker.style.top = `${Math.max(8, top)}px`
  picker.style.left = `${Math.max(8, left)}px`
}

onMounted(() => {
  updatePosition()
  window.addEventListener('resize', updatePosition)
})

onUnmounted(() => {
  window.removeEventListener('resize', updatePosition)
})
</script>

<style scoped>
.emoji-picker {
  position: fixed;
  z-index: 50;
}

.emoji-picker > div {
  max-height: min(300px, calc(100vh - 4rem));
  min-width: 320px;
  max-width: min(320px, calc(100vw - 2rem));
}
</style>
