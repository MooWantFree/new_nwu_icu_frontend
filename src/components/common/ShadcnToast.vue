<template>
  <div
    :role="type === 'error' ? 'alert' : 'status'"
    class="flex w-80 max-w-[calc(100vw-2rem)] items-start gap-3 rounded-lg border border-zinc-200 bg-white p-4 text-zinc-950 shadow-[0_4px_16px_rgb(0_0_0_/_0.08)]"
  >
    <span aria-hidden="true" class="mt-0.5 flex size-4 shrink-0 items-center justify-center" :class="iconTone">
      <component v-if="icon" :is="icon" />
      <component v-else :is="typeIcon" class="size-4" :class="type === 'loading' ? 'animate-spin' : undefined" />
    </span>
    <div class="min-w-0 flex-1 whitespace-pre-wrap text-sm leading-5 [overflow-wrap:anywhere]">
      <component :is="renderContent" />
    </div>
    <button
      v-if="closable"
      type="button"
      aria-label="关闭通知"
      class="-mr-1 -mt-1 flex size-6 shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
      @click="emit('close')"
    >
      <X class="size-3.5" aria-hidden="true" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, type VNodeChild } from 'vue'
import type { MessageType } from 'naive-ui'
import { Check, CircleAlert, Info, LoaderCircle, TriangleAlert, X } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  content?: string | number | (() => VNodeChild)
  type?: MessageType
  closable?: boolean
  icon?: () => VNodeChild
}>(), {
  type: 'info',
  closable: true,
})

const emit = defineEmits<{ close: [] }>()
const renderContent = () => typeof props.content === 'function' ? props.content() : props.content
const typeIcon = computed(() => {
  switch (props.type) {
    case 'success': return Check
    case 'error': return CircleAlert
    case 'warning': return TriangleAlert
    case 'loading': return LoaderCircle
    default: return Info
  }
})
const iconTone = computed(() => props.type === 'error'
  ? 'text-red-600'
  : props.type === 'warning' ? 'text-amber-600' : 'text-zinc-600')
</script>
