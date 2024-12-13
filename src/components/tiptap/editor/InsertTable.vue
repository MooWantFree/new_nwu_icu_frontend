<template>
  <div
    class="table-insert p-4 bg-white border border-gray-200 rounded-lg shadow-lg"
  >
    <div class="flex flex-col gap-4">
      <div class="flex gap-4">
        <div class="flex flex-col gap-2">
          <label class="text-sm text-gray-600">行数</label>
          <input
            type="number"
            v-model="rows"
            min="1"
            max="10"
            class="w-20 px-2 py-1 border border-gray-300 rounded"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm text-gray-600">列数</label>
          <input
            type="number"
            v-model="cols"
            min="1"
            max="10"
            class="w-20 px-2 py-1 border border-gray-300 rounded"
          />
        </div>
      </div>
      <button
        @click="insertTable"
        class="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
      >
        插入表格
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const emit = defineEmits<{
  (e: 'insert', rows: number, cols: number): void
}>()

const rows = ref(3)
const cols = ref(3)

const insertTable = () => {
  emit('insert', rows.value, cols.value)
}

const updatePosition = () => {
  const insert = document.querySelector('.table-insert') as HTMLElement
  if (!insert) return

  const button = insert.parentElement?.querySelector('button')
  if (!button) return

  const rect = button.getBoundingClientRect()
  const insertHeight = insert.offsetHeight
  const insertWidth = insert.offsetWidth

  // Check if there's enough space below
  let top = rect.bottom + 8
  if (top + insertHeight > window.innerHeight) {
    top = rect.top - insertHeight - 8
  }

  // Check horizontal position
  let left = rect.left
  if (left + insertWidth > window.innerWidth) {
    left = window.innerWidth - insertWidth - 16
  }

  insert.style.top = `${Math.max(8, top)}px`
  insert.style.left = `${Math.max(8, left)}px`
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
.table-insert {
  position: fixed;
  z-index: 50;
  max-width: min(300px, calc(100vw - 2rem));
}
</style>
