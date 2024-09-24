<template>
  <n-layout-header bordered class="nav" :style="style" style="display: flex; justify-content: space-around">
    <div :style="!isMobile ? 'overflow: hidden; width: 95%; display: flex; justify-content: space-between; align-items: center'
        : 'display: flex; justify-content: space-between; align-items: center; width: 90%; margin-top: 0.5rem'
      ">
      <template v-if="!isMobile" style="display: flex; align-items: center">
        <n-text tag="div" class="ui-logo" :depth="1" @click="handleLogoClick">
          <img alt="logo image" src="@/assets/logo.svg" />
          <n-button color="#000000" dashed>NWU.ICU</n-button>
        </n-text>
        <!--        PC NaviBars: left-->
        <div class="nav-bar-pc-left" style="margin-left: auto">
          <n-menu :value="activeKey" mode="horizontal" :options="menuOptions" :render-label="renderMenuLabel" />
        </div>
        <div class="nav-bar-pc-right" style="margin-left: auto">
          <template v-if="!isLoggedIn">
            <n-button :disabled="isLoading" type="info" @click="showLoginPopup = true">
              登录/注册
            </n-button>
          </template>
          <template v-else>
            <n-dropdown :options="userAvatarDropdownOptions" :render-label="renderMenuLabel" trigger="hover">
              <template v-if="userInfo === null">
                <n-avatar round :style="{
                  color: 'yellow',
                  backgroundColor: 'red',
                }">
                  M
                </n-avatar>
              </template>
              <template v-else>
                <n-avatar round :src="`/api/download/${userInfo.avatar}`">
                  <template #fallback>
                    <img src="https://www.loliapi.com/acg/pp/" />
                    <!-- TODO: Change it -->
                  </template>
                </n-avatar>
              </template>
            </n-dropdown>
          </template>
        </div>
        <n-modal v-model:show="showLoginPopup" preset="card" :mask-closable="false" title="登录/注册" style="width: 600px"
          :bordered="false" size="huge" aria-modal="true">
          <Login :on-login-success="handleLoginSuccess" @close-modal="showLoginPopup = false" />
        </n-modal>
      </template>
      <template v-else>
        <n-text tag="div" class="ui-logo" :depth="1" @click="handleLogoClick">
          <img alt="logo image" src="@/assets/logo.svg" />
          <n-button color="#000000" dashed>NWU.ICU</n-button>
        </n-text>
        <n-popover ref="mobilePopoverRef" style="padding: 0; width: 288px" placement="bottom-end"
          display-directive="show" trigger="click">
          <template #trigger>
            <n-icon size="20" style="margin-left: 20px">
              <MenuOutline />
            </n-icon>
          </template>
          <template #header>
            <n-menu :value="activeKey" :options="mobileMenuHomeButton" :indent="18" :render-label="renderMenuLabel"
              @update:value="handleUpdateMobileMenu" accordion />
          </template>
          <div style="overflow: auto; max-height: 79vh">
            <!--            Mobile Menu-->
            <n-menu :value="activeKey" :options="menuOptions" :indent="18" :render-label="renderMenuLabel"
              @update:value="handleUpdateMobileMenu" accordion />
          </div>
          <template #footer>
            <n-menu :value="activeKey" :options="mobileMenuUserAreaButtons" :indent="18" :render-label="renderMenuLabel"
              @update:value="handleUpdateMobileMenu" accordion />
          </template>
        </n-popover>
      </template>
    </div>
  </n-layout-header>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { NIcon, NModal, useDialog, useMessage } from "naive-ui";
import { useRoute, useRouter } from "vue-router";
import {
  CloudDownload,
  Home,
  InformationCircleOutline,
  LogIn,
  LogOut,
  MenuOutline,
  OpenOutline,
  Pencil,
  Person,
} from "@vicons/ionicons5";
import Login from "@/components/LoginForm.vue";
import { renderIcon, renderMenuLabel } from "@/lib/h";
import { useUser } from "@/lib/useUser";
import { UserProfile } from "@/types/userProfile";

const route = useRoute()
const router = useRouter()
const message = useMessage()
const activeKey = ref<string | null>(null)
// TODO: activeKey: init it on page loaded

