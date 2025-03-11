<template>
  <div class="min-h-screen bg-gray-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        {{ linkSent ? '重置链接已发送' : '忘记密码？' }}
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        {{ linkSent ? '请检查您的电子邮件以重置密码' : '输入您的电子邮件地址，我们将向您发送重置密码的链接。' }}
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">

        <div v-if="errorMessage" class="rounded-md bg-red-50 p-4 mb-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <WarningOutline class="w-6 h-6"/>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">
                {{ errorMessage }}
              </h3>
            </div>
          </div>
        </div>

        <form v-if="!linkSent" class="space-y-6" @submit.prevent="handleSubmit">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">
              电子邮件地址
            </label>
            <div class="mt-1">
              <input id="email" name="email" type="email" autocomplete="email" required v-model="email"
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
          </div>

          <div>
            <label for="captcha" class="block text-sm font-medium text-gray-700">
              验证码
            </label>
            <div class="mt-1 flex items-center space-x-2">
              <input id="captcha" name="captcha" type="text" required v-model="captchaValue"
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              <div v-if="isLoadingCaptcha" class="h-10 w-32 bg-gray-200 animate-pulse rounded"></div>
              <img v-else :src="captchaImageUrl" alt="Captcha" @click="getCaptcha"
                class="h-10 w-32 object-contain bg-gray-100 cursor-pointer" />
            </div>
          </div>
          <div>
            <button type="submit" :disabled="isLoading"
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
              {{ isLoading ? '发送中...' : '发送重置链接' }}
            </button>
          </div>
        </form>

        <div v-else class="text-center">
          <p class="mb-4">我们已经向{{ ` ${email} ` }}发了送一封包含重置密码链接的电子邮件</p>
          <p class="mb-4">如果您没有收到邮件，请检查您的垃圾邮件文件夹或重试</p>
          <button @click="resetForm"
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            重新发送链接
          </button>
        </div>

        <div class="mt-6">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white text-gray-500">
                或者
              </span>
            </div>
          </div>

          <div class="mt-6">
            <div class="text-center">
              <router-link to="/" class="font-medium text-blue-600 hover:text-blue-500">
                返回首页
              </router-link>
            </div>
          </div>
          <!-- TODO: 要不要加一个`联系管理员`的指引？ -->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { api } from '@/lib/requests'
import { WarningOutline } from '@vicons/ionicons5'


const router = useRouter()
const message = useMessage()

const email = ref('')
const isLoading = ref(false)
const linkSent = ref(false)
const captchaImageUrl = ref('')
const captchaKey = ref('')
const captchaValue = ref('')
const isLoadingCaptcha = ref(true)
const errorMessage = ref('')

const getCaptcha = async () => {
  isLoadingCaptcha.value = true
  try {
    const { status, data, content } = await api.get({url: '/api/captcha/'})
    if (status === 200) {
      captchaImageUrl.value = content.image_url
      captchaKey.value = content.key
      captchaValue.value = '' // Clear previous captcha value
    } else {
      message.error('获取验证码失败，请重试')
    }
  } catch (error) {
    console.error('error: ', error)
    message.error('获取验证码时发生错误，请重试')
  } finally {
    isLoadingCaptcha.value = false
  }
}

onMounted(async () => {
  await getCaptcha()
})

const handleSubmit = async () => {
  if (isLoadingCaptcha.value) {
    return // Prevent submission if captcha is still loading
  }

  isLoading.value = true
  errorMessage.value = '' // Clear previous error message

  try {
    const { status, data, content } = await api.post(
      {url: '/api/user/reset/',
        query: {
          email: email.value,
          captcha_key: captchaKey.value,
          captcha_value: captchaValue.value
        }
      },
    )
    if (status === 200) {
      linkSent.value = true
    } else {
      // TODO: Handle error: if more than one error
      if (data.errors?.find(it=>it.field==='captcha')) {
        errorMessage.value = data.errors.find(it=>it.field==='captcha')?.err_msg!
      } else if (data.errors?.find(it=>it.field==='email')) {
        errorMessage.value = '邮箱不存在'
      } else {
        throw new Error(JSON.stringify(data.errors))
      }
      getCaptcha() // Refresh captcha if submission fails
    }
  } catch (error) {
    console.error('error: ', error)
    errorMessage.value = '发生意外错误。请稍后重试'
    getCaptcha() // Refresh captcha if submission fails
  } finally {
    isLoading.value = false
  }
}

const resetForm = () => {
  linkSent.value = false
  email.value = ''
  captchaValue.value = ''
  errorMessage.value = ''
  getCaptcha()
}

</script>
