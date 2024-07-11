<script setup>
import {ref, watch} from "vue";
import {useRoute} from "vue-router";

const route = useRoute();
const activeMenuItem = ref('home');

watch(
    () => route.path,
    (pathname) => {
      const modules = pathname.split('/');
      activeMenuItem.value = modules[1] || 'home';
    },
    {immediate: true}
);
</script>

<template>
  <a-menu
      :selected-keys="[activeMenuItem]"
      :style="{ lineHeight: '64px' }"
      class="desktop-only"
      disabledOverflow="false"
      mode="horizontal"
      theme="dark"
  >
    <a-menu-item key="review">
      <RouterLink to="/review">课程评价</RouterLink>
    </a-menu-item>
    <a-menu-item key="download">
      <RouterLink to="/download">资源下载</RouterLink>
    </a-menu-item>
    <a-menu-item key="about">
      <RouterLink to="/about">关于</RouterLink>
    </a-menu-item>
  </a-menu>
  <a-menu
      :selected-keys="[activeMenuItem]"
      :style="{ lineHeight: '64px' }"
      class="desktop-only"
      disabledOverflow="false"
      mode="horizontal"
      style="margin-left: auto"
      theme="dark">
    <a-menu-item key="login">
      <RouterLink to="/login">登录</RouterLink>
    </a-menu-item>
  </a-menu>
</template>

<style scoped>
a {

  color: #000000;
  text-decoration: none;
}

.desktop-only {
  display: flex;
}

@media (max-width: 768px) {
  .desktop-only {
    display: none;
  }
}
</style>