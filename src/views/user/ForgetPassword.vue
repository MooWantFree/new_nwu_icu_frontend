<template>
  <div class="flex min-h-[80dvh] flex-col justify-center bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
        <KeyRound class="h-7 w-7" />
      </div>
      <h1 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        {{ pageTitle }}
      </h1>
      <p class="mt-2 text-center text-sm text-gray-600">
        {{ pageDescription }}
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="rounded-2xl bg-white px-5 py-8 shadow sm:px-10">
        <div v-if="isVerifyingToken" class="flex flex-col items-center py-10 text-center">
          <LoaderCircle class="h-8 w-8 animate-spin text-blue-600" />
          <p class="mt-4 text-sm font-medium text-gray-700">正在验证重置链接…</p>
        </div>

        <div v-else-if="tokenError" class="text-center">
          <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <TriangleAlert class="h-8 w-8 text-red-600" />
          </div>
          <h2 class="mt-5 text-xl font-bold text-gray-900">重置链接不可用</h2>
          <p class="mt-3 text-sm leading-6 text-gray-600">{{ tokenError }}</p>
          <router-link
            :to="{ name: 'forgetPassword' }"
            class="mt-6 inline-flex w-full justify-center rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            重新申请重置链接
          </router-link>
        </div>

        <div v-else-if="resetSucceeded" class="text-center">
          <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 class="h-8 w-8 text-green-600" />
          </div>
          <h2 class="mt-5 text-xl font-bold text-gray-900">密码已重置</h2>
          <p class="mt-3 text-sm leading-6 text-gray-600">新密码已经生效，现在可以返回登录。</p>
          <router-link
            :to="{ name: 'login' }"
            class="mt-6 inline-flex w-full justify-center rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            前往登录
          </router-link>
        </div>

        <template v-else>
          <div
            v-if="errorMessage"
            class="mb-5 flex items-start gap-3 rounded-md bg-red-50 p-4 text-sm text-red-800"
            role="alert"
          >
            <TriangleAlert class="h-5 w-5 shrink-0" />
            <span>{{ errorMessage }}</span>
          </div>

          <form v-if="hasToken" class="space-y-5" @submit.prevent="handlePasswordReset">
            <div>
              <label for="new-password" class="block text-sm font-medium text-gray-700">新密码</label>
              <input
                id="new-password"
                v-model="newPassword"
                type="password"
                autocomplete="new-password"
                required
                placeholder="8–30 位，包含大小写字母和数字"
                class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:text-sm"
              />
            </div>

            <div>
              <label for="confirm-password" class="block text-sm font-medium text-gray-700">确认新密码</label>
              <input
                id="confirm-password"
                v-model="confirmPassword"
                type="password"
                autocomplete="new-password"
                required
                placeholder="再次输入新密码"
                class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:text-sm"
              />
            </div>

            <CaptchaField
              v-model="captchaValue"
              :image-url="captchaImageUrl"
              :loading="isLoadingCaptcha"
              @refresh="getCaptcha"
            />

            <button
              type="submit"
              :disabled="isLoading || isLoadingCaptcha"
              class="flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LoaderCircle v-if="isLoading" class="mr-2 h-5 w-5 animate-spin" />
              {{ isLoading ? '正在重置…' : '设置新密码' }}
            </button>
          </form>

          <template v-else>
            <form v-if="!linkSent" class="space-y-6" @submit.prevent="handleResetRequest">
              <div>
                <label for="email" class="block text-sm font-medium text-gray-700">注册邮箱</label>
                <input
                  id="email"
                  v-model="email"
                  name="email"
                  type="email"
                  autocomplete="email"
                  required
                  placeholder="请输入注册时使用的邮箱"
                  class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:text-sm"
                />
              </div>

              <CaptchaField
                v-model="captchaValue"
                :image-url="captchaImageUrl"
                :loading="isLoadingCaptcha"
                @refresh="getCaptcha"
              />

              <button
                type="submit"
                :disabled="isLoading || isLoadingCaptcha"
                class="flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LoaderCircle v-if="isLoading" class="mr-2 h-5 w-5 animate-spin" />
                {{ isLoading ? '发送中…' : '发送重置链接' }}
              </button>
            </form>

            <div v-else class="text-center">
              <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <MailCheck class="h-8 w-8 text-blue-600" />
              </div>
              <h2 class="mt-5 text-xl font-bold text-gray-900">重置链接已发送</h2>
              <p class="mt-3 text-sm leading-6 text-gray-600">
                我们已经向 <span class="font-medium text-gray-900">{{ email }}</span> 发送了重置密码邮件。
              </p>
              <p class="mt-2 text-xs leading-5 text-gray-500">如果没有收到，请检查垃圾邮件文件夹。</p>
              <button
                type="button"
                class="mt-6 w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                @click="resetRequestForm"
              >
                重新发送
              </button>
            </div>
          </template>
        </template>

        <div v-if="!isVerifyingToken && !resetSucceeded" class="mt-6 border-t border-gray-200 pt-6 text-center">
          <router-link to="/" class="text-sm font-medium text-blue-600 hover:text-blue-500">
            返回首页
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useMessage } from 'naive-ui'
import {
  CheckCircle2,
  KeyRound,
  LoaderCircle,
  MailCheck,
  RefreshCw,
  TriangleAlert,
} from 'lucide-vue-next'
import { api } from '@/lib/requests'
import { basePasswordSchema } from '@/types/common/userBasicInfo'

