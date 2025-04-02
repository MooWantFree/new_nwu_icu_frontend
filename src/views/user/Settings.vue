<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl min-h-svh">
    <h1 class="text-3xl font-bold mb-8 text-gray-800">用户设置</h1>
    <div v-if="isLoading || !userInfo" class="flex justify-center items-center h-64">
      <LoaderCircle class="animate-spin h-16 w-16 text-blue-500" />
      <p class="text-gray-600">加载中，请稍候...</p>
    </div>
    <div v-else class="bg-white shadow-md rounded-lg overflow-hidden flex">
      <nav class="w-1/4 border-r border-gray-200">
        <router-link
          v-for="tab in tabs"
          :key="tab.name"
          :to="{ name: tab.name }"
          :class="[
            $route.name === tab.name
              ? 'bg-blue-50 border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50',
            'block py-4 px-4 border-l-4 font-medium text-sm transition-colors duration-200',
          ]"
        >
          {{ tab.label }}
        </router-link>
      </nav>
      <div class="w-3/4 p-6">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" :userInfo="userInfo" />
          </transition>
        </router-view>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUser } from '@/lib/useUser'
import { LoaderCircle } from 'lucide-vue-next'

const tabs = [
  { name: 'profileSettings', label: '个人资料' },
  { name: 'emailSettings', label: '邮箱设置' },
  { name: 'passwordSettings', label: '密码设置' },
  { name: 'privateSettings', label: '隐私设置' },
]

const { isLoading, userInfo } = useUser()
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
