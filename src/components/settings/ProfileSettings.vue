<!-- ProfileSettings.vue - User profile settings component -->
<!-- This component allows users to view and update their profile information -->
<template>
  <div class="max-w-2xl mx-auto">
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <div class="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 class="text-xl font-semibold mb-4">基本信息</h2>
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2" for="avatar">
            头像
          </label>
          <div class="flex flex-col items-center space-y-4">
            <div class="relative group">
              <img 
                :src="`/api/download/${formData.avatar_uuid}`" 
                alt="Avatar" 
                class="w-24 h-24 rounded-full object-cover transition-all duration-300 group-hover:opacity-75"
              >
              <div 
                class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                @click="showImageUpload = true"
              >
                <span class="text-white text-sm font-medium">更改头像</span>
              </div>
            </div>
          </div>
          <p v-if="errors.avatar_uuid" class="text-red-500 text-xs italic mt-2">
            {{ errors.avatar_uuid }}
          </p>
          <ImageUpload
            @close="showImageUpload = false"
            @upload="handleImageUpload"
            v-if="showImageUpload"
          />
        </div>
        <div class="mb-4">
          <label
            class="block text-gray-700 text-sm font-bold mb-2"
            for="username"
          >
            用户名
          </label>
          <input
            id="username"
            v-model="formData.username"
            type="text"
            disabled
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-100"
          />
        </div>
        <div class="mb-4">
          <label
            class="block text-gray-700 text-sm font-bold mb-2"
            for="nickname"
          >
            昵称
          </label>
          <input
            id="nickname"
            v-model="formData.nickname"
            type="text"
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            :class="{ 'border-red-500': errors.nickname }"
          />
          <p v-if="errors.nickname" class="text-red-500 text-xs italic">
            {{ errors.nickname }}
          </p>
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2" for="bio"
            >个人简介</label
          >
          <textarea
            id="bio"
            v-model="formData.bio"
            rows="3"
            maxlength="255"
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            :class="{ 'border-red-500': errors.bio }"
          ></textarea>
          <p v-if="errors.bio" class="text-red-500 text-xs italic">
            {{ errors.bio }}
          </p>
          <p class="text-gray-500 text-xs mt-1">
            {{ formData.bio?.length || 0 }}/255
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
import { APIUserProfile } from '@/types/api/user/profilePage'
import { ref } from 'vue'
import { APIUpdateProfileBody } from '@/types/api/user/profilePage'
import { z } from 'zod'
import { useMessage } from 'naive-ui'
import { LoaderCircle } from 'lucide-vue-next'
import { api } from '@/lib/requests'
import ImageUpload from '../tiptap/editor/ImageUpload.vue'

type ErrorsProfile = {
  nickname: string
  avatar_uuid: string
  username: string
  bio: string
}
type FormData = z.infer<typeof APIUpdateProfileBody>

const { userInfo } = defineProps<{
  userInfo: APIUserProfile['response']
}>()

const message = useMessage()
const errors = ref<ErrorsProfile>({
  nickname: '',
  avatar_uuid: '',
  username: '',
  bio: '',
})
const formData = ref<FormData>({
  nickname: userInfo.nickname,
  avatar_uuid: userInfo.avatar,
  username: userInfo.username,
  bio: userInfo.bio,
})
const showImageUpload = ref(false)
const handleImageUpload = (url: string) => {
  formData.value.avatar_uuid = url.split('/')[3]
  showImageUpload.value = false
  message.success('头像上传成功，记得还要点击保存哦')
}

const isSubmitting = ref(false)

const validateForm = () => {
  errors.value = {
    nickname: '',
    avatar_uuid: '',
    username: '',
    bio: '',
  }
  try {
    APIUpdateProfileBody.parse(formData.value)
    return true
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        if (err.path[0] in errors.value) {
          errors.value[err.path[0] as keyof ErrorsProfile] = err.message
        }
      })
    }
  }
  return false
}

const handleSubmit = async () => {
  if (isSubmitting.value) return
  if (!validateForm()) return

  isSubmitting.value = true
  try {
    const resp = await api.post({
      url: '/api/user/profile/',
      query: formData.value,
    })
    if (resp.status !== 200) throw new Error('Failed to update profile')
    message.success('个人资料更新成功')
  } catch (error) {
    message.error('更新个人资料失败')
    console.error('Error updating profile:', error)
  } finally {
    isSubmitting.value = false
  }
}
</script>
