<template>
  <a-dropdown class="mobile-only">
    <a class="ant-dropdown-link" @click.prevent>
      <div>
        <MenuOutlined/>
        <DownOutlined/>
      </div>

    </a>
    <template #overlay>
      <a-menu>
        <a-menu-item key="review">
          <RouterLink to="/review">课程评价</RouterLink>
        </a-menu-item>
        <a-menu-item key="download">
          <RouterLink to="/download">资源下载</RouterLink>
        </a-menu-item>
        <a-menu-item key="about">
          <RouterLink to="/about">关于</RouterLink>
        </a-menu-item>
        <a-menu-divider/>
        <a-menu-item key="login">
          <RouterLink to="/login">登录</RouterLink>
        </a-menu-item>
      </a-menu>
    </template>
  </a-dropdown>
</template>

<script lang="ts" setup>
import {DownOutlined, MenuOutlined} from '@ant-design/icons-vue';
</script>

<style scoped>
a {
  color: white;
}
.mobile-only {
  display: none;
}
@media (max-width: 768px) {
  .mobile-only {
    display: flex;
    margin-left: auto;
  }
}
</style>
