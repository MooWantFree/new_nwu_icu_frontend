<template>
  <div
      class="login-form"
  >
    <n-card
        style="width: 80%;"
    >
      <LoginForm :on-login-success="handleLoginSuccess" />
    </n-card>
  </div>
</template>

<script setup lang="ts">
import LoginForm from '@/components/LoginForm.vue'
import {useRouter} from "vue-router";
import {useMessage} from "naive-ui";

const router = useRouter()
const message = useMessage()
const handleLoginSuccess = () => {
  message.success("成功登录，即将跳转到主页")
  setTimeout(()=>{router.push("/")}, 1500)
}
</script>

<style scoped>
.login-form {
  display: flex;
  justify-content: center;
}
</style>