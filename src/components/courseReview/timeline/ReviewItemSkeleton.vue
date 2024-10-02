<template>
  <div class="bg-white shadow-lg rounded-lg overflow-hidden animate-pulse p-6">
    <div class="flex items-center mb-4">
      <div class="w-10 h-10 bg-gray-300 rounded-full mr-4"></div>
      <div class="flex-1">
        <div class="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
        <div class="h-3 bg-gray-300 rounded w-1/5"></div>
      </div>
      <div class="flex space-x-1">
        <div v-for="i in 5" :key="i" class="w-5 h-5 bg-gray-300 rounded-full"></div>
      </div>
    </div>
    <div class="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
    <div class="space-y-2 mb-4">
      <div class="h-4 bg-gray-300 rounded"></div>
      <div class="h-4 bg-gray-300 rounded"></div>
      <div class="h-4 bg-gray-300 rounded w-5/6"></div>
    </div>
    <div class="flex justify-between items-center">
      <div class="h-4 bg-gray-300 rounded w-1/3"></div>
      <div class="h-4 bg-gray-300 rounded w-1/4"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>