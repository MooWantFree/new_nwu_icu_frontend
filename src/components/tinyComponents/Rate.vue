<template>
  <div class="flex items-center">
    <template v-for="star in max" :key="star">
      <svg
        :class="[
          'w-5 h-5 transition-all duration-200',
          !readonly ? 'cursor-pointer' : '',
          star <= (hoverRating || modelValue)
            ? 'text-yellow-400'
            : 'text-gray-300',
          hoverRating === star ? 'transform scale-110' : '',
        ]"
        @click="!readonly && updateRating(star)"
        @mouseenter="!readonly && (() => hoverRating = star)()"
        @mouseleave="!readonly && (() => hoverRating = 0)()"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
        />
      </svg>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const { readonly = false, modelValue, max = 5 } = defineProps<{
  readonly?: boolean
  modelValue: number
  max?: number
}>()

const emit = defineEmits(['update:modelValue'])

const hoverRating = ref(0)

const updateRating = (rating: number) => {
  emit('update:modelValue', rating)
}
</script>
