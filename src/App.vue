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
        <a-menu-item key="0">
          <RouterLink to="/">NWU.ICU</RouterLink>
        </a-menu-item>
        <a-menu-item key="1">
          <RouterLink to="/review">课程评价</RouterLink>
        </a-menu-item>
        <a-menu-item key="2">
          <RouterLink to="/download">资源下载</RouterLink>
        </a-menu-item>
        <a-menu-item key="3">
          <RouterLink to="/about">About</RouterLink>
        </a-menu-item>
      </a-menu>
    </a-layout-header>

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
const selectedKeys = ref<string[]>(['2']);
</script>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.content {
  flex: 1;
  padding: 0 50px;
}

.footer {
  text-align: center;
}

.site-layout-content {
  min-height: 280px;
  padding: 24px;
  background: #fff;
}

#components-layout-demo-top .logo {
  float: left;
  width: 120px;
  height: 31px;
  margin: 16px 24px 16px 0;
  background: rgba(255, 255, 255, 0.3);
}

.ant-row-rtl #components-layout-demo-top .logo {
  float: right;
  margin: 16px 0 16px 24px;
}

[data-theme='dark'] .site-layout-content {
  background: #141414;
}
</style>
