<template>
  <ShadcnTooltip placement="bottom" trigger="hover">
    <template #trigger>
      <span class="app-time" tabindex="0" :class="{ 'whitespace-nowrap': mode === 'message' }" v-bind="$attrs">
        {{ displayTime }}
      </span>
    </template>
    {{ fullTime }}
  </ShadcnTooltip>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useNow } from '@vueuse/core'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import ShadcnTooltip from '@/components/common/ShadcnTooltip.vue'

dayjs.extend(relativeTime)

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  time: string | Date
  mode?: 'relative' | 'message'
}>()

const parsedTime = computed(() => dayjs(props.time).locale('zh-cn'))
const now = useNow({ interval: 60_000 })
const fullTime = computed(() => parsedTime.value.isValid() ? parsedTime.value.format(props.mode === 'message' ? 'YYYY年M月D日 HH:mm' : 'YYYY-MM-DD HH:mm:ss') : '时间未知')
const displayTime = computed(() => {
  if (!parsedTime.value.isValid()) return '时间未知'
  if (props.mode !== 'message') return parsedTime.value.from(dayjs(now.value))
  return parsedTime.value.format(parsedTime.value.isSame(now.value, 'day') ? '[今天] HH:mm' : 'YYYY年M月D日 HH:mm')
})
</script>

<style scoped>
.app-time {
  color: #71717a;
  cursor: help;
  font-size: 0.75rem;
  line-height: 1rem;
  transition: color 150ms ease;
}

.app-time:hover {
  color: #3f3f46;
}

.app-time:focus-visible {
  border-radius: 2px;
  outline: 2px solid #a1a1aa;
  outline-offset: 2px;
}
</style>
