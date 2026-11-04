<template>
  <div class="flex min-h-[calc(100dvh-8rem)] items-center justify-center bg-zinc-50 px-4 py-12 text-zinc-950">
    <div class="w-full max-w-[420px]">
      <RouterLink
        to="/"
        class="mb-5 inline-flex items-center gap-2 rounded-md text-sm text-zinc-500 transition-colors hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
      >
        <ArrowLeft class="h-4 w-4" aria-hidden="true" />
        返回首页
      </RouterLink>
      <p
        v-if="reason"
        class="mb-4 px-1 text-sm leading-6 text-zinc-500"
      >
        {{ reason }}
      </p>
      <div class="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <LoadError v-if="checkError" :message="checkError" :busy="checking" @retry="checkExistingSession" />
        <LoginForm @login-success="handleLoginSuccess" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import LoadError from '@/components/common/LoadError.vue'
import { useRoute, useRouter } from 'vue-router'
import { useShadcnToast } from '@/lib/useShadcnToast'
import { ArrowLeft } from 'lucide-vue-next'
import LoginForm from '@/components/user/loginNRegister/LoginForm.vue'
import { checkLoginStatus } from '@/lib/logins'
import { resolveLoginContext } from '@/lib/loginRedirect'
import { useUser } from '@/lib/useUser'

const router = useRouter()
const route = useRoute()
const message = useShadcnToast()
const { fetchUserInfo } = useUser(false)
const loginContext = computed(() => resolveLoginContext(
  router,
  route.query.redirect,
  route.query.intent,
))
const reason = computed(() => loginContext.value.reason)

const checkError = ref('')
const checking = ref(false)
async function checkExistingSession() {
  if (checking.value) return
  checking.value = true
  try {
    if (await checkLoginStatus()) await router.replace(loginContext.value.redirect)
    checkError.value = ''
  } catch { checkError.value = '暂时无法确认登录状态，请重试' }
  finally { checking.value = false }
}
onBeforeMount(checkExistingSession)

const handleLoginSuccess = async () => {
  await fetchUserInfo()
  message.success(loginContext.value.successMessage)
  await router.replace(loginContext.value.redirect)
}
</script>
