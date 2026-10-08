<template>
  <span class="inline-flex align-middle">
    <span :id="id" class="sr-only">{{ content }}</span>
    <NTooltip
      :id="tooltipId"
      role="tooltip"
      trigger="manual"
      placement="top"
      to="body"
      :show="open"
      :disabled="disabled"
      :animated="false"
      :show-arrow="false"
      :theme-overrides="themeOverrides"
      :content-style="contentStyle"
      @update:show="setOpen"
      @clickoutside="closeTooltip"
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
    </NTooltip>
  </span>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, useId, watch, type CSSProperties } from 'vue'
import { NTooltip, type TooltipProps } from 'naive-ui'
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
const tooltipId = `field-help-tooltip-${useId()}`
const themeOverrides: TooltipProps['themeOverrides'] = {
  color: '#18181b',
  textColor: '#ffffff',
  borderRadius: '6px',
  padding: '6px 10px',
  boxShadow: '0 4px 12px rgb(0 0 0 / 12%)',
  peers: { Popover: { fontSize: '12px', space: '6px' } },
}
const contentStyle: CSSProperties = {
  maxWidth: 'min(16rem, calc(100vw - 3.5rem))',
  whiteSpace: 'normal',
  overflowWrap: 'anywhere',
  lineHeight: '1.5',
}

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
