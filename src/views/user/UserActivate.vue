<template>
  <div
    class="flex min-h-[80dvh] flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8"
  >
    <div class="mx-auto max-w-md text-center">
      <!-- Loading state -->
      <div v-if="loading">
        <!-- Add a loading spinner or icon here -->
        <div class="mx-auto h-12 w-12 text-blue-500">
          <div
            class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"
          ></div>
        </div>
        <p class="mt-4 text-muted-foreground">正在激活...</p>
      </div>

      <!-- Success state -->
      <template v-else-if="success">
        <div class="mx-auto h-12 w-12 text-green-500" />
        <h1 class="mt-4 text-3xl font-bold tracking-tight text-foreground">
          邮箱验证成功
        </h1>
        <p class="mt-4 text-muted-foreground">
          恭喜，邮箱地址已成功验证，可以跳转到首页完成登录。
        </p>
        <div class="mt-6">
          <router-link
            to="/"
            class="inline-flex items-center rounded-md bg-green-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            前往首页
          </router-link>
        </div>
      </template>

      <!-- Error state -->
      <template v-else>
        <div class="mx-auto h-12 w-12 text-red-500">
          <!-- Add an error icon here -->
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 class="mt-4 text-3xl font-bold tracking-tight text-foreground">
          验证失败
        </h1>
        <p class="mt-4 text-muted-foreground">
          {{ error }}
        </p>
        <div class="mt-6">
          <router-link
            to="/"
            class="inline-flex items-center rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            返回首页
          </router-link>
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

onMounted(async () => {
  // Check if user is already logged in
  const isLoggedIn = user.isLoggedIn.value
  if (isLoggedIn) {
    message.success('已经登录，即将跳转至首页')
    router.replace('/') // Redirect to home page if already logged in
    return
  }

  // Process activation process
  const token = route.query.token

  if (!token) {
    error.value = '激活令牌丢失'
    loading.value = false
    return
  }

  try {
    const { status, errors } = await api.get(
      `/api/user/register/?token=${token}`
    )
    const errorText = errors?.reduce((acc, cur) => acc + cur.err_msg, '')
    if (status === 200) {
      success.value = true
    } else {
      error.value = errorText || '账户激活失败。请重试或联系支持。'
    }
  } catch (err) {
    error.value = '发生错误。请稍后再试。'
  } finally {
    loading.value = false
  }
})
</script>
