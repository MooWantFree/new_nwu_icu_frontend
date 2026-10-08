<template>
  <ShadcnFeedbackProvider>
    <div class="flex min-h-screen flex-col">
      <NavBar v-if="!isManagement" />
      <div class="flex flex-1 flex-col bg-zinc-50 text-zinc-950" :class="isManagement ? 'management-shell' : 'home-shell'">
        <div class="flex-1">
          <RouterView />
        </div>
        <footer v-if="!isManagement && !isMessagePage" class="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 py-5 text-center text-xs text-zinc-500">
          <span>2019-{{ new Date().getFullYear() }} NWU.ICU</span>
          <span aria-hidden="true">·</span>
          <a v-if="frontendCommitUrl" :href="frontendCommitUrl" :title="`前端完整提交：${frontendCommit}`" target="_blank" rel="noopener noreferrer" class="hover:text-gray-700 hover:underline">前端 {{ shortCommit(frontendCommit) }}</a>
          <span v-else :title="`前端完整提交：${frontendCommit}`">前端 {{ shortCommit(frontendCommit) }}</span>
          <span aria-hidden="true">·</span>
          <a v-if="backendCommitUrl" :href="backendCommitUrl" :title="`后端完整提交：${backendCommit}`" target="_blank" rel="noopener noreferrer" class="hover:text-gray-700 hover:underline">后端 {{ shortCommit(backendCommit) }}</a>
          <span v-else :title="`后端完整提交：${backendCommit}`">后端 {{ shortCommit(backendCommit) }}</span>
        </footer>
      </div>
    </div>
    <CaptchaChallenge />
  </ShadcnFeedbackProvider>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'
import ShadcnFeedbackProvider from '@/components/common/ShadcnFeedbackProvider.vue'
import NavBar from '@/components/NavBar.vue'
import CaptchaChallenge from '@/components/common/CaptchaChallenge.vue'

const route = useRoute()
const isMessagePage = computed(() => /^\/message(?:\/|$)/.test(route.path))
const isManagement = computed(() => Boolean(route.meta.isManagement))
const previousTheme = document.documentElement.getAttribute('data-ui-theme')
watch(isManagement, (management) => {
  document.documentElement.setAttribute('data-ui-theme', management ? 'management' : 'shadcn')
}, { immediate: true, flush: 'sync' })
onBeforeUnmount(() => {
  if (previousTheme === null) document.documentElement.removeAttribute('data-ui-theme')
  else document.documentElement.setAttribute('data-ui-theme', previousTheme)
})
const frontendCommit = import.meta.env.VITE_FRONTEND_COMMIT
const backendCommit = import.meta.env.VITE_BACKEND_COMMIT
const commitUrl = (repositoryUrl: string, commit: string) => {
  if (!/^[a-f\d]{7,40}$/i.test(commit)) return ''
  try {
    const url = new URL(repositoryUrl)
    if (url.protocol !== 'https:') return ''
    return `${url.href.replace(/\/$/, '').replace(/\.git$/, '')}/commit/${commit}`
  } catch {
    return ''
  }
}
const frontendCommitUrl = commitUrl(import.meta.env.VITE_FRONTEND_GITHUB_URL, frontendCommit)
const backendCommitUrl = commitUrl(import.meta.env.VITE_BACKEND_GITHUB_URL, backendCommit)
const shortCommit = (commit: string) => commit === 'unknown' ? 'unknown' : commit.slice(0, 8)
</script>

<style scoped>
.home-shell footer a:hover {
  color: #18181b;
}
</style>
