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
import { computed, onBeforeMount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import LoginForm from '@/components/user/loginNRegister/LoginForm.vue'
import { checkLoginStatus } from '@/lib/logins'
import { resolveLoginContext } from '@/lib/loginRedirect'
import { useUser } from '@/lib/useUser'

const router = useRouter()
const route = useRoute()
const message = useMessage()
const { fetchUserInfo } = useUser(false)
const loginContext = computed(() => resolveLoginContext(
  router,
  route.query.redirect,
  route.query.intent,
))
const reason = computed(() => loginContext.value.reason)

onBeforeMount(async () => {
  if (await checkLoginStatus()) {
    await router.replace(loginContext.value.redirect)
  }
})

const handleLoginSuccess = async () => {
  await fetchUserInfo()
  message.success(loginContext.value.successMessage)
  await router.replace(loginContext.value.redirect)
}
</script>
