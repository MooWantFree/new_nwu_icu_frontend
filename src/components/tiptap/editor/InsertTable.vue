<template>
  <form class="w-60 space-y-4" novalidate @submit.stop.prevent="insertTable">
    <h3 class="text-sm font-semibold text-zinc-950">插入表格</h3>
    <div class="grid grid-cols-2 gap-3">
      <div class="space-y-2">
        <label :for="rowsId" class="block text-sm font-medium text-zinc-950">行数</label>
        <input :id="rowsId" ref="rowsInput" v-model="rows" type="number" min="1" max="10" step="1" :aria-invalid="!validCount(rows)" :aria-describedby="error ? errorId : undefined" :class="inputClass" />
      </div>
      <div class="space-y-2">
        <label :for="colsId" class="block text-sm font-medium text-zinc-950">列数</label>
        <input :id="colsId" ref="colsInput" v-model="cols" type="number" min="1" max="10" step="1" :aria-invalid="!validCount(cols)" :aria-describedby="error ? errorId : undefined" :class="inputClass" />
      </div>
    </div>
    <p v-if="error" :id="errorId" role="alert" class="text-sm text-red-600">{{ error }}</p>
    <button type="submit" class="inline-flex h-9 w-full items-center justify-center rounded-md bg-zinc-950 px-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2">插入表格</button>
  </form>
</template>

<script setup lang="ts">
import { ref, useId, useTemplateRef } from 'vue'
const emit = defineEmits<{ (event: 'insert', rows: number, cols: number): void }>()
const id = useId()
const rowsId = 'table-rows-' + id
const colsId = 'table-cols-' + id
const errorId = 'table-error-' + id
const rowsInput = useTemplateRef<HTMLInputElement>('rowsInput')
const colsInput = useTemplateRef<HTMLInputElement>('colsInput')
const rows = ref<number | string>(3)
const cols = ref<number | string>(3)
const error = ref('')
const inputClass = 'h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-950 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 aria-[invalid=true]:border-red-300'
const validCount = (value: number | string) => typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 10
const insertTable = () => {
  if (!validCount(rows.value) || !validCount(cols.value)) {
    error.value = '行数和列数需要填写 1–10 之间的整数。'
    ;(!validCount(rows.value) ? rowsInput.value : colsInput.value)?.focus()
    return
  }
  error.value = ''
  emit('insert', Number(rows.value), Number(cols.value))
}
</script>