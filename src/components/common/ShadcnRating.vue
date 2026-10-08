<template>
  <span v-if="readonly" class="inline-flex shrink-0 items-center gap-0.5" role="img" :aria-label="`${label} ${rating} / ${starCount}`">
    <span v-for="index in starCount" :key="index" class="relative block" :style="starStyle" aria-hidden="true">
      <Star class="h-full w-full fill-zinc-100 text-zinc-300" :stroke-width="1.5" />
      <span class="absolute inset-y-0 left-0 overflow-hidden" :style="{ width: `${fillPercentage(index)}%` }">
        <Star :class="filledClass" :style="starStyle" :stroke-width="1.5" />
      </span>
    </span>
  </span>
  <div v-else ref="ratingGroup" class="inline-flex shrink-0 items-center gap-1" role="radiogroup" :aria-label="label" :aria-disabled="disabled || undefined" @mouseleave="clearPreview">
    <label v-for="index in starCount" :key="index" :for="`${groupId}-${index}`" class="relative block rounded-md" :class="disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'" :style="targetStyle" @mouseenter="previewRating(index)">
      <input
        :id="`${groupId}-${index}`"
        class="peer sr-only"
        type="radio"
        :name="groupId"
        :value="index"
        :checked="selectedRating === index"
        :disabled="disabled"
        :tabindex="index === (selectedRating || 1) ? 0 : -1"
        :aria-label="`${index} 星`"
        @change="selectRating(index)"
        @focus="previewRating(index)"
        @blur="clearPreview"
        @keydown="handleKeydown($event, index)"
      />
      <span class="flex h-full w-full items-center justify-center rounded-md transition-colors peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-zinc-400 peer-focus-visible:ring-offset-2" :class="disabled ? '' : 'hover:bg-zinc-100'" aria-hidden="true">
        <span class="relative block" :style="starStyle">
          <Star class="h-full w-full fill-zinc-100 text-zinc-300" :stroke-width="1.5" />
          <span class="absolute inset-y-0 left-0 overflow-hidden" :style="{ width: `${fillPercentage(index)}%` }">
            <Star :class="filledClass" :style="starStyle" :stroke-width="1.5" />
          </span>
        </span>
      </span>
    </label>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { Star } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  value?: number
  defaultValue?: number
  size?: number
  count?: number
  readonly?: boolean
  allowHalf?: boolean
  color?: 'default' | 'yellow'
  label?: string
  disabled?: boolean
}>(), { defaultValue: 0, size: 18, count: 5, readonly: true, allowHalf: false, color: 'default', label: '评分', disabled: false })

const emit = defineEmits<{ 'update:value': [value: number] }>()
const groupId = 'rating-' + useId()
const ratingGroup = ref<HTMLElement>()
const internalValue = ref(props.defaultValue)
const preview = ref<number | null>(null)
const starCount = computed(() => Number.isFinite(props.count) ? Math.max(0, Math.floor(props.count)) : 5)
const starStyle = computed(() => ({ width: `${props.size}px`, height: `${props.size}px` }))
const targetStyle = computed(() => ({ width: `${Math.max(40, props.size)}px`, height: `${Math.max(40, props.size)}px` }))
const filledClass = computed(() => props.color === 'yellow' ? 'fill-amber-400 text-amber-500' : 'fill-zinc-950 text-zinc-950')

const rating = computed(() => {
  const value = props.value ?? internalValue.value
  return Number.isFinite(value) ? Math.min(starCount.value, Math.max(0, value)) : 0
})
const selectedRating = computed(() => Math.round(rating.value))
const displayRating = computed(() => !props.readonly && !props.disabled && preview.value !== null ? preview.value : rating.value)
watch(() => props.defaultValue, value => { internalValue.value = value })
watch(() => [props.readonly, props.disabled], () => { preview.value = null })

const fillPercentage = (index: number) => {
  const fill = Math.min(1, Math.max(0, displayRating.value - index + 1))
  return (props.readonly && props.allowHalf ? fill : Math.round(fill)) * 100
}
const clearPreview = () => { preview.value = null }
const previewRating = (value: number) => { if (!props.disabled) preview.value = value }
const selectRating = (value: number) => {
  if (props.disabled || props.readonly) return
  internalValue.value = value
  clearPreview()
  emit('update:value', value)
}
const handleKeydown = (event: KeyboardEvent, index: number) => {
  if (props.disabled || props.readonly || !starCount.value) return
  let next: number
  switch (event.key) {
    case 'ArrowLeft':
    case 'ArrowUp': next = index === 1 ? starCount.value : index - 1; break
    case 'ArrowRight':
    case 'ArrowDown': next = index === starCount.value ? 1 : index + 1; break
    case 'Home': next = 1; break
    case 'End': next = starCount.value; break
    case ' ':
    case 'Enter': next = index; break
    default: return
  }
  event.preventDefault()
  selectRating(next)
  ratingGroup.value?.querySelectorAll<HTMLInputElement>('input[type="radio"]')[next - 1]?.focus()
}
</script>
