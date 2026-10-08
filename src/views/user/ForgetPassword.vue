<template>
  <EmailActionLayout :title="pageTitle" :description="pageDescription">
    <template #icon>
      <component :is="pageIcon" class="h-5 w-5" :class="{ 'animate-spin': isChecking }" aria-hidden="true" />
    </template>

    <div v-if="isChecking" role="status" aria-busy="true" class="text-sm leading-6 text-zinc-500">正在验证重置链接…</div>
    <div v-else-if="tokenError" role="alert" :class="alertClass">
      <CircleAlert class="mt-0.5 h-4 w-4" aria-hidden="true" />
      <p class="min-w-0 break-words leading-6">{{ tokenError }}</p>
    </div>
    <p v-else-if="resetSucceeded" class="text-sm leading-6 text-zinc-600">使用新密码登录 NWU.ICU。</p>
    <div v-else-if="linkSent" class="space-y-4">
      <div class="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
        <p class="text-xs text-zinc-500">重置邮件发送至</p>
        <p class="mt-1 break-all text-sm font-medium leading-6 text-zinc-950">{{ sentEmail }}</p>
      </div>
      <p class="text-xs leading-5 text-zinc-500">如果没有收到，请检查垃圾邮件文件夹。</p>
    </div>
    <template v-else>
      <div v-if="errorMessage" role="alert" :class="[alertClass, 'mb-5']">
        <CircleAlert class="mt-0.5 h-4 w-4" aria-hidden="true" />
        <p class="min-w-0 break-words leading-6">{{ errorMessage }}</p>
      </div>
      <form :id="formId" class="space-y-5" novalidate @submit.prevent="hasToken ? handlePasswordReset() : handleResetRequest()">
        <template v-if="hasToken">
          <div class="space-y-2">
            <CustomInput id="new-password" v-model="newPassword" label="新密码" type="password" autocomplete="new-password" placeholder="请输入新密码" required :error="fieldErrors.newPassword" :disabled="isLoading" />
            <p class="text-xs leading-5 text-zinc-500">8–30 位，包含大写字母、小写字母和数字。</p>
          </div>
          <CustomInput id="confirm-password" v-model="confirmPassword" label="确认新密码" type="password" autocomplete="new-password" placeholder="再次输入新密码" required :error="fieldErrors.confirmPassword" :disabled="isLoading" />
        </template>
        <CustomInput v-else id="email" v-model="email" label="注册邮箱" type="email" autocomplete="email" placeholder="请输入注册时使用的邮箱" required :error="fieldErrors.email" :disabled="isLoading" />
        <CaptchaField v-model="captchaValue" :image-url="captchaImageUrl" :loading="isLoadingCaptcha" :disabled="isLoading" :error="fieldErrors.captcha" @refresh="getCaptcha" @image-error="errorMessage = '验证码加载失败，请重试'" />
      </form>
    </template>

    <template v-if="!isChecking" #footer>
      <div v-if="tokenError" class="flex flex-col gap-2">
        <button v-if="canRetryToken" type="button" :class="primaryButton" :disabled="isLoading || isVerifyingToken" @click="verifyToken">重新验证链接</button>
        <button type="button" :class="canRetryToken ? secondaryButton : primaryButton" :disabled="isLoading || isVerifyingToken" @click="resetToRequest">重新申请重置链接</button>
      </div>
      <RouterLink v-else-if="resetSucceeded" :to="{ name: 'login' }" :class="primaryButton">前往登录</RouterLink>
      <button v-else-if="linkSent" type="button" :class="secondaryButton" :disabled="isLoading || isLoadingCaptcha" @click="resetRequestForm">重新发送</button>
      <button v-else type="submit" :form="formId" :class="primaryButton" :disabled="isLoading || isLoadingCaptcha">
        <LoaderCircle v-if="isLoading" class="h-4 w-4 animate-spin" aria-hidden="true" />
        {{ isLoading ? hasToken ? '正在重置…' : '发送中…' : hasToken ? '设置新密码' : '发送重置链接' }}
      </button>
    </template>
  </EmailActionLayout>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onBeforeUnmount, onMounted, ref, useId } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { z } from 'zod'
