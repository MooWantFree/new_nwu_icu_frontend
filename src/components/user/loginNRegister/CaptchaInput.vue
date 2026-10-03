<template>
  <div class="space-y-2">
    <label :for="id" class="block text-sm font-medium leading-none text-zinc-950">
      {{ label }}
    </label>
    <div class="flex gap-2">
      <input
        :id="id"
        type="text"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :aria-required="required"
        :aria-invalid="Boolean(error)"
        :aria-describedby="error ? `${id}-error ${id}-hint` : `${id}-hint`"
        autocomplete="off"
        class="h-10 min-w-0 flex-1 rounded-md border bg-white px-3 text-sm text-zinc-950 shadow-sm transition-colors placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        :class="error ? 'border-red-400 focus:ring-red-300' : 'border-zinc-200 focus:border-zinc-400 focus:ring-zinc-300'"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
      <CaptchaImage
        class="captcha-image w-28 rounded-md border-zinc-200 bg-zinc-50"
        :image-url="imageUrl"
        :loading="loading"
        image-fit="cover"
        @refresh="$emit('refresh')"
        @error="$emit('error')"
      />
    </div>
    <p v-if="error" :id="`${id}-error`" class="text-xs leading-5 text-red-600">
      {{ error }}
    </p>
    <p :id="`${id}-hint`" class="text-xs text-zinc-500">看不清？点击图片刷新。</p>
  </div>
</template>

<script lang="ts" setup>
import CaptchaImage from '@/components/common/CaptchaImage.vue'

withDefaults(defineProps<{
  modelValue: string
  id: string
  label: string
  placeholder: string
  required: boolean
  error: string
  imageUrl: string
  loading?: boolean
  disabled?: boolean
}>(), { loading: false, disabled: false })

defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'refresh'): void
  (e: 'error'): void
}>()
</script>

<style scoped>
.captcha-image:focus {
  --tw-ring-color: #a1a1aa;
}
.captcha-image :deep(svg) {
  color: #71717a;
}
</style>
