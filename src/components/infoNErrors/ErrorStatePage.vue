<template>
  <section class="w-full bg-zinc-50 px-4 py-12 text-zinc-950 sm:px-6 sm:py-16">
    <div class="mx-auto w-full max-w-lg rounded-xl border border-zinc-200 bg-white px-5 py-8 text-center shadow-sm sm:px-8 sm:py-10">
      <div class="mx-auto flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-500">
        <component :is="icon" class="h-5 w-5" aria-hidden="true" />
      </div>
      <p class="mt-6 text-5xl font-semibold tracking-tight text-zinc-950 sm:text-6xl">{{ code }}</p>
      <h1 class="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">{{ title }}</h1>
      <p class="mx-auto mt-3 max-w-sm whitespace-pre-line text-sm leading-6 text-zinc-500">{{ description }}</p>
      <div v-if="message" class="mt-5 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-left" role="alert">
        <p class="whitespace-pre-line break-words text-sm leading-6 text-zinc-600">{{ message }}</p>
      </div>
      <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
        <slot name="actions">
          <RouterLink
            to="/"
            class="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
          >
            <House class="h-4 w-4" aria-hidden="true" />
            返回主页
          </RouterLink>
        </slot>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { RouterLink } from 'vue-router'
import { House } from 'lucide-vue-next'

withDefaults(defineProps<{
  code: string
  title: string
  description: string
  icon: Component
  message?: string
}>(), {
  message: '',
})
</script>
