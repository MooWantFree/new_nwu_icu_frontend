<template>
  <div role="alert" class="rounded-xl border border-zinc-200 bg-white px-5 py-8 text-center">
    <p class="text-sm text-zinc-700">{{ message }}</p>
    <div class="mt-4 flex flex-wrap justify-center gap-3">
      <button v-if="retryable" type="button" :disabled="busy" class="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:opacity-50" @click="$emit('retry')">{{ busy ? '重试中…' : '重试' }}</button>
      <slot />
    </div>
  </div>
</template>
<script setup lang="ts">
withDefaults(defineProps<{ message: string; busy?: boolean; retryable?: boolean }>(), { busy: false, retryable: true })
defineEmits<{ retry: [] }>()
</script>
