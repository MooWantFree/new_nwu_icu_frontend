<template>
  <ErrorStatePage
    code="403"
    title="访问被拒绝"
    description="你没有权限访问此页面。请尝试登录后重试。"
    :icon="ShieldAlert"
    :message="message"
  />
</template>

<script lang="ts" setup>
import { ShieldAlert } from 'lucide-vue-next'
import ErrorStatePage from './ErrorStatePage.vue'

withDefaults(defineProps<{
  message?: string
}>(), {
  message: '',
})
</script>
