<template>
  <component
    :is="as"
    class="min-h-[calc(100vh-7rem-6px)] w-full"
    :class="appearance === 'shadcn' ? 'bg-zinc-50 text-zinc-950' : 'bg-gray-50'"
  >
    <div class="mx-auto w-full px-4 py-8 sm:px-6 sm:py-10 lg:px-8" :class="width === 'reading' ? 'max-w-5xl' : 'max-w-7xl'">
      <header
        v-if="hasHeader"
        class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
        :class="appearance === 'shadcn' ? 'min-h-9 sm:min-h-10' : 'min-h-[4.75rem]'"
      >
        <div class="min-w-0">
          <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 class="text-3xl font-semibold tracking-tight" :class="appearance === 'shadcn' ? 'text-zinc-950 sm:text-4xl' : 'text-gray-900'">
              {{ title }}
            </h1>
            <div
              v-if="$slots.meta"
              class="text-sm"
              :class="appearance === 'shadcn' ? 'text-zinc-500' : 'font-medium text-gray-500'"
            >
              <slot name="meta" />
            </div>
          </div>
          <p
            v-if="description"
              class="mt-2 text-sm sm:text-base"
              :class="appearance === 'shadcn' ? 'text-zinc-500' : 'text-gray-600'"
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
  appearance?: 'default' | 'shadcn'
  width?: 'wide' | 'reading'
}>(), {
  as: 'main',
  title: '',
  description: '',
  showHeader: true,
  appearance: 'default',
  width: 'wide',
})

const slots = useSlots()
const hasHeader = computed(() => props.showHeader && Boolean(
  props.title || props.description || slots.meta || slots.actions,
))
</script>
