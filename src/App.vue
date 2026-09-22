<template>
  <n-config-provider :locale="zhCN" :date-locale="dateZhCN" :theme-overrides="themeOverrides">
    <n-loading-bar-provider>
      <n-message-provider>
        <n-notification-provider>
          <n-modal-provider>
            <n-dialog-provider>
              <n-layout class="min-h-screen">
                <div class="flex min-h-screen flex-col">
                  <NavBar v-if="!isManagement" />
                  <div class="flex flex-1 flex-col bg-gray-50 text-gray-900">
                    <div class="flex-1">
                      <RouterView />
                    </div>
                    <footer v-if="!isManagement" class="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 py-5 text-center text-xs text-gray-500">
                      <span>2019-{{ new Date().getFullYear() }} NWU.ICU</span>
                      <span aria-hidden="true">·</span>
                      <span :title="`前端完整提交：${frontendCommit}`">前端 {{ shortCommit(frontendCommit) }}</span>
                      <span aria-hidden="true">·</span>
                      <span :title="`后端完整提交：${backendCommit}`">后端 {{ shortCommit(backendCommit) }}</span>
                    </footer>
                  </div>
                </div>
              </n-layout>
              <CaptchaChallenge />
            </n-dialog-provider>
          </n-modal-provider>
        </n-notification-provider>
      </n-message-provider>
    </n-loading-bar-provider>
  </n-config-provider>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { zhCN, dateZhCN } from 'naive-ui'
import NavBar from '@/components/NavBar.vue'
import CaptchaChallenge from '@/components/common/CaptchaChallenge.vue'
import { themeOverrides } from '@/theme'

const route = useRoute()
const isManagement = computed(() => Boolean(route.meta.isManagement))
const frontendCommit = import.meta.env.VITE_FRONTEND_COMMIT
const backendCommit = import.meta.env.VITE_BACKEND_COMMIT
const shortCommit = (commit: string) => commit === 'unknown' ? 'unknown' : commit.slice(0, 8)
</script>
