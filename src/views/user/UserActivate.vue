<template>
  <EmailActionLayout :title="pageTitle" :description="pageDescription">
    <template #icon>
      <LoaderCircle v-if="loading" class="h-5 w-5 animate-spin" />
      <CheckCircle2 v-else-if="success" class="h-5 w-5" />
      <CircleAlert v-else-if="error" class="h-5 w-5" />
      <ShieldCheck v-else-if="isBindingCollegeEmail" class="h-5 w-5" />
      <MailCheck v-else class="h-5 w-5" />
    </template>

    <div v-if="error" ref="errorAlert" role="alert" tabindex="-1" class="mb-5 flex items-start gap-3 rounded-md border border-red-200 bg-red-50/50 px-3 py-3 text-sm leading-6 text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300">
      <CircleAlert class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p class="min-w-0 break-words">{{ error }}</p>
    </div>

    <RouterLink
      v-if="success"
      :to="isBindingCollegeEmail ? '/user/settings/email' : '/login'"
      class="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
    >
      {{ isBindingCollegeEmail ? '查看邮箱设置' : '前往登录' }}
      <ArrowRight class="h-4 w-4" aria-hidden="true" />
    </RouterLink>

    <!-- Explicit confirmation prevents link previews and prefetchers from consuming tokens. -->
    <button
      v-else-if="token || loading"
      type="button"
      :disabled="loading"
      :aria-busy="loading"
      class="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-50"
      @click="confirmAction"
    >
      <LoaderCircle v-if="loading" class="h-4 w-4 animate-spin" aria-hidden="true" />
      {{ loading ? (isBindingCollegeEmail ? '正在验证…' : '正在激活…') : error ? '重试' : isBindingCollegeEmail ? '确认绑定' : '确认激活' }}
    </button>

    <RouterLink
      v-else
      :to="isBindingCollegeEmail ? '/user/settings/email' : '/login'"
      class="inline-flex h-10 w-full items-center justify-center rounded-md bg-zinc-950 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
    >
      {{ isBindingCollegeEmail ? '返回邮箱设置' : '返回登录' }}
    </RouterLink>

    <template v-if="error && token" #footer>
      <RouterLink
        :to="isBindingCollegeEmail ? '/user/settings/email' : '/login'"
        class="rounded-sm font-medium text-zinc-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
      >
        {{ isBindingCollegeEmail ? '返回邮箱设置，重新发送验证邮件' : '返回登录' }}
      </RouterLink>
    </template>
  </EmailActionLayout>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowRight, CheckCircle2, CircleAlert, LoaderCircle, MailCheck, ShieldCheck } from 'lucide-vue-next'
import EmailActionLayout from '@/components/user/EmailActionLayout.vue'
import { useUser } from '@/lib/useUser'
import { api } from '@/lib/requests'
import { clearActionToken, getActionToken } from '@/lib/actionTokens'
import { useShadcnToast } from '@/lib/useShadcnToast'

const route = useRoute()
const router = useRouter()
const message = useShadcnToast()
const user = useUser(false)
const loading = ref(true)
const success = ref(false)
const error = ref('')
const token = ref('')
const errorAlert = ref<HTMLElement | null>(null)
const isBindingCollegeEmail = computed(() => route.name === 'bindCollegeMail')
const purpose = computed(() => isBindingCollegeEmail.value ? 'college-email-bind' : 'account-activation')
let requestVersion = 0

const pageTitle = computed(() => {
  if (success.value) return isBindingCollegeEmail.value ? '西大邮箱已验证' : '账号已激活'
  if (error.value) return isBindingCollegeEmail.value ? '邮箱验证未完成' : '账号激活未完成'
  return isBindingCollegeEmail.value ? '验证西大邮箱' : '激活你的账号'
})
const pageDescription = computed(() => {
  if (success.value) return isBindingCollegeEmail.value
    ? '邮箱绑定已完成，校邮认证标记已生效。'
    : '注册邮箱已验证，现在可以登录你的账号。'
  if (loading.value) return '正在处理你的请求，请稍候。'
  if (error.value) return '请检查邮件中的链接，或稍后重试。'
  return isBindingCollegeEmail.value
    ? '确认后，将验证邮件中的西大邮箱绑定到当前账号。'
    : '确认你的注册邮箱，完成账号激活。'
})

watch(() => [route.name, route.query.token], () => {
  requestVersion += 1
  if (route.name !== 'userActivate' && route.name !== 'bindCollegeMail') return
  loading.value = true
  success.value = false
  error.value = ''
  token.value = ''
  if (!isBindingCollegeEmail.value && user.isLoggedIn.value) {
    message.success('你已登录，正在跳转至首页')
    void router.replace('/')
    return
  }
  token.value = getActionToken(purpose.value, route.query.token)
  if (!token.value) {
    error.value = isBindingCollegeEmail.value
      ? '验证链接不完整，请重新打开绑定邮件中的链接。'
      : '激活链接不完整，请重新打开注册邮件中的链接。'
  }
  loading.value = false
}, { immediate: true })
onBeforeUnmount(() => { requestVersion += 1 })

const syncVerifiedUser = (content: unknown) => {
  const currentUser = user.userInfo.value
  if (!currentUser || !content || typeof content !== 'object' || !('user_id' in content) || !('email' in content)
    || typeof content.email !== 'string' || !content.email) return
  if (content.user_id === currentUser.id && content.email === currentUser.college_email) {
    user.login({ ...currentUser, verified: true })
  }
}

const confirmAction = async () => {
  if (loading.value || success.value || !token.value) return
  const version = requestVersion
  const binding = isBindingCollegeEmail.value
  const actionPurpose = purpose.value
  const startingUser = user.userInfo.value
  loading.value = true
  error.value = ''
  try {
    const response = binding
      ? await api.post({ url: '/api/user/bind-college-email/verify/', query: { token: token.value } })
      : await api.post({ url: '/api/user/register/activate/', query: { token: token.value } })
    if (version !== requestVersion) return
    if (response.status === 200) {
      success.value = true
      clearActionToken(actionPurpose)
      if (binding && user.userInfo.value === startingUser) syncVerifiedUser(response.content)
      message.success(binding ? '西大邮箱绑定成功' : '账户激活成功')
    } else if (response.errors?.some(item => item.err_code === 'invalid_token') || (binding && response.status === 400 && !response.errors?.length)) {
      error.value = '验证链接无效或已过期，请从最新的邮件中重新打开。'
    } else {
      error.value = response.errors?.map(item => item.err_msg).filter(Boolean).join('；')
        || (binding ? '邮箱验证失败，请稍后重试。' : '账号激活失败，请稍后重试。')
    }
  } catch {
    if (version === requestVersion) error.value = '网络连接错误，请检查网络后重试。'
  } finally {
    if (version === requestVersion) loading.value = false
  }
  if (version === requestVersion && error.value) {
    await nextTick()
    errorAlert.value?.focus({ preventScroll: true })
  }
}
</script>
