<template>
  <section class="surface-card p-5" aria-label="投稿文件夹黑名单设置">
    <button type="button" class="flex w-full items-center justify-between gap-3 rounded-md text-left font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2" :aria-expanded="expanded" :aria-controls="panelId" @click="expanded = !expanded">
      <span>投稿文件夹黑名单</span>
      <span class="flex shrink-0 items-center gap-2 text-sm font-medium text-zinc-500">{{ expanded ? '收起' : '设置' }}<ChevronDown class="h-4 w-4 transition-transform" :class="{ 'rotate-180': expanded }" aria-hidden="true" /></span>
    </button>
    <p class="mt-2 text-sm leading-6 text-zinc-500">限制用户向指定目录投稿。公开浏览和下载由目录的“访问权限”控制。</p>
    <ResourceUploadBlacklist v-if="expanded" :id="panelId" class="mt-5" @session-expired="emit('session-expired')" />
  </section>
</template>

<script setup lang="ts">
import { ref, useId } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import ResourceUploadBlacklist from '@/components/upload/ResourceUploadBlacklist.vue'

const emit = defineEmits<{ (event: 'session-expired'): void }>()
const expanded = ref(false)
const panelId = `resource-upload-blacklist-${useId()}`
</script>
