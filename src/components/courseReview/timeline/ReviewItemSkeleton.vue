<template>
  <div
    class="flex animate-pulse items-start gap-3"
    :class="align === 'right' ? 'flex-row-reverse' : ''"
  >
    <div class="h-10 w-10 shrink-0 rounded-full bg-gray-200" />
    <div class="min-w-0 flex-1 rounded-2xl border border-gray-200 bg-white p-4">
      <div class="flex items-center gap-2">
        <div class="h-3.5 w-20 rounded bg-gray-200" />
        <div class="h-3.5 w-10 rounded bg-gray-100" />
        <div class="h-3.5 flex-1 rounded bg-gray-200" />
        <div class="h-3.5 w-12 rounded bg-gray-100" />
      </div>
      <div class="mt-3 space-y-2">
        <div class="h-3.5 rounded bg-gray-200" />
        <div class="h-3.5 w-4/5 rounded bg-gray-100" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  align?: 'left' | 'right'
}>(), {
  align: 'left',
})
</script>
