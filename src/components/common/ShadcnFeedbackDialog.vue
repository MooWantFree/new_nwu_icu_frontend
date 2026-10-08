<template>
  <DialogRoot :open="true" @update:open="value => { if (!value) request.cancel() }">
    <DialogPortal>
      <DialogOverlay data-shadcn-dialog-overlay class="fixed inset-0 bg-black/50" :style="{ zIndex: 100 + stackIndex * 2 }" @click.self="request.cancel()" />
      <DialogContent
        class="fixed left-1/2 top-1/2 max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-[420px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto overscroll-contain rounded-xl border border-zinc-200 bg-white p-6 text-zinc-950 shadow-xl outline-none"
        :style="{ zIndex: 101 + stackIndex * 2 }"
        :aria-label="request.options.title" aria-modal="true"
        @open-auto-focus="focusPrompt" @close-auto-focus="restoreFocus"
      >
        <DialogTitle class="pr-7 text-base font-semibold tracking-tight">{{ request.options.title }}</DialogTitle>
        <DialogDescription class="mt-2 text-sm leading-6 text-zinc-500">{{ request.options.description }}</DialogDescription>
        <template v-if="request.kind === 'prompt'">
          <label :for="inputId" class="sr-only">补充说明</label>
          <textarea :id="inputId" ref="textarea" v-model="request.value" rows="4" :placeholder="request.options.placeholder"
            :aria-invalid="Boolean(request.error)" :aria-describedby="request.error ? `${inputId}-help ${inputId}-error` : `${inputId}-help`"
            class="mt-4 block w-full resize-y rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm leading-6 shadow-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2"
            @input="request.error = ''" />
          <p :id="`${inputId}-help`" class="mt-2 text-xs text-zinc-500">{{ Array.from(request.value).length }} / {{ request.options.maxLength ?? 500 }}</p>
          <p v-if="request.error" :id="`${inputId}-error`" role="alert" class="mt-2 text-xs text-red-600">{{ request.error }}</p>
        </template>
        <button type="button" aria-label="关闭" class="absolute right-4 top-4 inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400" @click="request.cancel">
          <X class="h-4 w-4" aria-hidden="true" />
        </button>
        <footer class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" class="inline-flex h-10 items-center justify-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium shadow-sm hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2" @click="request.cancel">{{ request.options.cancelText ?? '取消' }}</button>
          <button type="button"
            class="inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
            :class="request.options.destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-zinc-950 hover:bg-zinc-800'" @click="accept">
            {{ request.options.confirmText ?? (request.kind === 'prompt' ? '提交' : request.options.destructive ? '删除' : '确认') }}
          </button>
        </footer>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<script setup lang="ts">
import { nextTick, useTemplateRef } from 'vue'
import { DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from 'reka-ui'
import { X } from 'lucide-vue-next'
import type { FeedbackDialog } from '@/lib/shadcnFeedback'

const props = withDefaults(defineProps<{ request: FeedbackDialog; stackIndex?: number }>(), { stackIndex: 0 })
const textarea = useTemplateRef<HTMLTextAreaElement>('textarea')
const inputId = `shadcn-prompt-${props.request.id}`
const focusPrompt = (event: Event) => {
  if (props.request.kind !== 'prompt') return
  event.preventDefault()
  textarea.value?.focus({ preventScroll: true })
}
const restoreFocus = (event: Event) => {
  event.preventDefault()
  void nextTick(() => {
    const usable = (target: HTMLElement | null): target is HTMLElement => Boolean(target?.isConnected
      && !target.matches(':disabled') && !target.closest('[inert], [hidden], [aria-hidden="true"]'))
    const panels = [...document.querySelectorAll<HTMLElement>('[role="dialog"]')]
      .filter(panel => panel.dataset.state !== 'closed' && usable(panel))
    const topPanel = panels.at(-1)
    const previous = props.request.restoreFocus
    if (usable(previous) && (!topPanel || topPanel.contains(previous))) {
      previous.focus({ preventScroll: true })
      return
    }
    if (!topPanel || topPanel.contains(document.activeElement)) return
    const first = [...topPanel.querySelectorAll<HTMLElement>('input:not([type="hidden"]), textarea, button, a[href], [tabindex="0"]')].find(usable)
    ;(first ?? topPanel).focus({ preventScroll: true })
  })
}
const accept = () => {
  props.request.accept()
  if (props.request.error) void nextTick(() => textarea.value?.focus({ preventScroll: true }))
}
</script>
