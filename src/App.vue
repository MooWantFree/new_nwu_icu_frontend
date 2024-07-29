<template>
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
</template>

<script lang="ts" setup>
import NavBar from "@/components/NavBar.vue";
</script>

<style scoped>
.all-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.content {
  margin-top: 65px; /* 这个值应等于导航栏的高度 */
  flex-grow: 1;
}

.home_footer {
  text-align: center;
  padding: 20px 0;
}
</style>
