<template>
  <DialogRoot :open="show" @update:open="updateOpen">
    <ModalAccessibility>
      <DialogPortal>
        <DialogOverlay data-shadcn-modal-overlay class="fixed inset-0 bg-black/50" :style="{ zIndex: layer }" @click="handleMaskClick" />
        <DialogContent as-child aria-modal="true" v-bind="description ? {} : { 'aria-describedby': undefined }" class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" :style="{ zIndex: layer + 1 }" @escape-key-down="handleEscape" @pointer-down-outside="handleOutside" @open-auto-focus="handleAutoFocus" @close-auto-focus="restoreFocus">
          <slot />
        </DialogContent>
        <DialogTitle v-if="show" class="sr-only">{{ title }}</DialogTitle>
        <DialogDescription v-if="show && description" class="sr-only">{{ description }}</DialogDescription>
      </DialogPortal>
    </ModalAccessibility>
  </DialogRoot>
</template>

<script setup lang="ts">
import { defineComponent, nextTick, useId, watch } from 'vue'
import { DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle, injectDialogRootContext } from 'reka-ui'
import type { PointerDownOutsideEvent } from 'reka-ui'
import { useModalLayer } from '@/lib/useModalLayer'

const props = withDefaults(defineProps<{
  show: boolean
  maskClosable?: boolean
  closeOnEsc?: boolean
  autoFocus?: boolean
  busy?: boolean
  suspended?: boolean
  title?: string
  description?: string
}>(), { maskClosable: true, closeOnEsc: true, autoFocus: true, busy: false, suspended: false, title: '对话窗口' })
const emit = defineEmits<{ (event: 'update:show', show: boolean): void; (event: 'after-enter'): void }>()
const layer = useModalLayer(() => props.show)
const id = useId()
// Initialise the IDs before portalled content mounts, including initially closed dialogs.
const ModalAccessibility = defineComponent({
  setup(_props, { slots }) {
    const context = injectDialogRootContext()
    context.titleId = `modal-title-${id}`
    context.descriptionId = `modal-description-${id}`
    return () => slots.default?.()
  },
})
let returnFocus: HTMLElement | null = null
watch(() => props.show, (show, previous) => {
  if (show && !previous) returnFocus = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null
}, { immediate: true, flush: 'sync' })
const restoreFocus = (event: Event) => {
  event.preventDefault()
  void nextTick(() => { if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true }) })
}
const canDismiss = () => !props.busy && !props.suspended
const updateOpen = (show: boolean) => { if (show || canDismiss()) emit('update:show', show) }
const handleMaskClick = () => { if (props.maskClosable && canDismiss()) updateOpen(false) }
const handleEscape = (event: KeyboardEvent) => { if (!props.closeOnEsc || !canDismiss()) event.preventDefault() }
const handleOutside = (event: PointerDownOutsideEvent) => { if (!props.maskClosable || !canDismiss()) event.preventDefault() }
const handleAutoFocus = async (event: Event) => {
  if (!props.autoFocus || props.suspended) event.preventDefault()
  await nextTick()
  if (props.show && !props.suspended) emit('after-enter')
}
</script>