const CaptchaField = defineComponent({
  props: {
    modelValue: { type: String, required: true },
    imageUrl: { type: String, required: true },
    loading: { type: Boolean, required: true },
  },
  emits: ['update:modelValue', 'refresh'],
  setup(props, { emit }) {
    return () => h('div', [
      h('label', { for: 'reset-captcha', class: 'block text-sm font-medium text-gray-700' }, '验证码'),
      h('div', { class: 'mt-1 flex items-center gap-2' }, [
        h('input', {
          id: 'reset-captcha',
          value: props.modelValue,
          type: 'text',
          required: true,
          autocomplete: 'off',
          placeholder: '请输入验证码',
          class: 'block min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:text-sm',
          onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).value),
        }),
        props.loading
          ? h('div', { class: 'h-10 w-28 animate-pulse rounded bg-gray-200' })
          : h('button', {
            type: 'button',
            class: 'relative h-10 w-28 overflow-hidden rounded border border-gray-200 bg-gray-50',
            title: '刷新验证码',
            onClick: () => emit('refresh'),
          }, [
            h('img', { src: props.imageUrl, alt: '验证码', class: 'h-full w-full object-contain' }),
            h(RefreshCw, { class: 'absolute right-1 top-1 h-3.5 w-3.5 rounded bg-white/80 p-0.5 text-gray-500' }),
          ]),
      ]),
    ])
  },
})

const route = useRoute()
const message = useMessage()

const token = computed(() => typeof route.query.token === 'string' ? route.query.token : '')
const hasToken = computed(() => Boolean(token.value))
const email = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const linkSent = ref(false)
const resetSucceeded = ref(false)
const isVerifyingToken = ref(false)
const tokenError = ref('')
const captchaImageUrl = ref('')
const captchaKey = ref('')
const captchaValue = ref('')
const isLoadingCaptcha = ref(false)
const errorMessage = ref('')

const pageTitle = computed(() => {
  if (resetSucceeded.value) return '密码重置成功'
  if (hasToken.value) return '设置新密码'
  return linkSent.value ? '检查你的邮箱' : '忘记密码？'
})

const pageDescription = computed(() => {
  if (resetSucceeded.value) return '你的账户现在可以使用新密码登录'
  if (hasToken.value) return '请输入符合安全要求的新密码'
  return linkSent.value
    ? '重置链接将在 24 小时后失效'
    : '输入注册邮箱，我们会发送一封重置密码邮件'
})

const getErrorText = (errors: { err_msg: string }[] | undefined, fallback: string) =>
  errors?.map((item) => item.err_msg).filter(Boolean).join('；') || fallback

const getCaptcha = async () => {
  isLoadingCaptcha.value = true
  try {
    const response = await api.get({ url: '/api/captcha/' })
    if (response.status === 200) {
      captchaImageUrl.value = response.content.image_url
      captchaKey.value = response.content.key
      captchaValue.value = ''
    } else {
      errorMessage.value = '获取验证码失败，请重试'
    }
  } catch {
    errorMessage.value = '获取验证码时发生错误，请重试'
  } finally {
    isLoadingCaptcha.value = false
  }
}

const verifyToken = async () => {
  isVerifyingToken.value = true
  tokenError.value = ''
  try {
    const response = await api.get({
      url: '/api/user/mail-reset/:token/',
      params: { token: token.value },
    })
    if (response.status !== 200) {
      tokenError.value = '重置链接无效或已经过期，请重新申请。'
      return
    }
    await getCaptcha()
  } catch {
    tokenError.value = '暂时无法验证重置链接，请稍后重试。'
  } finally {
    isVerifyingToken.value = false
  }
}

const handleResetRequest = async () => {
  if (isLoadingCaptcha.value) return
  isLoading.value = true
  errorMessage.value = ''
  try {
    const response = await api.post({
      url: '/api/user/reset/',
      query: {
        email: email.value.trim(),
        captcha_key: captchaKey.value,
        captcha_value: captchaValue.value,
      },
    })
    if (response.status === 200) {
      linkSent.value = true
    } else if (response.errors?.some((item) => item.field === 'email')) {
      errorMessage.value = '该邮箱没有对应的账户'
      await getCaptcha()
    } else {
      errorMessage.value = getErrorText(response.errors, '发送失败，请稍后重试')
      await getCaptcha()
    }
  } catch {
    errorMessage.value = '网络连接错误，请稍后重试'
    await getCaptcha()
  } finally {
    isLoading.value = false
  }
}

const handlePasswordReset = async () => {
  errorMessage.value = ''
  const passwordResult = basePasswordSchema.safeParse(newPassword.value)
  if (!passwordResult.success) {
    errorMessage.value = passwordResult.error.errors[0]?.message || '新密码不符合要求'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = '两次输入的密码不一致'
    return
  }
  if (!captchaValue.value) {
    errorMessage.value = '请输入验证码'
    return
  }

  isLoading.value = true
  try {
    const response = await api.post({
      url: '/api/user/mail-reset/:token/',
      params: { token: token.value },
      query: {
        new_password: newPassword.value,
        confirm_password: confirmPassword.value,
        captcha_key: captchaKey.value,
        captcha_value: captchaValue.value,
      },
    })
    if (response.status === 200) {
      resetSucceeded.value = true
      message.success('密码重置成功')
    } else if (response.status === 401) {
      tokenError.value = '重置链接无效或已经过期，请重新申请。'
    } else {
      errorMessage.value = getErrorText(response.errors, '密码重置失败，请检查输入后重试')
      await getCaptcha()
    }
  } catch {
    errorMessage.value = '网络连接错误，请稍后重试'
    await getCaptcha()
  } finally {
    isLoading.value = false
  }
}

const resetRequestForm = async () => {
  linkSent.value = false
  captchaValue.value = ''
  errorMessage.value = ''
  await getCaptcha()
}

onMounted(async () => {
  if (hasToken.value) {
    await verifyToken()
  } else {
    await getCaptcha()
  }
})
</script>
