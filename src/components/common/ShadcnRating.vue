<template>
  <span class="inline-flex shrink-0 items-center gap-0.5" role="img" :aria-label="`评分 ${rating} / ${count}`">
    <span v-for="index in count" :key="index" class="relative block" :style="{ width: `${size}px`, height: `${size}px` }" aria-hidden="true">
      <Star class="h-full w-full fill-zinc-100 text-zinc-300" :stroke-width="1.5" />
      <span class="absolute inset-y-0 left-0 overflow-hidden" :style="{ width: `${fillPercentage(index)}%` }">
        <Star class="fill-zinc-950 text-zinc-950" :style="{ width: `${size}px`, height: `${size}px` }" :stroke-width="1.5" />
      </span>
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Star } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  value?: number
  defaultValue?: number
  size?: number
  count?: number
  readonly?: boolean
  allowHalf?: boolean
}>(), { defaultValue: 0, size: 18, count: 5, readonly: true, allowHalf: false })

const rating = computed(() => {
  const value = props.value ?? props.defaultValue
  return Number.isFinite(value) ? Math.min(props.count, Math.max(0, value)) : 0
})
const fillPercentage = (index: number) => {
  const fill = Math.min(1, Math.max(0, rating.value - index + 1))
  return (props.allowHalf ? fill : Math.round(fill)) * 100
}
</script>
