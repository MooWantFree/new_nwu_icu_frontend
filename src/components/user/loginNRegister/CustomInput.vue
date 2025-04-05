<template>
  <div class="mb-4">
    <label 
      :for="id" 
      class="block text-sm font-medium text-gray-700 mb-1"
    >
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    
    <div class="relative">
      <input
        :id="id"
        :type="showPassword ? 'text' : type"
        :value="modelValue"
        @input="handleInput"
        :placeholder="placeholder"
        class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        :class="[
          error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300',
          loading ? 'pr-10' : ''
        ]"
      />
      
      <!-- Password toggle button -->
      <button
        v-if="type === 'password'"
        type="button"
        @click="togglePassword"
        class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
        tabindex="-1"
      >
        <Eye v-if="showPassword" class="h-5 w-5" />
        <EyeOff v-else class="h-5 w-5" />
      </button>
      
      <!-- Loading spinner -->
      <div v-if="loading" class="absolute right-3 top-1/2 transform -translate-y-1/2">
        <LoaderCircle class="animate-spin h-5 w-5 text-blue-500" />
      </div>
    </div>
    
    <div v-if="error" class="mt-1 text-sm text-red-600">
      {{ error }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { Eye, EyeOff, LoaderCircle } from 'lucide-vue-next';

const {
  type = 'text',
  required = false,
  error = '',
  loading = false
} = defineProps<{
  modelValue: string,
  id: string,
  label: string,
  placeholder: string,
  type?: string,
  required: boolean,
  error: string,
  loading: boolean
}>()

const emit = defineEmits(['update:modelValue']);

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
};

const showPassword = ref(false);

const togglePassword = () => {
  showPassword.value = !showPassword.value;
};
</script>
