<template>
  <a-layout class="home_layout">
    <a-layout-header style="display: flex">
      <div style="margin-right: 5px">
        <RouterLink to="/"><b>NWU.ICU</b></RouterLink>
      </div>
      <a-menu
          theme="dark"
          mode="horizontal"
          disabledOverflow="false"
          :selected-keys="[activeMenuItem]"
          :style="{ lineHeight: '64px' }"
          class="desktop-only"
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


      </a-menu
      >
      <a-menu
          theme="dark"
          mode="horizontal"
          disabledOverflow="false"
          :selected-keys="[activeMenuItem]"
          :style="{ lineHeight: '64px' }"
          style="margin-left: auto"
          class="desktop-only">
        <a-menu-item key="login">
          <RouterLink to="/login">Login</RouterLink>
        </a-menu-item>
      </a-menu>
      <DropMenu/>
    </a-layout-header>
    <br>
    <a-layout-content style="padding: 0 50px">
      <RouterView/>
    </a-layout-content>

    <a-layout-footer class="home_footer">
      2019-{{ currentYear }} NWU.ICU
    </a-layout-footer>
  </a-layout>
</template>

<script lang="ts" setup>
import {ref, watch} from 'vue';
import {useRoute} from "vue-router";
import DropMenu from "@/components/DropMenu.vue";

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


</script>

<style scoped>
.home_layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}


.home_footer {
  text-align: center;
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
