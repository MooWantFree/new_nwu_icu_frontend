<template>
  <div
    class="min-h-screen bg-gray-100 flex flex-col justify-center items-center"
  >
    <div class="text-center">
      <h1 class="text-6xl font-bold text-gray-800 mb-4">403</h1>
      <p class="text-2xl text-gray-600 mb-8">访问被拒绝</p>
      <p class="text-lg text-gray-500 mb-8">抱歉，您没有权限访问此页面。</p>
      <p class="text-lg text-gray-500 mb-8">请尝试登录后重试。</p>
      <p v-if="message" class="text-lg text-red-500 mb-8">{{ message }}</p>
      <router-link
        to="/"
        class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-300"
      >
        返回主页
      </router-link>
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps({
  message: {
    type: String,
    default: '',
  },
})
</script>
