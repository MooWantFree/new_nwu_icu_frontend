<template>
  <div class="flex min-h-[80dvh] flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
    <div class="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
      <!-- Loading state -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-10">
        <div class="h-16 w-16">
          <div class="h-full w-full animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
        </div>
        <p class="mt-6 text-lg font-medium text-gray-700">正在处理验证请求...</p>
        <p class="mt-2 text-sm text-gray-500">请稍候，这可能需要几秒钟时间</p>
      </div>

      <!-- Explicit confirmation prevents link previews and prefetchers from consuming tokens. -->
      <template v-else-if="readyToConfirm">
        <div class="flex flex-col items-center text-center">
          <div class="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
            <ShieldCheck class="h-10 w-10 text-blue-700" />
          </div>
          <h1 class="mt-6 text-3xl font-bold tracking-tight text-gray-900">确认邮箱验证</h1>
          <p class="mt-4 text-gray-600">
            {{ isBindingCollegeEmail ? '点击下方按钮，将这个 NWU 邮箱绑定到当前账户。' : '点击下方按钮，激活你的账户。' }}
          </p>
          <button
            class="mt-8 inline-flex items-center rounded-md bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            @click="confirmAction"
          >
            {{ isBindingCollegeEmail ? '确认绑定' : '确认激活' }}
          </button>
        </div>
      </template>

      <!-- Success state -->
      <template v-else-if="success">
        <div class="flex flex-col items-center text-center">
          <div class="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <Check class="h-10 w-10 text-green-600" />
          </div>
          <h1 class="mt-6 text-3xl font-bold tracking-tight text-gray-900">邮箱验证成功</h1>
          <p class="mt-4 text-gray-600">恭喜，你的邮箱地址已成功验证，现在可以登录并使用所有功能。</p>
          <div class="mt-8">
            <router-link
              to="/"
              class="btn-primary px-6 py-3 text-base"
            >
              <House class="mr-2 h-5 w-5" />
              前往首页
            </router-link>
          </div>
        </div>
      </template>

      <!-- Error state -->
      <template v-else>
        <div class="flex flex-col items-center text-center">
          <div class="flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <TriangleAlert class="h-10 w-10 text-red-600" />
          </div>
          <h1 class="mt-6 text-3xl font-bold tracking-tight text-gray-900">验证失败</h1>
          <p class="mt-4 text-gray-600">{{ error }}</p>
          <div class="mt-8 flex flex-col space-y-3 sm:flex-row sm:space-x-3 sm:space-y-0">
            <router-link
              to="/"
              class="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              返回首页
            </router-link>
            <button
              @click="retryActivation"
              class="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              重试
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useUser } from '@/lib/useUser'
import { api } from '@/lib/requests'
import { Check, House, ShieldCheck, TriangleAlert } from 'lucide-vue-next'
import { clearActionToken, getActionToken } from '@/lib/actionTokens'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const user = useUser()

const loading = ref<boolean>(true)
const readyToConfirm = ref<boolean>(false)
const success = ref<boolean>(false)
const error = ref<string | null>(null)
const token = ref<string>('')
const isBindingCollegeEmail = ref<boolean>(false)

onMounted(() => {
  isBindingCollegeEmail.value = route.name === 'bindCollegeMail'

  if (!isBindingCollegeEmail.value && user.isLoggedIn.value) {
    message.success('你已登录，正在跳转至首页')
    router.replace('/')
    return
  }

  const purpose = isBindingCollegeEmail.value ? 'college-email-bind' : 'account-activation'
  token.value = getActionToken(purpose, route.query.token)
  if (!token.value) {
    error.value = isBindingCollegeEmail.value
      ? '绑定令牌丢失，请检查你的绑定链接是否完整'
      : '激活令牌丢失，请检查你的激活链接是否完整'
    loading.value = false
    return
  }

  readyToConfirm.value = true
  loading.value = false
})

const bindCollegeMail = async () => {
  loading.value = true
  try {
    const { status, errors } = await api.post({
      url: '/api/user/bind-college-email/verify/',
      query: {
        token: token.value,
      },
    })
    
    const errorText = errors?.reduce((acc, cur) => acc + cur.err_msg, '')
    
    if (status === 200) {
      success.value = true
      clearActionToken('college-email-bind')
      message.success('绑定成功')
    } else {
      error.value = errorText || '绑定失败。请重试或联系客服支持。'
    }
  } catch (err) {
    error.value = '网络连接错误，请检查你的网络连接并重试。'
    console.error('Activation error:', err)
  } finally {
    loading.value = false
  }
}


const activateAccount = async () => {
  loading.value = true
  try {
    const { status, errors } = await api.post({
      url: '/api/user/register/activate/',
      query: {
        token: token.value,
      },
    })
    
    const errorText = errors?.reduce((acc, cur) => acc + cur.err_msg, '')
    
    if (status === 200) {
      success.value = true
      clearActionToken('account-activation')
      message.success('账户激活成功')
    } else {
      error.value = errorText || '账户激活失败。请重试或联系客服支持。'
    }
  } catch (err) {
    error.value = '网络连接错误，请检查你的网络连接并重试。'
    console.error('Activation error:', err)
  } finally {
    loading.value = false
  }
}

const confirmAction = async () => {
  readyToConfirm.value = false
  error.value = null
  if (isBindingCollegeEmail.value) {
    await bindCollegeMail()
  } else {
    await activateAccount()
  }
}

const retryActivation = () => {
  if (token.value) {
    confirmAction()
  } else {
    error.value = '验证令牌丢失，无法重试'
  }
}
</script>