import { CheckCircle2, CircleAlert, KeyRound, LoaderCircle, MailCheck, RefreshCw, TriangleAlert } from 'lucide-vue-next'
import { api } from '@/lib/requests'
import { clearActionToken, getActionToken } from '@/lib/actionTokens'
import { useShadcnToast } from '@/lib/useShadcnToast'
import { basePasswordSchema } from '@/types/common/userBasicInfo'
import CaptchaImage from '@/components/common/CaptchaImage.vue'
import CustomInput from '@/components/user/loginNRegister/CustomInput.vue'
import EmailActionLayout from '@/components/user/EmailActionLayout.vue'

const CaptchaField = defineComponent({
  props: {
    modelValue: { type: String, required: true },
    imageUrl: { type: String, required: true },
    loading: { type: Boolean, required: true },
    disabled: Boolean,
    error: String,
  },
  emits: ['update:modelValue', 'refresh', 'image-error'],
  setup(props, { emit }) {
    return () => h('div', { class: 'space-y-2' }, [
      h('label', { for: 'reset-captcha', class: 'block text-sm font-medium text-zinc-950' }, '验证码'),
      h('div', { class: 'flex min-w-0 items-center gap-2' }, [
        h('input', {
          id: 'reset-captcha', value: props.modelValue, type: 'text', autocomplete: 'off',
          'aria-required': true, 'aria-invalid': Boolean(props.error),
          'aria-describedby': props.error ? 'reset-captcha-error' : undefined,
          disabled: props.disabled || props.loading, placeholder: '请输入验证码',
          class: `h-10 min-w-0 flex-1 rounded-md border px-3 text-sm text-zinc-950 shadow-sm transition-colors placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:opacity-60 ${props.error ? 'border-red-400 focus:ring-red-300' : 'border-zinc-200 focus:ring-zinc-400'}`,
          onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).value),
        }),
        h(CaptchaImage, {
          class: 'w-28 rounded-md border-zinc-200 bg-zinc-50', appearance: 'shadcn',
          imageUrl: props.imageUrl, loading: props.loading, disabled: props.disabled,
          onRefresh: () => emit('refresh'), onError: () => emit('image-error'),
        }, {
          default: () => h(RefreshCw, { class: 'absolute right-1 top-1 h-3.5 w-3.5 rounded bg-white/80 p-0.5 text-zinc-500', 'aria-hidden': true }),
        }),
      ]),
      props.error ? h('p', { id: 'reset-captcha-error', class: 'text-xs leading-5 text-red-600' }, props.error) : null,
    ])
  },
})

const route = useRoute()
const router = useRouter()
const message = useShadcnToast()
const formId = `password-reset-form-${useId()}`
const primaryButton = 'inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-50'
const secondaryButton = 'inline-flex h-10 w-full items-center justify-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-950 shadow-sm transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-50'
const alertClass = 'grid grid-cols-[1rem_minmax(0,1fr)] items-start gap-3 rounded-lg border border-red-200 bg-white p-4 text-sm text-red-700'
const token = ref(getActionToken('password-reset', route.query.token))
const hasToken = computed(() => Boolean(token.value))
const tokenVerified = ref(false)
const email = ref('')
const sentEmail = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const linkSent = ref(false)
const resetSucceeded = ref(false)
const isVerifyingToken = ref(false)
const tokenError = ref('')
const canRetryToken = ref(false)
const captchaImageUrl = ref('')
const captchaKey = ref('')
const captchaValue = ref('')
const isLoadingCaptcha = ref(false)
const errorMessage = ref('')
const fieldErrors = ref({ email: '', newPassword: '', confirmPassword: '', captcha: '' })
const isChecking = computed(() => isVerifyingToken.value || (hasToken.value && !tokenVerified.value && !tokenError.value && !resetSucceeded.value))
let captchaVersion = 0
let tokenVersion = 0
let actionVersion = 0

