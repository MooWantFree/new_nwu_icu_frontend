<template>
  <div class="max-w-2xl mx-auto">
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <div class="bg-white px-8 pt-6 pb-8 mb-4">
        <h2 class="text-xl font-semibold mb-4">修改密码</h2>
        <div class="mb-4">
          <label
            class="block text-gray-700 text-sm font-bold mb-2"
            for="old_password"
          >
            当前密码
          </label>
          <input
            id="old_password"
            v-model="formData.old_password"
            type="password"
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            :class="{ 'border-red-500': errors.old_password }"
          />
          <p v-if="errors.old_password" class="text-red-500 text-xs italic">
            {{ errors.old_password }}
          </p>
        </div>
        <div class="mb-4">
          <label
            class="block text-gray-700 text-sm font-bold mb-2"
            for="new_password"
          >
            新密码
          </label>
          <input
            id="new_password"
            v-model="formData.new_password"
            type="password"
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            :class="{ 'border-red-500': errors.new_password }"
          />
          <p v-if="errors.new_password" class="text-red-500 text-xs italic">
            {{ errors.new_password }}
          </p>
        </div>
        <div class="mb-4">
          <label
            class="block text-gray-700 text-sm font-bold mb-2"
            for="confirm_password"
          >
            确认新密码
          </label>
          <input
            id="confirm_password"
            v-model="formData.confirm_password"
            type="password"
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            :class="{ 'border-red-500': errors.confirm_password }"
          />
          <p v-if="errors.confirm_password" class="text-red-500 text-xs italic">
            {{ errors.confirm_password }}
          </p>
        </div>
      </div>
      <div class="flex justify-end">
        <button
          type="submit"
          class="flex items-center justify-center px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
          :disabled="isSubmitting"
        >
          <LoaderCircle
            v-if="isSubmitting"
            class="w-5 h-5 mr-2 text-white animate-spin"
          />
          <p>{{ isSubmitting ? '保存中...' : '保存更改' }}</p>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { z } from 'zod'
import { useMessage } from 'naive-ui'
import { LoaderCircle } from 'lucide-vue-next'
import { api } from '@/lib/requests'
import { APIUserResetPasswordQuery } from '@/types/api/user/resetPassword'
import { useUser } from '@/lib/useUser'
import { useRouter } from 'vue-router'

const message = useMessage()
const user = useUser()
const router = useRouter()

interface ErrorsPassword {
  old_password: string
  new_password: string
  confirm_password: string
}

type FormData = z.infer<typeof APIUserResetPasswordQuery>

const errors = ref<ErrorsPassword>({
  old_password: '',
  new_password: '',
  confirm_password: '',
})

const formData = ref<FormData>({
  old_password: '',
  new_password: '',
  confirm_password: '',
})

const isSubmitting = ref(false)

const handleSubmit = async () => {
  errors.value = {
    old_password: '',
    new_password: '',
    confirm_password: '',
  }

  try {
    APIUserResetPasswordQuery.parse(formData.value)

    isSubmitting.value = true

    const resp = await api.post({
      url: '/api/user/reset-login/',
      query: formData.value,
    })

    if (resp.status !== 200) throw new Error('Failed to update password')
    message.success('密码修改成功，请重新登录')
    user.logout()
    formData.value = {
      old_password: '',
      new_password: '',
      confirm_password: '',
    }
    router.push('/')
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        if (err.path) {
          errors.value[err.path[0] as keyof ErrorsPassword] = err.message
        }
      })
    } else {
      message.error('密码修改失败，请稍后重试')
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>
