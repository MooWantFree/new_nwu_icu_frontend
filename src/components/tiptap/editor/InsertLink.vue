<template>
  <ShadcnModal :show="modelValue" title="添加链接" :auto-focus="false" @after-enter="focusUrl" @update:show="handleVisibility">
    <section :aria-labelledby="titleId" class="w-[calc(100vw-2rem)] max-w-md bg-white p-5 outline-none sm:p-6" :class="isShadcn ? 'rounded-xl border border-zinc-200 text-zinc-950 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.25)]' : 'rounded-lg text-gray-900 shadow-xl'">
      <header class="mb-5 flex items-start justify-between gap-4">
        <h2 :id="titleId" class="text-lg font-semibold tracking-tight">添加链接</h2>
        <button type="button" aria-label="关闭添加链接窗口" class="-mr-1 -mt-1 inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2" :class="isShadcn ? 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 focus-visible:ring-zinc-400' : 'text-gray-400 hover:text-gray-600 focus-visible:ring-blue-500'" @click="handleClose"><X class="h-4 w-4" aria-hidden="true" /></button>
      </header>
      <form class="space-y-5" novalidate @submit.stop.prevent="handleSubmit">
        <div class="space-y-2">
          <label :for="urlId" class="block text-sm font-medium" :class="isShadcn ? 'text-zinc-950' : 'text-gray-700'">链接地址</label>
          <input :id="urlId" ref="urlInput" v-model="url" type="text" inputmode="url" placeholder="https://example.com 或 /announcements" :class="inputClass" required autocomplete="url" :aria-invalid="Boolean(urlError)" :aria-describedby="urlError ? errorId : undefined" />
          <p v-if="urlError" :id="errorId" role="alert" class="text-sm text-red-600">{{ urlError }}</p>
        </div>
        <div class="space-y-2">
          <label :for="textId" class="block text-sm font-medium" :class="isShadcn ? 'text-zinc-950' : 'text-gray-700'">链接文本</label>
          <input :id="textId" v-model="text" type="text" placeholder="显示文本" :class="inputClass" />
        </div>
        <footer class="flex justify-end gap-2 pt-1">
          <button type="button" class="inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" :class="isShadcn ? 'border border-zinc-200 bg-white text-zinc-950 shadow-sm hover:bg-zinc-100 focus-visible:ring-zinc-400' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus-visible:ring-gray-500'" @click="handleClose">取消</button>
          <button type="submit" class="inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium text-white shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" :class="isShadcn ? 'bg-zinc-950 hover:bg-zinc-800 focus-visible:ring-zinc-400' : 'bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500'">添加链接</button>
        </footer>
      </form>
    </section>
  </ShadcnModal>
</template>

<script setup lang="ts">
import { computed, ref, useId, useTemplateRef, watch } from 'vue'
import { X } from 'lucide-vue-next'
import ShadcnModal from '@/components/common/ShadcnModal.vue'
import { hasUnsafeUrlCharacters } from '@/lib/security'

const props = withDefaults(defineProps<{
  modelValue: boolean
  initialText?: string
  appearance?: 'default' | 'shadcn'
}>(), { appearance: 'shadcn' })
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [{ url: string; text: string }]
}>()
const id = useId()
const titleId = 'insert-link-title-' + id
const urlId = 'insert-link-url-' + id
const textId = 'insert-link-text-' + id
const errorId = 'insert-link-error-' + id
const urlInput = useTemplateRef<HTMLInputElement>('urlInput')
const isShadcn = computed(() => props.appearance === 'shadcn')
const inputClass = computed(() => isShadcn.value
  ? 'h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-950 shadow-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 aria-[invalid=true]:border-red-300 aria-[invalid=true]:focus-visible:ring-red-400'
  : 'w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors')
const url = ref('')
const text = ref(props.initialText || '')
const urlError = ref('')
const focusUrl = () => urlInput.value?.focus({ preventScroll: true })
watch(() => props.modelValue, open => {
  if (open) { text.value = props.initialText || ''; urlError.value = '' }
}, { immediate: true })
watch(() => props.initialText, value => { if (value) text.value = value })
const handleClose = () => {
  url.value = ''; text.value = ''; urlError.value = ''
  emit('update:modelValue', false)
}
const handleVisibility = (show: boolean) => { if (!show) handleClose() }
const invalidUrl = () => {
  urlError.value = '请输入有效的站内路径或 HTTP(S) 链接。'
  focusUrl()
}
const handleSubmit = () => {
  let formattedUrl = url.value.trim()
  if (!formattedUrl || formattedUrl.length > 2048 || hasUnsafeUrlCharacters(formattedUrl)) { invalidUrl(); return }
  if (formattedUrl.startsWith('/') && !formattedUrl.startsWith('//')) {
    try {
      const target = new URL(formattedUrl, window.location.origin)
      formattedUrl = target.pathname + target.search + target.hash
    } catch { invalidUrl(); return }
  } else {
    if (!/^[a-z][a-z\d+.-]*:/i.test(formattedUrl)) formattedUrl = 'https://' + formattedUrl
    try {
      const target = new URL(formattedUrl)
      if (!['http:', 'https:'].includes(target.protocol)) throw new Error('unsupported protocol')
      formattedUrl = target.toString()
    } catch { invalidUrl(); return }
  }
  if (formattedUrl.length > 2048) { invalidUrl(); return }
  urlError.value = ''
  emit('submit', { url: formattedUrl, text: text.value.trim() || formattedUrl })
  handleClose()
}
</script>