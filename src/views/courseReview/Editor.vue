<template>
  <div class="bg-gray-100 shadow-md rounded-lg p-6 m-4 border border-gray-400">
    <Editor v-model="content" />
  </div>
</template>

<script setup lang="ts">
import Editor from '@/components/courseReview/editor/Editor.vue'
import { ref } from 'vue'

const content = ref('')
</script>