<template>
  <div
    class="min-h-screen bg-gray-100 flex flex-col justify-center items-center px-4"
  >
    <div class="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
      <h1 class="text-3xl font-bold text-red-600 mb-4">{{ title }}</h1>
      <p class="text-lg text-gray-700 mb-6">{{ description }}</p>
      <button
        @click="reload"
        class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-300"
      >
        重新加载
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const {
  title = '加载错误',
  description = '抱歉，加载过程中出现了问题。请稍后重试。',
} = defineProps<{
  title?: string
  description?: string
}>()

const reload = () => {
  window.location.reload()
}
</script>
