<template>
  <div class="flex min-w-0 items-center" :class="readonly ? 'gap-1.5' : 'gap-2'">
    <div
      class="flex"
      :class="readonly ? 'gap-0.5' : 'gap-1'"
      :aria-label="label"
      :role="readonly ? undefined : 'radiogroup'"
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
        :class="[
          readonly ? 'h-1.5 w-3' : 'h-3 w-8',
          'rounded-full transition-colors',
          level <= modelValue ? 'bg-blue-600' : 'bg-slate-200',
          readonly ? '' : 'cursor-pointer hover:bg-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
        ]"
        @click="select(level)"
      />
    </div>
    <span class="whitespace-nowrap text-slate-500" :class="readonly ? 'text-[11px]' : 'text-sm'">{{ levels[modelValue - 1] || '未评价' }}</span>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: number
  label: string
  levels: readonly string[]
  readonly?: boolean
}>(), {
  readonly: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const select = (level: number) => {
  if (!props.readonly) emit('update:modelValue', level)
}
</script>
