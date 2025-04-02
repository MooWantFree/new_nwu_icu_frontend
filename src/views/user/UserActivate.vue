<template>
  <div class="flex min-h-[80dvh] flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
    <div class="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
      <!-- Loading state -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-10">
        <div class="h-16 w-16">
          <div class="h-full w-full animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
        </div>
        <p class="mt-6 text-lg font-medium text-gray-700">正在激活你的账户...</p>
        <p class="mt-2 text-sm text-gray-500">请稍候，这可能需要几秒钟时间</p>
      </div>

      <!-- Success state -->
      <template v-else-if="success">
        <div class="flex flex-col items-center text-center">
          <div class="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <svg class="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h1 class="mt-6 text-3xl font-bold tracking-tight text-gray-900">邮箱验证成功</h1>
          <p class="mt-4 text-gray-600">恭喜，你的邮箱地址已成功验证，现在可以登录并使用所有功能。</p>
          <div class="mt-8">
            <router-link
              to="/"
              class="inline-flex items-center rounded-md bg-green-600 px-6 py-3 text-base font-medium text-white shadow-sm transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <svg class="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
              </svg>
              前往首页
            </router-link>
          </div>
        </div>
      </template>

      <!-- Error state -->
      <template v-else>
        <div class="flex flex-col items-center text-center">
          <div class="flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <svg class="h-10 w-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
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

const route = useRoute()
const router = useRouter()
const message = useMessage()
const user = useUser()

const loading = ref<boolean>(true)
const success = ref<boolean>(false)
const error = ref<string | null>(null)
const token = ref<string>('')

onMounted(() => {
  checkUserAndActivate()
})

const checkUserAndActivate = async () => {
  // Check if user is already logged in
  const isLoggedIn = user.isLoggedIn.value
  if (isLoggedIn) {
    message.success('你已登录，正在跳转至首页')
    router.replace('/')
    return
  }

  // Get activation token
  token.value = route.query.token as string

  if (!token.value) {
    error.value = '激活令牌丢失，请检查你的激活链接是否完整'
    loading.value = false
    return
  }

  await activateAccount()
}

const activateAccount = async () => {
  loading.value = true
  try {
    const { status, errors } = await api.get({
      url: '/api/user/register/',
      query: {
        token: token.value,
      },
    })
    
    const errorText = errors?.reduce((acc, cur) => acc + cur.err_msg, '')
    
    if (status === 200) {
      success.value = true
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

const retryActivation = () => {
  if (token.value) {
    activateAccount()
  } else {
    error.value = '激活令牌丢失，无法重试'
  }
}
</script>
