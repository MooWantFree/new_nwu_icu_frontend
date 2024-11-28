<template>
  <n-config-provider :locale="zhCN" :date-locale="dateZhCN">
    <n-loading-bar-provider>
      <n-message-provider>
        <n-notification-provider>
          <n-modal-provider>
            <n-dialog-provider>
              <div>
                <div class="flex flex-col min-h-screen">
                  <n-layout>
                    <NavBar />
                    <div class="bg-gray-150">
                      <div class="flex-grow">
                        <RouterView />
                      </div>
                      <div class="text-center py-4">2019-{{ new Date().getFullYear() }} NWU.ICU</div>
                    </div>
                  </n-layout>
                </div>
              </div>
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
</script>
