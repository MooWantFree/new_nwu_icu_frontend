<template>
  <n-tooltip placement="bottom" trigger="hover">
    <template #trigger>
      <span class="app-time" v-bind="$attrs">
        <n-time :time="parsedTime" type="relative" />
      </span>
    </template>
    <n-time :time="parsedTime" format="yyyy-MM-dd hh:mm:ss" />
  </n-tooltip>
</template>

<script lang="ts" setup>
import { NTime } from 'naive-ui'
import { computed } from 'vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  time: string | Date
}>()

const parsedTime = computed(() => new Date(props.time))
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
