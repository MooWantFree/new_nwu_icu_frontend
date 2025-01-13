<template>
  <div
    class="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
  >
    <template v-if="activeTab === searchEnums.course">
      <div class="animate-pulse">
        <div class="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div class="grid grid-cols-2 gap-2 mb-3">
          <div v-for="i in 4" :key="i" class="h-4 bg-gray-200 rounded"></div>
        </div>
        <div class="flex justify-between items-center mb-3">
          <div class="h-4 bg-gray-200 rounded w-1/4"></div>
          <div class="h-8 bg-gray-200 rounded w-24"></div>
        </div>
        <div class="flex justify-between items-center">
          <div class="flex space-x-4">
            <div class="h-4 bg-gray-200 rounded w-12"></div>
            <div class="h-4 bg-gray-200 rounded w-12"></div>
          </div>
          <div class="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    </template>
    <template v-else-if="activeTab === searchEnums.resource">
      <div class="animate-pulse">
        <div class="flex items-center justify-between mb-3">
          <div class="h-6 bg-gray-200 rounded w-3/4"></div>
          <div class="h-6 w-16 bg-gray-200 rounded"></div>
        </div>
        <div class="flex justify-between items-center">
          <div class="space-y-2">
            <div class="h-4 bg-gray-200 rounded w-24"></div>
          </div>
          <div class="h-8 w-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    </template>
    <template v-else-if="activeTab === searchEnums.review">
      <div class="animate-pulse">
        <div class="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div class="h-4 bg-gray-200 rounded w-full mb-1"></div>
        <div class="h-4 bg-gray-200 rounded w-full mb-1"></div>
        <div class="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center">
            <div class="w-6 h-6 bg-gray-200 rounded-full mr-2"></div>
            <div class="h-4 bg-gray-200 rounded w-24"></div>
          </div>
          <div class="w-20 h-6 bg-gray-200 rounded"></div>
        </div>
        <div class="flex items-center justify-between">
          <div class="w-16 h-4 bg-gray-200 rounded"></div>
          <div class="flex items-center space-x-4">
            <div class="w-12 h-4 bg-gray-200 rounded"></div>
            <div class="w-12 h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </template>
    <template v-else-if="activeTab === searchEnums.teacher">
      <div class="animate-pulse">
        <div class="flex items-center mb-4">
          <div class="w-16 h-16 bg-gray-200 rounded-full mr-4"></div>
          <div>
            <div class="h-5 bg-gray-200 rounded w-32 mb-2"></div>
            <div class="h-4 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
        <div class="h-4 bg-gray-200 rounded w-20 mb-1"></div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { searchEnums } from './enums'
import type { SearchType } from './enums'
defineProps<{
  activeTab: SearchType
}>()
</script>
