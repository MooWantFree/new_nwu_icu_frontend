<template>
  <TooltipProvider :delay-duration="0">
    <TooltipRoot :open="isOpen" :disabled="disabled" :disable-closing-trigger="true" @update:open="updateOpen">
      <TooltipTrigger as-child @click="handleClick" @keydown.esc="dismiss" @mouseenter="hoverOpen" @mouseleave="scheduleClose" @focus="focusOpen" @blur="close">
        <slot name="trigger" />
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent v-bind="$attrs" :side="placement" :side-offset="6" :collision-padding="8" data-shadcn-tooltip class="z-[200] max-w-[min(16rem,calc(100vw-3.5rem))] break-words rounded-md bg-zinc-950 px-2.5 py-1.5 text-xs leading-5 text-white shadow-md" @mouseenter="clearCloseTimer" @mouseleave="scheduleClose" @escape-key-down="dismiss">
          <slot />
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { TooltipContent, TooltipPortal, TooltipProvider, TooltipRoot, TooltipTrigger } from 'reka-ui'

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{
  placement?: 'top' | 'bottom' | 'left' | 'right'
  trigger?: 'hover' | 'click' | 'manual'
  open?: boolean
  disabled?: boolean
}>(), { placement: 'top', trigger: 'hover', open: undefined, disabled: false })
const emit = defineEmits<{ (event: 'update:open', open: boolean): void }>()
const localOpen = ref(false)
const isOpen = computed(() => !props.disabled && (props.open ?? localOpen.value))
let timer: ReturnType<typeof setTimeout> | undefined
const clearCloseTimer = () => { if (timer !== undefined) clearTimeout(timer); timer = undefined }
const setOpen = (value: boolean) => { clearCloseTimer(); localOpen.value = value && !props.disabled; emit('update:open', localOpen.value) }
const updateOpen = (value: boolean) => { if (!value || props.trigger === 'hover') setOpen(value) }
const close = () => setOpen(false)
const hoverOpen = () => { if (props.trigger === 'hover') setOpen(true) }
const focusOpen = () => { if (props.trigger !== 'manual') setOpen(true) }
const handleClick = () => { if (props.trigger === 'click') setOpen(true) }
const scheduleClose = () => { if (props.trigger !== 'click') { clearCloseTimer(); timer = setTimeout(close, 80) } }
const dismiss = (event: KeyboardEvent) => { if (isOpen.value) { close(); event.preventDefault(); event.stopPropagation() } }
watch(() => props.disabled, disabled => { if (disabled) close() })
onBeforeUnmount(clearCloseTimer)
</script>
