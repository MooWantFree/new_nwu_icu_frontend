<template>
  <div role="status" aria-busy="true" :aria-label="label" class="loading-skeleton rounded-xl border border-zinc-200 bg-white p-5 sm:p-6">
    <span class="sr-only">{{ label }}</span>
    <div aria-hidden="true" class="space-y-6 motion-safe:animate-pulse">
      <div class="h-5 w-28 rounded bg-zinc-200" />
      <div v-for="row in rows" :key="row" class="flex gap-4">
        <div v-if="variant === 'list'" class="h-10 w-10 shrink-0 rounded-full bg-zinc-100" />
        <div class="min-w-0 flex-1 space-y-3">
          <div class="h-3 w-1/3 rounded bg-zinc-200" />
          <div class="w-full rounded bg-zinc-100" :class="variant === 'form' ? 'h-10' : 'h-3'" />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
withDefaults(defineProps<{ label?: string; rows?: number; variant?: 'list' | 'form' }>(), { label: '正在加载内容', rows: 3, variant: 'list' })
</script>
<style scoped>
.loading-skeleton { visibility: hidden; animation: reveal 0s linear 200ms forwards; }
@keyframes reveal { to { visibility: visible; } }
</style>
