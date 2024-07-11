<template>
  <a-layout class="layout">
    <a-layout-header style="display: flex">
      <div style="margin-right: 5px"><RouterLink to="/"><b>NWU.ICU</b></RouterLink></div>
      <a-menu
          theme="dark"
          :mode="naviBarLayout"
          :selected-keys="[activeMenuItem]"
          :style="{ lineHeight: '64px' }"
      >
        <a-menu-item key="review">
          <RouterLink to="/review">课程评价</RouterLink>
        </a-menu-item>
        <a-menu-item key="download">
          <RouterLink to="/download">资源下载</RouterLink>
        </a-menu-item>

        <a-menu-item key="about">
          <RouterLink to="/about">About</RouterLink>
        </a-menu-item>

        <a-menu-item key="login" style="margin-left: auto">

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
    {immediate: true}
)

const isMobile = ref(false)
const naviBarLayout = ref(isMobile.value ? 'vertical' : 'horizontal')
watch(() => window.innerWidth, (width) => {
  isMobile.value = width < 768
  naviBarLayout.value = isMobile.value ? 'vertical' : 'horizontal'
})
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

</style>
