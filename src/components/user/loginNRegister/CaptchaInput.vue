<template>
  <div class="mb-4">
    <label 
      :for="id" 
      class="block text-sm font-medium text-gray-700 mb-1"
    >
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    
    <div class="flex space-x-2">
      <div class="relative flex-grow">
        <input
          :id="id"
          type="text"
          :value="modelValue"
          @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
          :placeholder="placeholder"
          class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          :class="error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'"
        />
      </div>
      
      <div class="flex-shrink-0 relative w-32 h-10 border rounded-lg overflow-hidden">
        <img 
          v-if="imageUrl" 
          :src="imageUrl" 
          alt="验证码" 
          class="w-full h-full object-cover cursor-pointer"
          @click="$emit('refresh')" 
        />
        <div v-else class="w-full h-full flex items-center justify-center bg-gray-100">
          <svg class="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    </div>
    
    <div v-if="error" class="mt-1 text-sm text-red-600">
      {{ error }}
    </div>
    <div class="mt-1 text-xs text-gray-500">
      点击图片刷新验证码
    </div>
  </div>
</template>

<script lang="ts" setup>
import { defineProps, defineEmits } from 'vue';

defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  id: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  placeholder: {
    type: String,
    default: ''
  },
  required: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  imageUrl: {
    type: String,
    default: ''
  }
});

defineEmits(['update:modelValue', 'refresh']);
</script>
