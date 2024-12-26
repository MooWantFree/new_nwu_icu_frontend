<template>
  <!-- Teacher card with hover effect and shadow -->
  <div
    class="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
  >
    <!-- Teacher information section with avatar -->
    <div class="flex items-center mb-4">
      <img 
        :src="`/api/file/${teacher.avatar_uuid}`" 
        alt="Teacher Avatar" 
        class="w-16 h-16 rounded-full mr-4 object-cover border-2 border-gray-200"
      />
      <div>
        <!-- Teacher name -->
        <h3 class="text-lg font-semibold text-blue-600">{{ teacher.name }}</h3>
        <!-- School information -->
        <p class="text-sm text-gray-600">{{ teacher.school }}</p>
      </div>
    </div>

    <!-- Additional information can be added here -->
    <div class="text-sm text-gray-600">
      <p class="mb-1">教师ID: {{ teacher.id }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// Import the TeacherSearchResult type for type checking
import { TeacherSearchResult } from '@/types/api/search/search'

// Define props with TypeScript type
defineProps<{
  teacher: TeacherSearchResult
}>()
</script>
