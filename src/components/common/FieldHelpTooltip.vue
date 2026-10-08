<template>
  <span class="inline-flex align-middle">
    <span :id="id" class="sr-only">{{ content }}</span>
    <ShadcnTooltip
      trigger="manual"
      placement="top"
      :open="open"
      :disabled="disabled"
      @update:open="setOpen"
      @mouseenter="showTooltip"
      @mouseleave="scheduleClose"
    >
      <template #trigger>
        <button
          type="button"
          :aria-label="label"
          :aria-describedby="id"
          :aria-disabled="ariaDisabled ? true : undefined"
          :disabled="disabled"
          :class="[
            'inline-flex shrink-0 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
            badge
              ? 'cursor-help gap-1 border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 focus-visible:bg-zinc-100'
              : buttonText
              ? 'h-10 cursor-not-allowed border border-zinc-200 bg-zinc-100 px-4 text-sm font-medium text-zinc-500'
              : 'h-7 w-7 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700',
          ]"
          @mouseenter="showTooltip"
          @mouseleave="scheduleClose"
          @focus="showTooltip"
          @blur="closeTooltip"
          @click="showTooltip"
          @keydown="handleKeydown"
        >
          <slot v-if="badge" name="icon" />
          <span v-if="buttonText">{{ buttonText }}</span>
          <CircleHelp v-else class="h-4 w-4" aria-hidden="true" />
        </button>
      </template>
      {{ content }}
    </ShadcnTooltip>
  </span>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import ShadcnTooltip from './ShadcnTooltip.vue'
import { CircleHelp } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  id: string
  label: string
  content: string
  disabled?: boolean
  buttonText?: string
  ariaDisabled?: boolean
  badge?: boolean
}>(), { disabled: false, ariaDisabled: false, badge: false })

const open = ref(false)

let closeTimer: ReturnType<typeof setTimeout> | undefined
const clearCloseTimer = () => {
  if (closeTimer !== undefined) clearTimeout(closeTimer)
  closeTimer = undefined
}
const setOpen = (value: boolean) => {
  clearCloseTimer()
  open.value = value && !props.disabled
}
const showTooltip = () => setOpen(true)
const closeTooltip = () => setOpen(false)
const scheduleClose = () => {
  clearCloseTimer()
  closeTimer = setTimeout(closeTooltip, 80)
}
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape' || !open.value) return
  closeTooltip()
  event.preventDefault()
  event.stopPropagation()
}

watch(() => props.disabled, disabled => { if (disabled) closeTooltip() })
onBeforeUnmount(clearCloseTimer)
</script>
