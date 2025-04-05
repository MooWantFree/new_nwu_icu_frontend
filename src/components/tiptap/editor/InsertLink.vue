<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-0"
  >
    <!-- 背景遮罩 -->
    <div
      class="absolute inset-0 bg-black/60 backdrop-blur-sm"
      @click="handleClose"
    ></div>

    <!-- 模态框 -->
    <div class="relative w-full max-w-md p-5 sm:p-6 bg-white rounded-lg shadow-xl animate-fadeIn">
      <button
        type="button"
        @click="handleClose"
        class="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="关闭"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
      
      <h3 class="mb-5 text-xl font-semibold text-gray-900">添加链接</h3>

      <form @submit.prevent="handleSubmit" class="space-y-5">
        <div>
          <label
            for="linkUrl"
            class="block mb-1.5 text-sm font-medium text-gray-700"
            >链接地址</label
          >
          <input
            id="linkUrl"
            v-model="url"
            type="url"
            placeholder="https://example.com"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            required
            autocomplete="url"
          />
        </div>

        <div>
          <label
            for="linkText"
            class="block mb-1.5 text-sm font-medium text-gray-700"
            >链接文本</label
          >
          <input
            id="linkText"
            v-model="text"
            type="text"
            placeholder="显示文本"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        <div class="flex justify-end gap-3 mt-6">
          <button
            type="button"
            @click="handleClose"
            class="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            class="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-colors"
          >
            添加链接
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

const props = defineProps<{
  modelValue: boolean
  initialText?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [{ url: string; text: string }]
}>()

const url = ref('')
const text = ref('')

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      // Focus the url input when modal opens
      setTimeout(() => {
        document.getElementById('linkUrl')?.focus()
      }, 100)
    }
  }
)

watch(
  () => props.initialText,
  (newValue) => {
    if (newValue) {
      text.value = newValue
    }
  },
  { immediate: true }
)

const handleClose = () => {
  url.value = ''
  text.value = ''
  emit('update:modelValue', false)
}

const handleSubmit = () => {
  // Ensure URL has protocol
  let formattedUrl = url.value.trim()
  if (formattedUrl && !formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    formattedUrl = 'https://' + formattedUrl
  }
  
  emit('submit', {
    url: formattedUrl,
    text: text.value.trim() || formattedUrl,
  })
  handleClose()
}
</script>

<style scoped>
.animate-fadeIn {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
