<a-dropdown class="mobile-only">
<a class="ant-dropdown-link" @click.prevent>
  Hover me
  <DownOutlined/>
</a>
<template #overlay>
  <a-menu>
    <a-menu-item key="0">
      <a target="_blank" rel="noopener noreferrer" href="http://www.alipay.com/">
        1st menu item
      </a>
    </a-menu-item>
    <a-menu-item key="1">
      <a target="_blank" rel="noopener noreferrer" href="http://www.taobao.com/">
        2nd menu item
      </a>
    </a-menu-item>
    <a-menu-divider/>
    <a-menu-item key="3" disabled>3rd menu item（disabled）</a-menu-item>
  </a-menu>
</template>
</a-dropdown>
<script setup lang="ts">
import {DownOutlined} from "@ant-design/icons-vue";
</script>
<style scoped>
.mobile-only {
  display: none;
}

@media (max-width: 768px) {
  .mobile-only {
    display: flex;
    margin-left: 13rem
  }
}
</style>