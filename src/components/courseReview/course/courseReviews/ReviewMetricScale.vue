<template>
  <div class="flex min-w-0" :class="readonly ? 'items-center' : 'w-64 max-w-full flex-col gap-1'">
    <div class="flex items-center" :class="readonly ? 'gap-1.5' : 'gap-3'">
      <div
        class="flex"
        :class="readonly ? 'gap-0.5' : 'gap-1'"
        :aria-label="readonly ? `${label}：${selectedLabel}` : label"
        :role="readonly ? 'img' : 'radiogroup'"
        :title="readonly ? `${label}：${selectedLabel}` : undefined"
      >
        <component
          :is="readonly ? 'span' : 'button'"
          v-for="level in levels.length"
          :key="level"
          :type="readonly ? undefined : 'button'"
          :disabled="readonly ? undefined : false"
          :role="readonly ? undefined : 'radio'"
          :aria-label="readonly ? undefined : `${label}：${levels[level - 1]}`"
          :aria-checked="readonly ? undefined : modelValue === level"
          :title="readonly ? undefined : `${label}：${levels[level - 1]}`"
          :class="[
            readonly ? 'h-1.5 w-3 rounded-full' : 'flex h-8 w-8 items-center',
            readonly ? (level <= modelValue ? tone.fill : 'bg-slate-200') : 'group cursor-pointer rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
          ]"
          @click="select(level)"
        >
          <span v-if="!readonly" aria-hidden="true" class="h-2.5 w-full rounded-full transition-opacity group-hover:opacity-70" :class="level <= modelValue ? tone.fill : 'bg-slate-200'" />
        </component>
      </div>
      <span class="whitespace-nowrap font-medium" :class="[tone.text, readonly ? 'text-[11px]' : 'text-sm']">{{ selectedLabel }}</span>
    </div>
    <div v-if="!readonly" aria-hidden="true" class="flex w-44 justify-between text-[11px] leading-4 text-slate-500">
      <span>{{ levels[0] }}</span>
      <span>{{ levels[levels.length - 1] }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: number
  label: string
  levels: readonly string[]
  readonly?: boolean
  preference?: 'lower' | 'higher'
}>(), {
  readonly: false,
})

const selectedLabel = computed(() => props.levels[props.modelValue - 1] || '未评价')
const tone = computed(() => {
  if (!props.levels[props.modelValue - 1]) return { fill: 'bg-slate-200', text: 'text-slate-500' }
  if (!props.preference) return { fill: 'bg-blue-600', text: 'text-slate-600' }
  const favorableLevel = props.preference === 'lower'
    ? props.levels.length + 1 - props.modelValue
    : props.modelValue
  const midpoint = (props.levels.length + 1) / 2
  if (favorableLevel > midpoint) return { fill: 'bg-teal-600', text: 'text-teal-700' }
  if (favorableLevel < midpoint) return { fill: 'bg-amber-500', text: 'text-amber-700' }
  return { fill: 'bg-slate-400', text: 'text-slate-600' }
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const select = (level: number) => {
  if (!props.readonly) emit('update:modelValue', level)
}
</script>
