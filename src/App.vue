<template>
  <n-loading-bar-provider>
    <n-message-provider>
      <n-notification-provider>
        <n-modal-provider>
          <n-dialog-provider>
            <div class="all-page">
              <div class="nav-bar">
                <Navbar />
              </div>

              <div class="content">
                <RouterView />
              </div>
            </div>

            <div class="home_footer">2019-{{ new Date().getFullYear() }} NWU.ICU</div>
          </n-dialog-provider>
        </n-modal-provider>
      </n-notification-provider>
    </n-message-provider>
  </n-loading-bar-provider>
</template>

<script lang="ts" setup>
import Navbar from "@/components/NavBar.vue";
</script>

<style scoped>
.all-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
}

.content {
  margin-top: 50px; /* 这个值应等于导航栏的高度 */
  flex-grow: 1;
}

.home_footer {
  text-align: center;
  padding: 20px 0;
}
</style>
