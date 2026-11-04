<template>
  <main class="min-h-[calc(100vh-7rem)] bg-zinc-50 text-zinc-950">
    <div class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div class="mb-6 flex items-center gap-2 text-sm text-zinc-500">
        <UserRound class="h-4 w-4" aria-hidden="true" />
        <span>个人资料</span>
      </div>
      <LoadError v-if="loadError" :message="loadError" :retryable="!notFound && !loginRequired" :busy="loading" @retry="retryKey++">
        <RouterLink v-if="loginRequired" :to="{ path: '/login', query: { redirect: route.fullPath } }" class="rounded-md px-4 py-2 text-sm underline">登录或注册</RouterLink>
        <RouterLink to="/" class="rounded-md px-4 py-2 text-sm text-zinc-600 underline">返回首页</RouterLink>
      </LoadError>
      <div v-else class="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <aside class="min-w-0 lg:sticky lg:top-24">
          <UserInfo :userInfo="userInfo" />
        </aside>
        <div class="min-w-0">
          <History v-if="userInfo" :id="realId" />
          <LoadingSkeleton v-else label="正在加载个人动态" />
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import LoadError from '@/components/common/LoadError.vue'
import LoadingSkeleton from '@/components/common/LoadingSkeleton.vue'
import { UserRound } from 'lucide-vue-next'
import type { APIUserProfile, APIUserProfileGivenId } from '@/types/api/user/profilePage'
import UserInfo from '@/components/user/profilePage/UserInfo.vue'
import History from '@/components/user/profilePage/History.vue'
import { api } from '@/lib/requests'

const { id } = defineProps<{
  id: string
}>()

const loadError = ref('')
const notFound = ref(false)
const loginRequired = ref(false)
const route = useRoute()
const loading = ref(true)
const retryKey = ref(0)
const userInfo = ref<APIUserProfile['response'] | APIUserProfileGivenId['response'] | null>(null)

const realId = computed(() => {
  return id === 'me' ? userInfo.value?.id.toString() : id
})

const fetchUserData = async (userId: string, isCurrent: () => boolean) => {
  loading.value = true
  loadError.value = ''
  notFound.value = false
  loginRequired.value = false
  try {
    const resp = userId !== 'me'
      ? await api.get({
        url: '/api/user/profile/:id/',
        params: { id: Number(userId) },
      })
      : await api.get({ url: '/api/user/profile/' })
    if (!isCurrent()) return
    if (resp.status === 401) {
      loginRequired.value = true
      loadError.value = '请登录后查看个人资料'
    } else if (resp.status === 404 || resp.errors?.some(error => error.err_code === 'user_not_exist')) {
      notFound.value = true
      loadError.value = '用户不存在'
    } else if (resp.status === 200) {
      userInfo.value = resp.content
    } else {
      throw new Error('profile unavailable')
    }
  } catch {
    if (isCurrent()) loadError.value = '个人资料加载失败，请重试'
  } finally {
    if (isCurrent()) loading.value = false
  }
}

watch([() => id, retryKey], ([userId], _oldId, onCleanup) => {
  let current = true
  onCleanup(() => { current = false })
  userInfo.value = null
  void fetchUserData(userId, () => current)
}, { immediate: true })
</script>