const pageTitle = computed(() => {
  if (resetSucceeded.value) return '密码重置成功'
  if (isChecking.value) return '验证重置链接'
  if (tokenError.value) return canRetryToken.value ? '暂时无法验证链接' : '重置链接不可用'
  if (hasToken.value) return '设置新密码'
  return linkSent.value ? '检查你的邮箱' : '忘记密码？'
})
const pageDescription = computed(() => {
  if (resetSucceeded.value) return '新密码已经生效，可以返回登录。'
  if (isChecking.value) return '请稍候，正在确认重置链接是否有效。'
  if (tokenError.value) return canRetryToken.value ? '请检查网络后重试，或重新申请重置链接。' : '请重新申请一封重置密码邮件。'
  if (hasToken.value) return '输入符合要求的新密码，完成密码重置。'
  return linkSent.value ? '打开邮件中的重置链接，继续设置新密码。' : '输入注册邮箱，我们会发送一封重置密码邮件。'
})
const pageIcon = computed(() => isChecking.value ? LoaderCircle : tokenError.value ? TriangleAlert : resetSucceeded.value ? CheckCircle2 : linkSent.value ? MailCheck : KeyRound)
const getErrorText = (errors: { err_msg: string }[] | undefined, fallback: string) => errors?.map(item => item.err_msg).filter(Boolean).join('；') || fallback
const invalidTokenText = '重置链接无效或已经过期，请重新申请。'
const clearErrors = () => { errorMessage.value = ''; fieldErrors.value = { email: '', newPassword: '', confirmPassword: '', captcha: '' } }
const focusField = (id: string) => document.getElementById(id)?.focus()
const validateCaptcha = () => {
  if (!captchaKey.value) fieldErrors.value.captcha = '请先获取验证码，再提交'
  else if (!captchaValue.value.trim()) fieldErrors.value.captcha = '请输入验证码'
  if (fieldErrors.value.captcha) { focusField('reset-captcha'); return false }
  return true
}

async function getCaptcha() {
  if (isLoadingCaptcha.value) return
  const version = ++captchaVersion
  isLoadingCaptcha.value = true
  captchaImageUrl.value = ''
  captchaKey.value = ''
  captchaValue.value = ''
  fieldErrors.value.captcha = ''
  if (errorMessage.value === '验证码加载失败，请重试') errorMessage.value = ''
  try {
    const response = await api.get({ url: '/api/captcha/' })
    if (version !== captchaVersion) return
    if (response.status === 200) {
      captchaImageUrl.value = response.content.image_url
      captchaKey.value = response.content.key
    } else errorMessage.value = '获取验证码失败，请重试'
  } catch {
    if (version === captchaVersion) errorMessage.value = '获取验证码时发生错误，请重试'
  } finally {
    if (version === captchaVersion) isLoadingCaptcha.value = false
  }
}

async function verifyToken() {
  if (isVerifyingToken.value || isLoading.value || !token.value || resetSucceeded.value) return
  const verifyingToken = token.value
  const version = ++tokenVersion
  isVerifyingToken.value = true
  tokenVerified.value = false
  tokenError.value = ''
  canRetryToken.value = false
  try {
    const response = await api.post({ url: '/api/user/mail-reset/verify/', query: { token: verifyingToken } })
    if (version !== tokenVersion || verifyingToken !== token.value) return
    if (response.status !== 200) {
      const invalidToken = response.errors?.some(error => error.err_code === 'invalid_token')
      canRetryToken.value = !invalidToken && (response.status >= 500 || response.status === 429)
      tokenError.value = invalidToken ? invalidTokenText : getErrorText(response.errors, canRetryToken.value ? '暂时无法验证重置链接，请稍后重试。' : invalidTokenText)
      return
    }
    tokenVerified.value = true
    await getCaptcha()
  } catch {
    if (version !== tokenVersion || verifyingToken !== token.value) return
    canRetryToken.value = true
    tokenError.value = '暂时无法验证重置链接，请稍后重试。'
  } finally {
    if (version === tokenVersion) isVerifyingToken.value = false
  }
}

