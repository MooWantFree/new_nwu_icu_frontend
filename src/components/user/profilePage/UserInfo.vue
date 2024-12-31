<template>
  <!-- Skeleton -->
  <template v-if="!userInfo">
    <div class="bg-white shadow overflow-hidden sm:rounded-lg animate-pulse">
      <div class="px-4 py-5 sm:px-6 flex items-center">
        <div class="h-24 w-24 bg-gray-200 rounded-full"></div>
        <div class="ml-6">
          <div class="h-8 w-48 bg-gray-200 rounded"></div>
          <div class="h-4 w-32 bg-gray-200 rounded mt-2"></div>
        </div>
      </div>
      <div class="border-t border-gray-200 px-4 py-5 sm:px-6">
        <div class="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
          <div class="sm:col-span-2">
            <div class="h-4 w-16 bg-gray-200 rounded mb-2"></div>
            <div class="h-4 w-3/4 bg-gray-200 rounded"></div>
          </div>
          <div class="sm:col-span-1">
            <div class="h-4 w-16 bg-gray-200 rounded mb-2"></div>
            <div class="h-4 w-48 bg-gray-200 rounded"></div>
          </div>
          <div class="sm:col-span-1">
            <div class="h-4 w-16 bg-gray-200 rounded mb-2"></div>
            <div class="h-4 w-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  </template>

  <div v-else class="bg-white shadow overflow-hidden sm:rounded-lg">
    <!-- Profile header -->
    <div class="px-4 py-5 sm:px-6">
  <div class="flex items-center mb-4">
    <img
      :src="`/api/download/${userInfo.avatar}`"
      :alt="userInfo.nickname"
      class="h-24 w-24 rounded-full object-cover"
    />
    <div class="ml-6">
      <h1 class="text-2xl font-bold text-gray-900">
        {{ userInfo.nickname }}
      </h1>
      <p class="text-sm text-gray-500">@{{ userInfo.username }}</p>
    </div>
  </div>
  <div class="flex justify-end">
    <button
      v-if="user.userInfo.value.id === userInfo.id"
      class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-300"
      @click="handleEdit"
    >
      编辑资料
    </button>
  </div>
</div>

    <!-- Profile content -->
    <div class="border-t border-gray-200 px-4 py-5 sm:px-6">
      <dl class="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
        <div class="sm:col-span-2">
          <dt class="text-sm font-medium text-gray-500">个人简介</dt>
          <dd class="mt-1 text-sm text-gray-900">
            {{ userInfo.bio || '暂无个人简介' }}
          </dd>
        </div>
        <div class="sm:col-span-1">
          <dt class="text-sm font-medium text-gray-500">电子邮箱</dt>
          <dd class="mt-1 text-sm text-gray-900">{{ userInfo.email }}</dd>
        </div>
        <div class="sm:col-span-1">
          <dt class="text-sm font-medium text-gray-500">注册时间</dt>
          <dd class="mt-1 text-sm text-gray-900">
            <Time :time="new Date(userInfo.date_joined)" />
          </dd>
        </div>
        <div class="sm:col-span-1">
          <dt class="text-sm font-medium text-gray-500">西北大学邮箱</dt>
          <dd class="mt-1 text-sm text-gray-900">
            {{ userInfo.nwu_email || '未提供' }}
          </dd>
        </div>
      </dl>
    </div>
  </div>
</template>

<script setup lang="ts">
import Time from '@/components/tinyComponents/Time.vue'
import type { APIUserProfile } from '@/types/api/user/profilePage'
import { useUser } from '@/lib/useUser'

const user = useUser()

defineProps<{
  userInfo: APIUserProfile['response'] | null
}>()

const handleEdit = () => {
  // TODO: Implement edit functionality
  console.log('Edit profile')
}
</script>
