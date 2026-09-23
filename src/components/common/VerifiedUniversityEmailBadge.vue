<template>
  <span
    class="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200"
    title="已通过西大邮箱认证"
  >
    <BadgeCheck class="h-3.5 w-3.5" aria-hidden="true" />
    西大邮箱认证
  </span>
</template>

<script setup lang="ts">
import { BadgeCheck } from 'lucide-vue-next'
</script>
