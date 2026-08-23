<template>
  <div class="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-10">
    <n-card class="w-full max-w-xl">
      <div
        v-if="reason"
        class="mx-auto mb-5 max-w-[460px] rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800"
      >
        {{ reason }}
      </div>
      <div class="mx-auto max-w-[460px]">
        <LoginForm @login-success="handleLoginSuccess" />
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { onBeforeMount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import LoginForm from '@/components/user/loginNRegister/LoginForm.vue'
import { checkLoginStatus } from '@/lib/logins'
import { useUser } from '@/lib/useUser'

const router = useRouter()
const route = useRoute()
const message = useMessage()
const { fetchUserInfo } = useUser(false)
const reason = typeof route.query.reason === 'string' ? route.query.reason : ''

const getSafeRedirect = () => {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')
    ? redirect
    : '/'
}

onBeforeMount(async () => {
  if (await checkLoginStatus()) {
    await router.replace(getSafeRedirect())
  }
})

const handleLoginSuccess = async () => {
  await fetchUserInfo()
  message.success('登录成功，正在继续投稿')
  await router.replace(getSafeRedirect())
}
</script>
