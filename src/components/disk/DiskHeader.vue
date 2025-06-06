<template>
  <div v-if="rawHeader"
    v-html="rawHeader"
    class="prose prose-sm max-w-none bg-white rounded-lg shadow p-4 mb-4"
  ></div>
  <DiskBreadcrumb :path="path" />
</template>

<script lang="ts" setup>
import DiskBreadcrumb from './DiskBreadcrumb.vue';

defineProps<{
  rawHeader: string
  path: string
}>()
</script>