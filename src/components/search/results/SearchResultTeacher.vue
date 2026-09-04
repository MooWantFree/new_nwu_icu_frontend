<template>
  <!-- Teacher card with hover effect and shadow -->
  <div
    class="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
  >
    <div class="cursor-pointer" @click="handleTeacherClick">
      <div>
        <h3 class="text-lg font-semibold text-blue-700 hover:underline">
          <SearchHighlight :text="teacher.name" :highlight-ranges="teacher.name_highlight_ranges" />
        </h3>
        <p class="text-sm text-gray-600">{{ teacher.school }}</p>
      </div>
    </div>

    <!-- Additional information can be added here -->
    <!-- <div class="text-sm text-gray-600">
      <p class="mb-1">教师ID: {{ teacher.id }}</p>
    </div> -->
  </div>
</template>

<script setup lang="ts">
// Import the TeacherSearchResult type for type checking
import { TeacherSearchResult } from '@/types/api/search/search'
import { useRouter } from 'vue-router'
import SearchHighlight from '@/components/tinyComponents/SearchHighlight.vue'

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
