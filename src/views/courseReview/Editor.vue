<template>
<div class="prose">
  <Milkdown />
</div>
</template>

<script setup lang="ts">
import Milkdown from "@/components/courseReview/editor/Editor.vue";
import "@milkdown/theme-nord/style.css"
</script>

<style scoped>
.milkdown {
  @apply bg-slate-50 px-2 py-4 m-5 border rounded;
}

.editor {
  @apply mx-auto;
}
</style>