async function clearTokenFromUrl() {
  const query = { ...route.query }
  const hadQueryToken = Object.prototype.hasOwnProperty.call(query, 'token')
  delete query.token
  const hashParams = new URLSearchParams(route.hash.replace(/^#/, ''))
  const hadHashToken = hashParams.has('token')
  if (hadHashToken) hashParams.delete('token')
  const hash = hadHashToken ? hashParams.toString() ? `#${hashParams.toString()}` : '' : route.hash
  if (hadQueryToken || hadHashToken) await router.replace({ path: route.path, query, hash })
}

async function handleResetRequest() {
  if (isLoading.value || isLoadingCaptcha.value || hasToken.value || linkSent.value || resetSucceeded.value) return
  clearErrors()
  const requestEmail = email.value.trim()
  if (!z.string().email().safeParse(requestEmail).success) {
    fieldErrors.value.email = '请输入有效的注册邮箱'
    focusField('email')
    return
  }
  if (!validateCaptcha()) return
  const version = ++actionVersion
  isLoading.value = true
  try {
    const response = await api.post({ url: '/api/user/reset/', query: { email: requestEmail, captcha_key: captchaKey.value, captcha_value: captchaValue.value.trim() } })
    if (version !== actionVersion) return
    if (response.status === 200) {
      sentEmail.value = requestEmail
      linkSent.value = true
      message.success('重置链接已发送')
    } else {
      errorMessage.value = getErrorText(response.errors, '发送失败，请稍后重试')
      message.error(errorMessage.value)
      await getCaptcha()
    }
  } catch {
    if (version !== actionVersion) return
    errorMessage.value = '网络连接错误，请稍后重试'
    message.error(errorMessage.value)
    await getCaptcha()
  } finally {
    if (version === actionVersion) isLoading.value = false
  }
}

async function handlePasswordReset() {
  if (isLoading.value || isLoadingCaptcha.value || isVerifyingToken.value || !tokenVerified.value || !token.value || resetSucceeded.value) return
  clearErrors()
  const passwordResult = basePasswordSchema.safeParse(newPassword.value)
  if (!passwordResult.success) {
    fieldErrors.value.newPassword = passwordResult.error.errors[0]?.message || '新密码不符合要求'
    focusField('new-password')
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    fieldErrors.value.confirmPassword = '两次输入的密码不一致'
    focusField('confirm-password')
    return
  }
  if (!validateCaptcha()) return
  const resettingToken = token.value
  const version = ++actionVersion
  isLoading.value = true
  try {
    const response = await api.post({ url: '/api/user/mail-reset/', query: { token: resettingToken, new_password: newPassword.value, confirm_password: confirmPassword.value, captcha_key: captchaKey.value, captcha_value: captchaValue.value.trim() } })
    if (version !== actionVersion || resettingToken !== token.value) return
    if (response.status === 200) {
      resetSucceeded.value = true
      clearActionToken('password-reset')
      token.value = ''
      newPassword.value = ''
      confirmPassword.value = ''
      captchaValue.value = ''
      message.success('密码重置成功')
      await clearTokenFromUrl()
    } else if (response.status === 401) {
      tokenError.value = response.errors?.some(error => error.err_code === 'invalid_token') ? invalidTokenText : getErrorText(response.errors, invalidTokenText)
      canRetryToken.value = false
      message.error(tokenError.value)
    } else {
      errorMessage.value = getErrorText(response.errors, '密码重置失败，请检查输入后重试')
      message.error(errorMessage.value)
      await getCaptcha()
    }
  } catch {
    if (version !== actionVersion || resettingToken !== token.value) return
    errorMessage.value = '网络连接错误，请稍后重试'
    message.error(errorMessage.value)
    await getCaptcha()
  } finally {
    if (version === actionVersion) isLoading.value = false
  }
}

async function resetRequestForm() {
  if (isLoading.value || isLoadingCaptcha.value) return
  linkSent.value = false
  clearErrors()
  await getCaptcha()
}

async function resetToRequest() {
  if (isLoading.value || isVerifyingToken.value) return
  tokenVersion += 1
  clearActionToken('password-reset')
  token.value = ''
  tokenVerified.value = false
  tokenError.value = ''
  canRetryToken.value = false
  resetSucceeded.value = false
  linkSent.value = false
  newPassword.value = ''
  confirmPassword.value = ''
  clearErrors()
  await clearTokenFromUrl()
  await getCaptcha()
}

onMounted(async () => { if (hasToken.value) await verifyToken(); else await getCaptcha() })
onBeforeUnmount(() => { captchaVersion += 1; tokenVersion += 1; actionVersion += 1 })
</script>
