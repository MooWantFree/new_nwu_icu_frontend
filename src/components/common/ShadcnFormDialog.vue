<template>
  <NModal
    :show="show"
    :mask-closable="!busy && !suspended"
    :close-on-esc="!busy && !suspended"
    :auto-focus="false"
    :theme-overrides="{ color: '#ffffff', textColor: '#18181b' }"
    @update:show="handleVisibility"
    @after-enter="focusFirstField"
  >
    <div
      ref="panel"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      :aria-busy="busy"
      :aria-hidden="suspended || undefined"
      :inert="suspended || undefined"
      tabindex="-1"
      class="flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] flex-col rounded-xl border border-zinc-200 bg-white text-zinc-950 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.25)] outline-none"
      :class="maxWidth"
    >
      <header class="flex shrink-0 items-start justify-between gap-4 px-5 pb-0 pt-5 sm:px-6 sm:pt-6">
        <h2 :id="titleId" class="text-lg font-semibold tracking-tight">{{ title }}</h2>
        <button type="button" :aria-label="`关闭${title}窗口`" :disabled="busy || suspended"
          class="-mr-1 -mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50"
          @click="close">
          <X class="h-4 w-4" aria-hidden="true" />
        </button>
      </header>
      <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
        <slot />
      </div>
      <footer v-if="$slots.footer" class="flex shrink-0 flex-col-reverse gap-2 px-5 pb-5 sm:flex-row sm:justify-end sm:px-6 sm:pb-6">
        <slot name="footer" />
      </footer>
    </div>
  </NModal>
</template>

<script setup lang="ts">
import { nextTick, useId, useTemplateRef, watch } from 'vue'
import { NModal } from 'naive-ui'
import { X } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  show: boolean
  title: string
  busy?: boolean
  suspended?: boolean
  maxWidth?: string
}>(), { busy: false, suspended: false, maxWidth: 'max-w-lg' })
const emit = defineEmits<{ (event: 'close'): void }>()
const panel = useTemplateRef<HTMLElement>('panel')
const titleId = `form-dialog-title-${useId()}`
const close = () => {
  if (props.show && !props.busy && !props.suspended) emit('close')
}
const handleVisibility = (show: boolean) => { if (!show) close() }
const focusFirstField = () => {
  if (!props.show || props.suspended) return
  const field = panel.value?.querySelector<HTMLElement>('input:not(:disabled), [role="combobox"], select:not(:disabled), textarea:not(:disabled)')
  ;(field ?? panel.value)?.focus({ preventScroll: true })
}
watch([panel, () => props.show], async ([target, show]) => {
  if (!target || !show || props.suspended) return
  await nextTick()
  focusFirstField()
}, { flush: 'post' })
</script>
