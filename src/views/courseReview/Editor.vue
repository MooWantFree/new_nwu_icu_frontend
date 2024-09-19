<template>
  <Editor v-model="content" />
</template>

<script setup lang="ts">
import Editor from '@/components/courseReview/editor/Editor.vue'
import { ref, watch } from 'vue'

const content = ref('')

</script>