<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        class="absolute inset-0 bg-black/50"
        aria-hidden="true"
        @click="emit('close')"
      />
      <section
        ref="panel"
        role="dialog"
        aria-modal="true"
        aria-label="登录或注册"
        tabindex="-1"
        class="relative max-h-[calc(100dvh-2rem)] w-full max-w-[420px] overflow-y-auto overscroll-contain rounded-xl border border-zinc-200 bg-white text-zinc-950 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.25)] outline-none"
        @keydown.esc.stop.prevent="emit('close')"
        @keydown.tab="trapFocus"
      >
        <button
          type="button"
          aria-label="关闭登录窗口"
          class="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
          @click="emit('close')"
        >
          <X class="h-4 w-4" aria-hidden="true" />
        </button>
        <LoginForm
          id-prefix="modal-"
          @login-success="handleLoginSuccess"
          @close-modal="emit('close')"
        />
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import LoginForm from '@/components/user/loginNRegister/LoginForm.vue'
import { APILogin } from '@/types/api/user/user'

type UserProfile = APILogin['response']

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'loginSuccess', data: UserProfile): void
}>()

const panel = ref<HTMLElement | null>(null)
let previousFocus: HTMLElement | null = null
let previousOverflow: string | undefined

const focusableElements = () => Array.from(panel.value?.querySelectorAll<HTMLElement>(
  'button:not(:disabled), a[href], input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
) ?? []).filter(element => element.tabIndex >= 0
  && !element.matches(':disabled')
  && !element.closest('[hidden], [inert], [aria-hidden="true"]')
  && getComputedStyle(element).display !== 'none'
  && getComputedStyle(element).visibility !== 'hidden')

const releaseDialog = () => {
  if (previousOverflow === undefined) return
  document.body.style.overflow = previousOverflow
  previousOverflow = undefined
  const target = previousFocus
  previousFocus = null
  if (target?.isConnected) target.focus({ preventScroll: true })
}

watch(() => props.isOpen, async open => {
  if (!open) {
    releaseDialog()
    return
  }
  previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  previousOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  await nextTick()
  if (!props.isOpen) return
  const elements = focusableElements()
  const firstInput = elements.find(element => element.matches('input, textarea'))
  const focusTarget = firstInput ?? elements[0] ?? panel.value
  focusTarget?.focus({ preventScroll: true })
}, { immediate: true })

const trapFocus = (event: KeyboardEvent) => {
  const elements = focusableElements()
  if (!elements.length) {
    event.preventDefault()
    panel.value?.focus({ preventScroll: true })
    return
  }
  const first = elements[0]
  const last = elements[elements.length - 1]
  if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.value)) {
    event.preventDefault()
    last.focus({ preventScroll: true })
  } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panel.value)) {
    event.preventDefault()
    first.focus({ preventScroll: true })
  }
}

onBeforeUnmount(releaseDialog)

const handleLoginSuccess = (data: UserProfile) => {
  emit('loginSuccess', data)
}
</script>
