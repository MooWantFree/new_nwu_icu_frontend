<template>
  <div class="flex min-h-[calc(100dvh-8rem)] items-center justify-center bg-zinc-50 px-4 py-12 text-zinc-950">
    <div class="w-full max-w-[420px]">
      <RouterLink
        to="/"
        class="mb-5 inline-flex items-center gap-2 rounded-md text-sm text-zinc-500 transition-colors hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
      >
        <ArrowLeft class="h-4 w-4" aria-hidden="true" />
        返回首页
      </RouterLink>
      <section :aria-labelledby="headingId" class="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <header class="px-6 pt-6">
          <div v-if="$slots.icon" class="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-700" aria-hidden="true">
            <slot name="icon" />
          </div>
          <h1 :id="headingId" class="text-xl font-semibold tracking-tight">{{ title }}</h1>
          <p v-if="description" class="mt-2 text-sm leading-6 text-zinc-500">{{ description }}</p>
        </header>
        <div class="px-6 py-6">
          <slot />
        </div>
        <footer v-if="$slots.footer" class="border-t border-zinc-100 px-6 py-4 text-center text-sm text-zinc-500">
          <slot name="footer" />
        </footer>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useId } from 'vue'
import { ArrowLeft } from 'lucide-vue-next'

defineProps<{ title: string; description?: string }>()
const headingId = `email-action-${useId()}`
</script>
