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
      <div v-if="!userInfo" role="status" aria-busy="true" class="flex min-h-32 items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white px-5 py-10 text-sm text-zinc-500 shadow-sm">
        <LoaderCircle class="h-5 w-5 shrink-0 animate-spin text-zinc-400" aria-hidden="true" />
        <p>加载中，请稍候...</p>
      </div>
      <div v-else class="grid min-w-0 gap-6 md:grid-cols-[200px_minmax(0,1fr)]">
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
    </div>
  </main>
</template>

<script setup lang="ts">
import { useUser } from '@/lib/useUser'
import { ArrowLeft, KeyRound, LoaderCircle, Mail, Shield, UserRound } from 'lucide-vue-next'

const tabs = [
  { name: 'profileSettings', label: '个人资料', icon: UserRound },
  { name: 'emailSettings', label: '邮箱设置', icon: Mail },
  { name: 'passwordSettings', label: '密码设置', icon: KeyRound },
  { name: 'privateSettings', label: '隐私设置', icon: Shield },
]

const { userInfo } = useUser()
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
