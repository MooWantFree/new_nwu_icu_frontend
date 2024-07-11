<template>
  <n-dropdown :options="options">
    <n-button>用户资料</n-button>
  </n-dropdown>
</template>

<script lang="ts">
import type {Component} from 'vue'
import {defineComponent, h} from 'vue'
import {NIcon} from 'naive-ui'
import {LogOutOutline as LogoutIcon, Pencil as EditIcon, PersonCircleOutline as UserIcon} from '@vicons/ionicons5'

const renderIcon = (icon: Component) => {
  return () => {
    return h(NIcon, null, {
      default: () => h(icon)
    })
  }
}

export default defineComponent({
  setup() {
    return {
      options: [
        {
          label: '用户资料',
          key: 'profile',
          icon: renderIcon(UserIcon)
        },
        {
          label: '编辑用户资料',
          key: 'editProfile',
          icon: renderIcon(EditIcon)
        },
        {
          label: '退出登录',
          key: 'logout',
          icon: renderIcon(LogoutIcon)
        }
      ]
    }
  }
})
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
