<template>
  <ErrorStatePage
    code="500"
    title="服务器内部错误"
    description="服务器暂时遇到了一些问题，请稍后重试。"
    :icon="ServerCrash"
    :message="message"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ServerCrash } from 'lucide-vue-next'
import ErrorStatePage from './ErrorStatePage.vue'

const props = withDefaults(defineProps<{
  message?: string
  detail?: string
}>(), {
  message: '',
  detail: '',
})

const route = useRoute()
const decodeMessage = (value: string) => {
  try {
    return decodeURI(value)
  } catch {
    return value
  }
}
const message = computed(() => {
  if (props.message || props.detail) return props.message || props.detail
  const queryMessage = route.query.message
  const parts = Array.isArray(queryMessage) ? queryMessage : [queryMessage]
  return parts
    .filter((value): value is string => typeof value === 'string')
    .map(decodeMessage)
    .join('\n')
})
</script>
