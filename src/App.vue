<template>
  <a-layout class="layout">
    <a-layout-header>
      <div class="logo"></div>
      <a-menu
          theme="dark"
          mode="horizontal"
          :selected-keys="[activeMenuItem]"
          :style="{ lineHeight: '64px' }"
      >
        <a-menu-item key="home">
          <RouterLink to="/"><b>NWU.ICU</b></RouterLink>
        </a-menu-item>
        <a-menu-item key="review">
          <RouterLink to="/review">课程评价</RouterLink>
        </a-menu-item>
        <a-menu-item key="download">
          <RouterLink to="/download">资源下载</RouterLink>
        </a-menu-item>

        <a-menu-item key="about">
          <RouterLink to="/about">About</RouterLink>
        </a-menu-item>
        <a-menu-item class="spacer" disabled style="flex-grow: 1;"></a-menu-item>
        <a-menu-item key="login">
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
import {ref, watch} from 'vue';
import {useRoute} from "vue-router";

const currentYear = new Date().getFullYear();
const route = useRoute()
const activeMenuItem = ref('home')
watch(() => route.path,
    pathname => {
      const modules = pathname.split('/')
      activeMenuItem.value = modules[1]
    },
    {immediate: true})
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

.router-link-active {
  //background-color: white;
}
</style>
