<template>
  <Home/>
</template>

<script>
import {defineComponent} from "vue";
import Home from "@/components/Home.vue";

export default defineComponent({
  mounted() {
    document.title = '主页';
  },
  components: {
    Home,
  },
});
</script>