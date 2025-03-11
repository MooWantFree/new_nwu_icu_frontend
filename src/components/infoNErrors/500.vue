<template>
  <div
    class="min-h-screen bg-gray-100 flex flex-col justify-center items-center px-4"
  >
    <h1 class="text-6xl font-bold text-red-600 mb-4">500</h1>
    <h2 class="text-3xl font-semibold text-gray-800 mb-4">服务器内部错误</h2>
    <p class="text-xl text-gray-600 mb-8">抱歉!我们的服务器出现了问题。</p>
    <p v-if="message" class="text-lg text-red-500 mb-6">{{ message }}</p>
    <router-link
      to="/"
      class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-300"
    >
      返回主页
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()
const message = computed(() => {
  let message = route.query.message || ''
  if (Array.isArray(message)) message = message.join('\n')
  return decodeURI(message)
})
</script>
