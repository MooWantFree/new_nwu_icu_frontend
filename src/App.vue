<template>
  <n-config-provider :locale="zhCN" :date-locale="dateZhCN">
    <n-loading-bar-provider>
      <n-message-provider>
        <n-notification-provider>
          <n-modal-provider>
            <n-dialog-provider>
                <div class="all-page">
                  <n-layout>
                    <NavBar/>

                    <div class="content">
                      <RouterView/>
                    </div>
                  </n-layout>
                </div>

                <div class="home_footer">2019-{{ new Date().getFullYear() }} NWU.ICU</div>
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

<style scoped>
.all-page {
  display: flex;
  flex-direction: column;
  min-height: 90vh;
}


.home_footer {
  text-align: center;
  line-height: 10vh;
}
</style>
