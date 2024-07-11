<template>
  <a-layout class="layout">
    <a-layout-header>
      <div class="logo"></div>
      <a-menu
          v-model:selectedKeys="selectedKeys"
          theme="dark"
          mode="horizontal"
          :style="{ lineHeight: '64px' }"
      >
        <a-menu-item key="0" title="a">
          <RouterLink to="/"><b>NWU.ICU</b></RouterLink>
        </a-menu-item>
        <a-menu-item key="1" title="b">
          <RouterLink to="/review">课程评价</RouterLink>
        </a-menu-item>
        <a-menu-item key="2" title="c">
          <RouterLink to="/download">资源下载</RouterLink>
        </a-menu-item>

        <a-menu-item key="3">
          <RouterLink to="/about">About</RouterLink>
        </a-menu-item>
        <a-menu-item class="spacer" disabled style="flex-grow: 1;"></a-menu-item>
        <a-menu-item key="4">
          <RouterLink to="/login">Login</RouterLink>
        </a-menu-item>
      </a-menu>
    </a-layout-header>
    <br>
    <a-layout-content style="padding: 0 50px">
      <RouterView/>
    </a-layout-content>

    <a-layout-footer class="footer">
      2019-{{ currentYear }} NWU.ICU
    </a-layout-footer>
  </a-layout>
</template>

<script lang="ts" setup>
import {ref} from 'vue';

const currentYear = new Date().getFullYear();
const selectedKeys = ref<string[]>(['0']);
</script>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}


.footer {
  text-align: center;
}


.spacer {
  display: none !important;
}

</style>
