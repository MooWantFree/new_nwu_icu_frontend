<template>
<div
  class="login-form"
>
  <n-card
      style="width: 80%;"
  >
    <LoginForm />
  </n-card>
</div>
</template>

<script setup lang="ts">
import LoginForm from '@/components/LoginForm.vue'
</script>

<style scoped>
.login-form {
  display: flex;
  justify-content: center;
}
</style>