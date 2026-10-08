<template>
  <ErrorStatePage
    code="404"
    title="哎呀！页面不见了"
    description="这个页面可能已被移除，或链接地址有误。"
    :icon="FileQuestion"
  >
    <template #actions>
      <button
        type="button"
        class="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
        @click="goBack"
      >
        <ArrowLeft class="h-4 w-4" aria-hidden="true" />
        上一页
      </button>
      <button
        type="button"
        class="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
        @click="goHome"
      >
        <House class="h-4 w-4" aria-hidden="true" />
        回到主页
      </button>
    </template>
  </ErrorStatePage>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ArrowLeft, FileQuestion, House } from 'lucide-vue-next'
import ErrorStatePage from './ErrorStatePage.vue'

const router = useRouter()

const goHome = () => {
  router.push('/')
}

const goBack = () => {
  router.go(-1)
}
</script>
