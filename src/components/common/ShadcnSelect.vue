<template>
  <ComboboxRoot v-if="filterable" :model-value="encodedValue" :disabled="disabled || loading" :open="open" open-on-click @update:open="open = $event" @update:model-value="selectValue">
    <ComboboxAnchor class="relative flex h-10 w-full items-center rounded-md border bg-white shadow-sm" :class="status === 'error' ? 'border-red-300' : 'border-zinc-200'">
      <ComboboxInput v-bind="$attrs" :display-value="displayValue" :placeholder="placeholder" :disabled="disabled || loading"
        class="h-full w-full min-w-0 rounded-md bg-transparent py-2 pl-3 pr-9 text-sm text-zinc-950 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
      <ComboboxTrigger class="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-zinc-500 disabled:opacity-50" aria-label="展开选项">
        <LoaderCircle v-if="loading" class="h-4 w-4 animate-spin" aria-hidden="true" /><ChevronDown v-else class="h-4 w-4" aria-hidden="true" />
      </ComboboxTrigger>
    </ComboboxAnchor>
    <ComboboxPortal>
      <ComboboxContent position="popper" :side-offset="4" :collision-padding="8" class="z-[200] max-h-[min(18rem,var(--reka-combobox-content-available-height))] w-[var(--reka-combobox-trigger-width)] min-w-40 overflow-hidden rounded-md border border-zinc-200 bg-white p-1 text-zinc-950 shadow-md" data-shadcn-select-menu>
        <ComboboxViewport class="max-h-[inherit] overflow-y-auto overscroll-contain">
          <ComboboxEmpty class="px-3 py-6 text-center text-sm text-zinc-500">没有匹配的选项</ComboboxEmpty>
          <ComboboxItem v-for="option in options" :key="String(optionValue(option))" :value="optionValue(option)" :text-value="optionLabel(option)" :disabled="optionDisabled(option)" class="relative flex min-h-9 cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none data-[highlighted]:bg-zinc-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
            <ComboboxItemIndicator class="absolute left-2"><Check class="h-4 w-4" aria-hidden="true" /></ComboboxItemIndicator>
            {{ optionLabel(option) }}
          </ComboboxItem>
        </ComboboxViewport>
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
  <SelectRoot v-else :model-value="encodedValue" :disabled="disabled || loading" @update:model-value="selectValue">
    <SelectTrigger v-bind="$attrs" class="flex h-10 w-full items-center justify-between gap-2 rounded-md border bg-white px-3 py-2 text-sm text-zinc-950 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[placeholder]:text-zinc-400" :class="status === 'error' ? 'border-red-300' : 'border-zinc-200'">
      <SelectValue :placeholder="placeholder" />
      <LoaderCircle v-if="loading" class="h-4 w-4 shrink-0 animate-spin text-zinc-500" aria-hidden="true" /><ChevronDown v-else class="h-4 w-4 shrink-0 text-zinc-500" aria-hidden="true" />
    </SelectTrigger>
    <SelectPortal>
      <SelectContent position="popper" :side-offset="4" :collision-padding="8" class="z-[200] max-h-[min(18rem,var(--reka-select-content-available-height))] min-w-[var(--reka-select-trigger-width)] overflow-hidden rounded-md border border-zinc-200 bg-white p-1 text-zinc-950 shadow-md" data-shadcn-select-menu>
        <SelectViewport class="max-h-[inherit] overflow-y-auto overscroll-contain">
          <SelectItem v-for="option in options" :key="String(optionValue(option))" :value="optionValue(option)" :disabled="optionDisabled(option)" class="relative flex min-h-9 cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none data-[highlighted]:bg-zinc-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
            <SelectItemIndicator class="absolute left-2"><Check class="h-4 w-4" aria-hidden="true" /></SelectItemIndicator>
            <SelectItemText>{{ optionLabel(option) }}</SelectItemText>
          </SelectItem>
          <p v-if="!options.length" class="px-3 py-6 text-center text-sm text-zinc-500">暂无选项</p>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Check, ChevronDown, LoaderCircle } from 'lucide-vue-next'
import { ComboboxAnchor, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxItemIndicator, ComboboxPortal, ComboboxRoot, ComboboxTrigger, ComboboxViewport, SelectContent, SelectItem, SelectItemIndicator, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from 'reka-ui'

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{
  value?: string | number | null
  options: readonly object[]
  labelField?: string
  valueField?: string
  filterable?: boolean
  disabled?: boolean
  loading?: boolean
  status?: 'error' | 'warning' | 'success'
  placeholder?: string
}>(), { labelField: 'label', valueField: 'value', filterable: false, disabled: false, loading: false, placeholder: '请选择' })
const emit = defineEmits<{ (event: 'update:value', value: string | number | null): void }>()
const open = ref(false)
const field = (option: object, key: string) => (option as Record<string, unknown>)[key]
// Reka reserves an empty string for clearing. Encode all values to preserve empty-string
// options such as “全部学院”, and distinguish numeric IDs from string values.
const encodeValue = (value: unknown) => JSON.stringify([typeof value, value])
const encodedValue = computed(() => props.value == null ? undefined : encodeValue(props.value))
const optionValue = (option: object) => encodeValue(field(option, props.valueField))
const optionLabel = (option: object) => String(field(option, props.labelField) ?? '')
const optionDisabled = (option: object) => Boolean(field(option, 'disabled'))
const displayValue = (value: unknown) => {
  const selected = props.options.find(option => optionValue(option) === value)
  return selected ? optionLabel(selected) : ''
}
const selectValue = (value: unknown) => {
  if (typeof value !== 'string') return
  const [, decoded] = JSON.parse(value) as [string, unknown]
  if (typeof decoded === 'string' || typeof decoded === 'number') emit('update:value', decoded)
}
</script>
