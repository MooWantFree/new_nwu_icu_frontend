<template>
  <!-- Teacher card with hover effect and shadow -->
  <div
    class="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
  >
    <!-- Teacher information section with avatar -->
    <div class="flex items-center mb-4 cursor-pointer" @click="handleTeacherClick">
      <n-avatar round :src="`/api/download/${teacher.avatar_uuid}`">
        <template #fallback>
          <div
            :class="[
              'w-full h-full flex justify-center items-center text-white text-2xl font-semibold',
              [
                'bg-indigo-500',
                'bg-teal-600',
                'bg-orange-600',
                'bg-pink-600',
                'bg-cyan-600',
              ][teacher.name.charCodeAt(0) % 5],
            ]"
          >
            {{ teacher.name.charAt(0).toUpperCase() }}
          </div>
        </template>
      </n-avatar>
      <div class="ml-4">
        <h3 class="text-lg font-semibold text-blue-600 hover:underline">{{ teacher.name }}</h3>
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
import { useRouter } from 'vue-router'

const router = useRouter()

// Define props with TypeScript type
const { teacher } = defineProps<{
  teacher: TeacherSearchResult
}>()
const emit = defineEmits<{
  (e: 'close'): void
}>()

const handleTeacherClick = async () => {
  router.push(`/review/teacher/${teacher.id}`)
  emit('close')
}
</script>
