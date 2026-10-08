<template>
  <ShadcnModal :show="show" title="外部链接" description="你即将访问一个外部网站。" @update:show="handleVisibility">
    <section :aria-labelledby="titleId" class="w-[calc(100vw-2rem)] max-w-md rounded-xl border border-zinc-200 bg-white p-5 text-zinc-950 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.25)] outline-none sm:p-6">
      <header class="flex items-start justify-between gap-4">
        <h2 :id="titleId" class="text-lg font-semibold tracking-tight">外部链接</h2>
        <button type="button" aria-label="关闭外部链接窗口" class="-mr-1 -mt-1 inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400" @click="emit('cancel')"><X class="h-4 w-4" aria-hidden="true" /></button>
      </header>
      <p class="mt-2 text-sm leading-6 text-zinc-500">你即将访问一个外部网站：</p>
      <p class="mt-3 break-all rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm leading-6 text-zinc-700">{{ url }}</p>
      <p v-if="!safeUrl" role="alert" class="mt-3 text-sm text-red-600">该链接无法打开。</p>
      <footer class="mt-6 flex justify-end gap-2">
        <button type="button" class="inline-flex h-10 items-center justify-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium shadow-sm transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2" @click="emit('cancel')">取消</button>
        <button type="button" :disabled="!safeUrl" class="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" @click="confirm">继续<ExternalLink class="h-4 w-4" aria-hidden="true" /></button>
      </footer>
    </section>
  </ShadcnModal>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import { ExternalLink, X } from 'lucide-vue-next'
import ShadcnModal from '@/components/common/ShadcnModal.vue'
import { toSafeExternalUrl } from '@/lib/security'
const props = defineProps<{ show: boolean; url: string }>()
const emit = defineEmits<{ (event: 'confirm'): void; (event: 'cancel'): void }>()
const id = useId()
const titleId = 'external-link-title-' + id
const safeUrl = computed(() => toSafeExternalUrl(props.url))
const confirm = () => { if (safeUrl.value) emit('confirm') }
const handleVisibility = (show: boolean) => { if (!show) emit('cancel') }
</script>