const { isLoggedIn, login, logout, userInfo, isLoading } = useUser()

// Login popup in PC
const showLoginPopup = ref(false)
const handleLoginSuccess = (data: UserProfile) => {
  login(data)
  const displayName = data?.nickname ?? data?.username ?? ""
  message.success(`欢迎${displayName}，已成功登录，页面即将刷新`)
  showLoginPopup.value = false
}
const handleLogoutButtonClick = () => {
  const d = dialog.create({
    icon: renderIcon(LogOut),
    title: "退出登录",
    content: "确定要退出登录吗",
    positiveText: "确定",
    negativeText: "算了",
    onPositiveClick(e) {
      e.preventDefault()
      d.loading = true
      return handleLogout()
    },
  })
}
const userAvatarDropdownOptions = [
  {
    label: '用户资料',
    key: 'profile',
    icon: renderIcon(Person),
    path: '/user/profile',
  },
  {
    label: '编辑用户资料',
    key: 'editProfile',
    icon: renderIcon(Pencil),
    path: '/user/profile/edit',
  },
  {
    label: '退出登录',
    key: 'logout',
    icon: renderIcon(LogOut),
    onclick: () => {
      handleLogoutButtonClick()
    }
  }
]
const handleLogout = async () => {
  const resp = await fetch("/api/user/logout/", {
    method: "POST",
  })
  await resp.json()
  logout()
  message.success("成功退出登录，欢迎您下次再来")
}

// Update Window width on update
const pageWidth = ref(window.innerWidth)
const onPageWidthUpdate = () => {
  pageWidth.value = window.innerWidth
}
const isMobile = computed(() => pageWidth.value <= 800)
onMounted(() => {
  window.addEventListener('resize', onPageWidthUpdate)
})
onUnmounted(() => {
  window.removeEventListener('resize', onPageWidthUpdate)
})

// Menus
const handleLogoClick = () => {
  if (route.path === '/') {
    message.info("您已经在主页了")
    return
  }
  router.push('/')
}

const handleUpdateMobileMenu = () => {
  mobilePopoverRef.value.setShow(false)
}

// Mobile Menu
const mobilePopoverRef = ref(null)

// Dialog for outer href
const dialog = useDialog()

// Menu Options
const menuOptions = [
  {
    key: 'courseReview',
    text: '课程评价',
    icon: renderIcon(Pencil),
    children: [
      {
        key: 'reviewTimeline',
        text: '主页',
        path: '/review/timeline'
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
    onclick: () => {
      dialog.create({
        icon: renderIcon(OpenOutline),
        title: "打开外部链接",
        content: "在新的标签页打开资料下载页面（虽然也是我们的）",
        positiveText: "打开",
        negativeText: "算了",
        onPositiveClick(e) {
          window.open('https://resour.nwu.icu', "_blank")
        },
      })
    }
  },
  {
    key: 'about',
    text: '关于',
    icon: renderIcon(InformationCircleOutline),
    path: '/about',
  },
]

const mobileMenuHomeButton = [{
  key: 'home',
  text: '主页',
  icon: renderIcon(Home),
  path: '/',
}]

const mobileMenuLoginButton = [{
  key: 'login',
  text: '登录/注册',
  path: '/login',
  icon: renderIcon(LogIn),
}]

const mobileMenuUserButtons = [
  {
    key: 'profile',
    text: '用户资料',
    icon: renderIcon(Person),
    path: '/user/profile',
  },
  {
    key: 'logout',
    text: '退出登录',
    icon: renderIcon(LogOut),
    onclick: handleLogoutButtonClick,
  }
]

const mobileMenuUserAreaButtons = computed(() => {
  return isLoggedIn.value ? mobileMenuUserButtons : mobileMenuLoginButton
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
/* .nav {
  display: grid;
  grid-template-rows: calc(var(--header-height) - 1px);
  align-items: center;
  padding: 0 var(--side-padding);
} */

.ui-logo {
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 18px;
}

.ui-logo>img {
  margin-right: 12px;
  height: 32px;
  width: 32px;
}

.nav-menu {
  width: 100%;
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
