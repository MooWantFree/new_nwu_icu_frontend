<template>
  <n-loading-bar-provider>
    <n-message-provider>
      <n-notification-provider>
        <n-modal-provider>
          <n-dialog-provider>

            <div>
              <Navbar/>
              <br>
              <RouterView/>
              <div class="home_footer">2019-{{ new Date().getFullYear() }} NWU.ICU</div>
            </div>

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

.home_layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.home_footer {
  text-align: center;
}

</style>
