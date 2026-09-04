<template>
  <component
    :is="as"
    class="min-h-[calc(100vh-7rem-6px)] w-full bg-gray-50"
  >
    <div class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <header
        v-if="hasHeader"
        class="mb-8 flex min-h-[4.75rem] flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      >
        <div class="min-w-0">
          <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 class="text-3xl font-semibold tracking-tight text-gray-900">
              {{ title }}
            </h1>
            <div
              v-if="$slots.meta"
              class="text-sm font-medium text-gray-500"
            >
              <slot name="meta" />
            </div>
          </div>
          <p
            v-if="description"
            class="mt-2 text-sm text-gray-600 sm:text-base"
          >
            {{ description }}
          </p>
        </div>

        <div
          v-if="$slots.actions"
          class="flex shrink-0 items-center sm:min-h-9"
        >
          <slot name="actions" />
        </div>
      </header>

      <slot />
    </div>
  </component>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'

const props = withDefaults(defineProps<{
  as?: string
  title?: string
  description?: string
  showHeader?: boolean
}>(), {
  as: 'main',
  title: '',
  description: '',
  showHeader: true,
})

const slots = useSlots()
const hasHeader = computed(() => props.showHeader && Boolean(
  props.title || props.description || slots.meta || slots.actions,
))
</script>
