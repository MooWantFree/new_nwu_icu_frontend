<template>
  <a-layout class="home_layout">
    <a-layout-header style="display: flex">

      <NavBar/>
      <DropMenu/>
    </a-layout-header>
    <br>
    <a-layout-content style="padding: 0 50px">
      <RouterView/>
    </a-layout-content>
    <a-layout-footer class="home_footer">
      2019-{{ currentYear }} NWU.ICU
    </a-layout-footer>
  </a-layout>
</template>

<script lang="ts" setup>

import DropMenu from '@/components/DropMenu.vue';
import NavBar from '@/components/NavBar.vue'

const currentYear = new Date().getFullYear();


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
