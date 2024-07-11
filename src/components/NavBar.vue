<template>
  <n-menu class="navbar" mode="horizontal" :options="menuOptions" @update:value="handleUpdateValue"/>
</template>

<script lang="ts">
import {Component, defineComponent, h, ref} from 'vue'
import type {MenuOption} from 'naive-ui'
import {NIcon, useMessage} from 'naive-ui'
import {RouterLink} from 'vue-router'
import {
  BookOutline as BookIcon,
  CloudDownloadOutline as download,
  HomeOutline as HomeIcon,
  InformationCircleOutline as About,
  Menu as Menu,
} from '@vicons/ionicons5'

function renderIcon(icon: Component) {
  return () => h(NIcon, null, {default: () => h(icon)})
}

const accordionRef = ref(false)
const desktopOptions: MenuOption[] = [
  {
    label: () =>
        h(
            RouterLink,
            {
              to: {
                name: 'home'
              }
            },
            {default: () => '主页'}
        ),
    key: 'go-back-home',
    icon: renderIcon(HomeIcon)
  },
  {
    key: 'divider-1',
    type: 'divider',
    props: {
      style: {
        marginLeft: '32px'
      }
    }
  },
  {
    label: () =>
        h(
            RouterLink,
            {
              to: {
                name: 'about'
              }
            },
            {default: () => '关于'}
        ),
    key: 'about',
    icon: renderIcon(About)
  },
  {
    label: '课程评价',
    key: 'courseReview',
    icon: renderIcon(BookIcon),
    disabled: false,
    children: [
      {
        label: () =>
            h(
                RouterLink,
                {
                  to: {
                    name: 'review'
                  }
                },
                {default: () => '课程评价'}
            ),
        key: 'review',
        icon: renderIcon(About)
      },
    ]
  },
  {
    label: () =>
        h(
            'a',
            {
              href: 'https://resour.nwu.icu',
              target: '_blank',
            },
            '资料下载'
        ),
    key: 'hear-the-wind-sing',
    icon: renderIcon(download)
  },
]
const updatedDesktopOptions = desktopOptions.map(option => {
  return {
    ...option,
    show: !accordionRef.value, // 这里添加新的属性
  }
})
const menuOptions: MenuOption[] = [
  ...updatedDesktopOptions,
  {
    show: accordionRef.value,
    key: 'resources',
    icon: renderIcon(Menu),
    children: [...desktopOptions]
  },
]

export default defineComponent({
  setup() {
    const message = useMessage()
    return {
      menuOptions,
      handleUpdateValue(key: string, item: MenuOption) {
      }
    }
  }
})
</script>
<style>
.navbar {
  width: 100%;
  height: 50px; 
  background-color: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  position: fixed; 
  top: 0;
  left: 0;
  display: flex; 
  align-items: center; 
  justify-content: center; 
  padding: 0 10px; 
  z-index: 1000; 
}

@media (max-width: 768px) {
  .navbar {
    height: 50px; 
    background-color: white;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }
}


</style>