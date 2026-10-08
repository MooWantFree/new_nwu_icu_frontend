<template>
  <nav aria-label="分页" class="flex w-full flex-wrap items-center justify-center gap-3 text-zinc-700">
    <ul class="flex flex-wrap items-center justify-center gap-0.5 sm:gap-1">
      <li>
        <button
          type="button"
          aria-label="上一页"
          :disabled="currentPage === 1"
          :class="buttonClass"
          class="w-8 gap-1 border-transparent sm:w-auto sm:px-3"
          @click="selectPage(currentPage - 1)"
        >
          <ChevronLeft class="h-4 w-4" aria-hidden="true" />
          <span class="hidden sm:inline">上一页</span>
        </button>
      </li>
      <li v-for="item in pageItems" :key="item">
        <button
          v-if="typeof item === 'number'"
          type="button"
          :aria-label="`第 ${item} 页`"
          :aria-current="item === currentPage ? 'page' : undefined"
          :class="[buttonClass, item === currentPage ? 'border-zinc-200 bg-white text-zinc-950 shadow-sm' : 'border-transparent']"
          class="w-8 tabular-nums sm:w-9"
          @click="selectPage(item)"
        >
          {{ item }}
        </button>
        <span v-else class="flex h-8 w-8 items-center justify-center text-zinc-400 sm:h-9 sm:w-9" aria-hidden="true">
          <MoreHorizontal class="h-4 w-4" />
        </span>
      </li>
      <li>
        <button
          type="button"
          aria-label="下一页"
          :disabled="currentPage === totalPages"
          :class="buttonClass"
          class="w-8 gap-1 border-transparent sm:w-auto sm:px-3"
          @click="selectPage(currentPage + 1)"
        >
          <span class="hidden sm:inline">下一页</span>
          <ChevronRight class="h-4 w-4" aria-hidden="true" />
        </button>
      </li>
    </ul>
    <form class="flex items-center gap-2" @submit.prevent="jumpToPage">
      <label class="flex items-center gap-2 text-sm text-zinc-500">
        <span>跳至</span>
        <input
          v-model="jumpPage"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          aria-label="跳转到指定页"
          class="h-8 w-14 rounded-md border border-zinc-200 bg-white px-2 text-center text-sm tabular-nums text-zinc-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 sm:h-9"
        />
      </label>
      <button type="submit" aria-label="跳转" :class="buttonClass" class="w-8 border-zinc-200 bg-white shadow-sm sm:w-9">
        <ArrowRight class="h-4 w-4" aria-hidden="true" />
      </button>
    </form>
  </nav>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ArrowRight, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-vue-next'

const props = defineProps<{ page: number; pageCount: number }>()
const emit = defineEmits<{ 'update:page': [page: number] }>()

const buttonClass = 'inline-flex h-8 min-w-8 items-center justify-center rounded-md border text-sm font-medium transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 sm:h-9 sm:min-w-9'
const totalPages = computed(() => Math.max(1, Number.isFinite(props.pageCount) ? Math.floor(props.pageCount) : 1))
const currentPage = computed(() => Math.min(totalPages.value, Math.max(1, Number.isFinite(props.page) ? Math.floor(props.page) : 1)))
const jumpPage = ref(String(currentPage.value))

const pageItems = computed<Array<number | 'start-gap' | 'end-gap'>>(() => {
  const total = totalPages.value
  const current = currentPage.value
  if (total <= 5) return Array.from({ length: total }, (_, index) => index + 1)
  if (current <= 3) return [1, 2, 3, 'end-gap', total]
  if (current >= total - 2) return [1, 'start-gap', total - 2, total - 1, total]
  return [1, 'start-gap', current, 'end-gap', total]
})

const selectPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value && page !== currentPage.value) emit('update:page', page)
}

const jumpToPage = () => {
  const value = jumpPage.value.trim()
  const page = Number(value)
  if (/^\d+$/.test(value) && Number.isSafeInteger(page)) selectPage(page)
  jumpPage.value = String(currentPage.value)
}

watch(currentPage, page => { jumpPage.value = String(page) })
</script>
