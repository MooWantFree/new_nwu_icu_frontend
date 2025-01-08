<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-50 flex items-center justify-center"
  >
    <!-- 背景遮罩 -->
    <div
      class="absolute inset-0 bg-black/50"
      @click="$emit('update:modelValue', false)"
    ></div>

    <!-- 模态框 -->
    <div class="relative w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
      <h3 class="mb-4 text-lg font-semibold text-gray-900">添加链接</h3>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label
            for="linkUrl"
            class="block mb-1 text-sm font-medium text-gray-700"
            >链接地址</label
          >
          <input
            id="linkUrl"
            v-model="url"
            type="url"
            placeholder="https://example.com"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label
            for="linkText"
            class="block mb-1 text-sm font-medium text-gray-700"
            >链接文本</label
          >
          <input
            id="linkText"
            v-model="text"
            type="text"
            placeholder="显示文本"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div class="flex justify-end gap-2 mt-6">
          <button
            type="button"
            @click="handleClose"
            class="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            取消
          </button>
          <button
            type="submit"
            class="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            添加链接
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

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
  () => props.initialText,
  (newValue) => {
    if (newValue) {
      text.value = newValue
    }
  }
)

const handleClose = () => {
  url.value = ''
  text.value = ''
  emit('update:modelValue', false)
}

const handleSubmit = () => {
  emit('submit', {
    url: url.value,
    text: text.value,
  })
  handleClose()
}
</script>
