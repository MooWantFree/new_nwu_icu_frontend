<template>
  <n-tooltip placement="bottom" trigger="hover">
    <template #trigger>
      <span class="app-time" :class="{ 'whitespace-nowrap': mode === 'message' }" v-bind="$attrs">
        <n-time v-if="mode === 'message'" :time="parsedTime" :format="messageFormat" />
        <n-time v-else :time="parsedTime" type="relative" />
      </span>
    </template>
    <n-time :time="parsedTime" :format="mode === 'message' ? 'yyyy年M月d日 HH:mm' : 'yyyy-MM-dd hh:mm:ss'" />
  </n-tooltip>
</template>

<script lang="ts" setup>
import { NTime } from 'naive-ui'
import { computed, watch } from 'vue'
import { useNow } from '@vueuse/core'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  time: string | Date
  mode?: 'relative' | 'message'
}>()

const parsedTime = computed(() => new Date(props.time))
const { now, pause, resume } = useNow({ controls: true, interval: 60_000 })
watch(() => props.mode, mode => {
  if (mode === 'message') resume()
  else pause()
}, { immediate: true })
const messageFormat = computed(() => parsedTime.value.toDateString() === now.value.toDateString()
  ? '今天 HH:mm'
  : 'yyyy年M月d日 HH:mm')
</script>

<style scoped>
.app-time {
  color: #64748b;
  cursor: help;
  font-size: 0.75rem;
  line-height: 1rem;
  transition: color 150ms ease;
}

.app-time:hover {
  color: #334155;
}
</style>
