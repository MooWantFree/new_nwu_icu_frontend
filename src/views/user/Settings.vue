<template>
  <main class="min-h-[calc(100vh-7rem)] bg-zinc-50 text-zinc-950">
    <div class="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <header class="mb-8">
        <nav aria-label="面包屑" class="mb-5 flex items-center gap-2 text-sm text-zinc-500">
          <RouterLink to="/user/me" class="inline-flex items-center gap-1.5 rounded-md transition-colors hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2">
            <ArrowLeft class="h-4 w-4" aria-hidden="true" />
            个人资料
          </RouterLink>
          <span aria-hidden="true">/</span>
          <span class="text-zinc-700">用户设置</span>
        </nav>
        <h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">用户设置</h1>
      </header>
      <LoadError v-if="profileError" class="mb-5" :message="profileError" :busy="isLoading" @retry="fetchUserInfo" />
      <div v-if="!userInfo && !profileError && isLoading" class="grid gap-6 md:grid-cols-[200px_minmax(0,1fr)]">
        <LoadingSkeleton label="正在加载设置菜单" :rows="4" />
        <LoadingSkeleton label="正在加载个人设置" variant="form" />
      </div>
      <div v-else-if="userInfo" class="grid min-w-0 gap-6 md:grid-cols-[200px_minmax(0,1fr)]">
        <nav aria-label="用户设置" class="min-w-0 self-start rounded-xl border border-zinc-200 bg-white p-2 shadow-sm">
          <div class="grid grid-cols-2 gap-1 p-1 md:flex md:flex-col">
            <RouterLink
              v-for="tab in tabs"
              :key="tab.name"
              :to="{ name: tab.name }"
              :aria-current="$route.name === tab.name ? 'page' : undefined"
              :class="[
                'inline-flex min-h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-400',
                $route.name === tab.name
                  ? 'bg-zinc-100 text-zinc-950'
                  : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-950',
              ]"
            >
              <component :is="tab.icon" class="h-4 w-4 shrink-0" aria-hidden="true" />
              {{ tab.label }}
            </RouterLink>
          </div>
        </nav>
        <div class="min-w-0">
          <RouterView v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" :userInfo="userInfo" />
            </transition>
          </RouterView>
        </div>
      </div>
      <LoadError v-else-if="!profileError" message="请登录后查看设置" :retryable="false">
        <RouterLink :to="{ path: '/login', query: { redirect: $route.fullPath } }" class="rounded-md px-4 py-2 text-sm underline">登录或注册</RouterLink>
      </LoadError>
    </div>
  </main>
</template>

<script setup lang="ts">
import { useUser } from '@/lib/useUser'
import { ArrowLeft, KeyRound, Mail, Shield, UserRound } from 'lucide-vue-next'
import LoadingSkeleton from '@/components/common/LoadingSkeleton.vue'
import LoadError from '@/components/common/LoadError.vue'

const tabs = [
  { name: 'profileSettings', label: '个人资料', icon: UserRound },
  { name: 'emailSettings', label: '邮箱设置', icon: Mail },
  { name: 'passwordSettings', label: '密码设置', icon: KeyRound },
  { name: 'privateSettings', label: '隐私设置', icon: Shield },
]

const { userInfo, isLoading, profileError, fetchUserInfo } = useUser()
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
