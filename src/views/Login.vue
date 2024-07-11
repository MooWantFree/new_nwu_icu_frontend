<template>
  <div class="flex content-center items-center">
    <Login />
  </div>
</template>

<script>
import {defineComponent} from "vue";
import Login from "@/components/Login.vue";

export default defineComponent({
  components: {
    Login,
  },
});
</script>

<style scoped>
</style>