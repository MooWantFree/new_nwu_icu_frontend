<template>
  <n-layout-header bordered class="nav" :style="style">
    <n-text tag="div" class="ui-logo" :depth="1" @click="handleLogoClick">
      <img alt="logo image" src="@/assets/logo.svg"/>
      <n-button v-if="!isMobile" color="#000000" dashed>NWU.ICU</n-button>
    </n-text>
    <div
        :style="
        !isMobile ? 'display: flex; align-items: center; overflow: hidden;' : ''
        "
    >
      <div v-if="!isMobile" class="nav-menu">
        <!--        PC NaviBars: left-->
        <div class="nav-bar-pc-left">
          <n-menu
              :value="activeKey"
              mode="horizontal"
              :options="menuOptions.leftItems"
              :render-label="renderMenuLabel"
          />
        </div>
        <div class="nav-bar-pc-right">
          <router-link
              to="/login"
          >
            <n-button
                type="info"
            >
              Login
            </n-button>
          </router-link>
          <!--          TODO: Login Button-->
        </div>
      </div>
      <div v-else>
        <n-popover
            :ref="mobilePopoverRef"
            style="padding: 0; width: 288px"
            placement="bottom-end"
            display-directive="show"
            trigger="click"
        >
          <template #trigger>
            <n-icon size="20" style="margin-left: 20px">
              <MenuOutline/>
            </n-icon>
          </template>
          <div style="overflow: auto; max-height: 79vh">
<!--            Mobile Menu-->
            <n-menu
              :value="activeKey"
              :options="menuOptions.leftItems"
              :indent="18"
              :render-label="renderMenuLabel"
              accordion
              />
          </div>
        </n-popover>
      </div>
    </div>
  </n-layout-header>
</template>

<script lang="ts" setup>
import {Component, computed, h, onMounted, onUnmounted, ref, watch} from "vue";
import {MenuOption, NA, NIcon, NPopconfirm, useMessage} from "naive-ui";
import {RouterLink, useRoute, useRouter} from "vue-router";
import {CloudDownload, Home, InformationCircleOutline, MenuOutline, Pencil} from "@vicons/ionicons5";

const route = useRoute()
const router = useRouter()
const message = useMessage()
const activeKey = ref<string | null>(null)

// Update Window width on update
const pageWidth = ref(window.innerWidth)
const onPageWidthUpdate = () => {
  pageWidth.value = window.innerWidth
}
const isMobile = computed(() => pageWidth.value <= 800)
onMounted(() => {
  window.addEventListener('resize', onPageWidthUpdate)
  console.log('added')
})
onUnmounted(() => {
  window.removeEventListener('resize', onPageWidthUpdate)
  console.log('removed')
})

// Menus
const handleLogoClick = () => {
  if (route.path === '/') {
    message.info("已经在主页了")
    return
  }
  router.push('/')
}

const renderIcon = (icon: Component) => {
  return () => h(NIcon, null, {default: () => h(icon)})
}

const renderMenuLabel = (option: MenuOption) => {
  if (option.path) {
    return h(
        RouterLink,
        {
          to: option.path
        },
        {default: () => option.text}
    )
  } else if (option.href) {
    return h(
        NA,
        {
          href: 'https://resour.nwu.icu',
          target: '_blank',
        },
        {default: option.text}
    )
  } else {
    return h(
        'span',
        option.text
    )
  }

}

// Mobile Menu
const mobilePopoverRef = ref<HTMLElement | null>(null)

const menuOptions = computed(() => {
  return {
    leftItems: [
      // {
      //   key: 'home',
      //   text: '主页',
      //   icon: renderIcon(Home),
      //   path: '/',
      // },
      {
        key: 'courseReview',
        text: '课程评价',
        icon: renderIcon(Pencil),
        children: [
          {
            key: 'reviewTimeline',
            text: '主页',
            path: '/review'
          },
          {
            key: 'reviewCourse',
            text: '课程',
            path: '/review/course',
          },
          {
            key: 'reviewTeacher',
            text: '教师',
            path: '/review/teacher',
          },
        ],
      },
      {
        key: 'resourceDownload',
        text: '资料下载',
        icon: renderIcon(CloudDownload),
        href: 'https://resour.nwu.icu',
      },
      {
        key: 'about',
        text: '关于',
        icon: renderIcon(InformationCircleOutline),
        path: '/about',
      },
    ],
    rightItems: [
      {
        key: 'login',
        text: '登录',
        path: '/login',
      }, // TODO: 登录以后怎么办呢
    ]
  }
})


const style = computed(() => {
  return isMobile.value
      ? {
        '--side-padding': '16px',
        'grid-template-columns': 'auto 1fr auto'
      }
      : {
        '--side-padding': '32px',
        'grid-template-columns':
            'calc(272px - var(--side-padding)) 1fr auto'
      }
})
</script>

<style scoped>
.nav {
  display: grid;
  grid-template-rows: calc(var(--header-height) - 1px);
  align-items: center;
  padding: 0 var(--side-padding);
}

.ui-logo {
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 18px;
}

.ui-logo > img {
  margin-right: 12px;
  height: 32px;
  width: 32px;
}

.nav-menu {
  padding-left: 36px;
  overflow: hidden;
  flex-grow: 0;
  flex-shrink: 1;
}

.nav-picker {
  margin-right: 4px;
}

.nav-picker.padded {
  padding: 0 10px;
}

.nav-picker:last-child {
  margin-right: 0;
}

.nav-end {
  display: flex;
  align-items: center;
}
</style>

<style>
.nav-menu .n-menu-item,
.nav-menu .n-submenu,
.nav-menu .n-menu-item-content {
  height: calc(var(--header-height) - 1px) !important;
}
</style>
