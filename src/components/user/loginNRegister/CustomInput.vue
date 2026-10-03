<template>
  <div class="space-y-2">
    <div class="flex min-h-4 items-center justify-between gap-3">
      <label :for="id" class="block text-sm font-medium leading-none text-zinc-950">
        {{ label }}
      </label>
      <slot name="label-action" />
    </div>
    <div class="relative">
      <input
        :id="id"
        :name="id"
        :type="showPassword && type === 'password' ? 'text' : type"
        :value="modelValue"
        :autocomplete="autocomplete"
        :placeholder="placeholder"
        :disabled="disabled"
        :aria-required="required"
        :aria-invalid="Boolean(error)"
        :aria-describedby="error ? `${id}-error` : undefined"
        class="h-10 w-full rounded-md border bg-white px-3 text-sm text-zinc-950 shadow-sm transition-colors placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:opacity-60"
        :class="[
          error ? 'border-red-400 focus:ring-red-300' : 'border-zinc-200 focus:border-zinc-400 focus:ring-zinc-300',
          loading || type === 'password' ? 'pr-10' : '',
        ]"
        @input="handleInput"
      />
      <button
        v-if="type === 'password' && !loading"
        type="button"
        :aria-label="showPassword ? '隐藏密码' : '显示密码'"
        :aria-pressed="showPassword"
        :disabled="disabled"
        class="absolute right-1 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-sm text-zinc-400 transition-colors hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:cursor-not-allowed"
        @click="showPassword = !showPassword"
      >
        <EyeOff v-if="showPassword" class="h-4 w-4" aria-hidden="true" />
        <Eye v-else class="h-4 w-4" aria-hidden="true" />
      </button>
      <span
        v-if="loading"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
        aria-hidden="true"
      >
        <LoaderCircle class="h-4 w-4 animate-spin" />
      </span>
    </div>
    <p v-if="error" :id="`${id}-error`" class="text-xs leading-5 text-red-600">
      {{ error }}
    </p>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { Eye, EyeOff, LoaderCircle } from 'lucide-vue-next'

withDefaults(defineProps<{
  modelValue: string
  id: string
  label: string
  placeholder: string
  type?: string
  required?: boolean
  error?: string
  loading?: boolean
  disabled?: boolean
  autocomplete?: string
}>(), {
  type: 'text',
  required: false,
  error: '',
  loading: false,
  disabled: false,
  autocomplete: undefined,
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()
const showPassword = ref(false)
const handleInput = (event: Event) => {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>
