<template>
  <div class="navbar">
    <div class="left-button">
      <router-link :to="{ name: 'home' }">
        <n-button color="#000000" dashed>
          NWU.ICU
        </n-button>
      </router-link>
    </div>
    <div class="center-buttons">
      <n-dropdown trigger="hover" :options="options">
        <n-button quaternary type="primary">
          <template #icon>
            <n-icon>
              <school/>
            </n-icon>
          </template>
          课程评价
        </n-button>
      </n-dropdown>
      <n-popconfirm @positive-click="handlePositiveClick">
        <template #trigger>
          <n-button quaternary type="primary">
            <template #icon>
              <n-icon>
                <download/>
              </n-icon>
            </template>
            资料下载
          </n-button>
        </template>
        即将要访问外部网站(虽然也是我们的:D)
      </n-popconfirm>
      <router-link :to="{ name: 'about' }">
        <n-button quaternary color="#ff69b4">
          <template #icon>
            <n-icon>
              <about/>
            </n-icon>
          </template>
          关于
        </n-button>
      </router-link>
    </div>
    <div class="right-button">
      <router-link :to="{ name: 'login' }">
        <n-button type="info" >
          <template #icon>
            <n-icon>
              <login/>
            </n-icon>
          </template>
          登录
        </n-button>
      </router-link>
    </div>
    <div class="right-button_mobile">
      <n-dropdown trigger="hover" :size="'huge'" :options="mobileOptions" :inverted="false">
        <n-button type="info">
          <template #icon>
            <n-icon>
              <MenuSharp/>
            </n-icon>
          </template>
        </n-button>
      </n-dropdown>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  BookOutline as BookIcon,
  CloudDownloadOutline as Download,
  InformationCircleOutline as About,
  LogInOutline as Login,
  MenuSharp as MenuSharp,
  SchoolSharp as School
} from '@vicons/ionicons5'
import {Component, h} from 'vue'
import {RouterLink} from "vue-router";
import {NIcon} from "naive-ui";

function renderIcon(icon: Component) {
  return () => h(NIcon, null, {default: () => h(icon)})
}

const options = [{
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
}];
const mobileOptions = [
  ...options,
  {
    label: '资料下载',
    key: 'resourcesDownload',
    icon: renderIcon(Download),
    disabled: false,
  },
  {
    label: '关于',
    key: 'about',
    icon: renderIcon(About),
    disabled: false,
  },
  {
    label: '登录',
    key: 'Login',
    type: "info",
    icon: renderIcon(Login),
    disabled: false,
  },]
const handlePositiveClick = () => {
  window.open('https://resour.nwu.icu', '_blank');
}

</script>

<style>
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between; /* 左右对齐 */
  width: 100%;
  height: 50px;
  background-color: white;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
}


.left-button {
  margin-left: 1.5rem; /* 左侧按钮距离网页边缘22px */
  flex: 0;
}

.right-button {
  margin-right: 1.5rem; /* 右侧按钮距离网页边缘22px */
  flex: 0;
}

.right-button_mobile {
  display: none;
  margin-right: 1.5rem;
}

.center-buttons {
  flex: 1;
  display: flex;
  justify-content: center; /* 中间按钮居中 */
  gap: 10px; /* 增加按钮间距 */
}

@media (max-width: 768px) {

  .center-buttons {
    display: none;
  }

  .right-button {
    display: none;
  }

  .right-button_mobile {
    display: initial;
  }
}
</style>
