<template>
  <n-config-provider :locale="zhCN" :date-locale="dateZhCN" :theme-overrides="themeOverrides">
    <n-loading-bar-provider>
      <n-message-provider>
        <n-notification-provider>
          <n-modal-provider>
            <n-dialog-provider>
              <n-layout class="min-h-screen">
                <div class="flex min-h-screen flex-col">
                  <NavBar />
                  <div class="flex flex-1 flex-col bg-gray-50 text-gray-900">
                    <div class="flex-1">
                      <RouterView />
                    </div>
                    <footer class="py-5 text-center text-xs text-gray-500">
                      2019-{{ new Date().getFullYear() }} NWU.ICU
                    </footer>
                  </div>
                </div>
              </n-layout>
            </n-dialog-provider>
          </n-modal-provider>
        </n-notification-provider>
      </n-message-provider>
    </n-loading-bar-provider>
  </n-config-provider>
</template>

<script lang="ts" setup>
import { zhCN, dateZhCN } from 'naive-ui'
import NavBar from '@/components/NavBar.vue'
import { themeOverrides } from '@/theme'
</script>
