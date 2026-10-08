<template>
  <main class="min-h-[calc(100vh-7rem)] bg-zinc-50 text-zinc-950">
    <div class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div class="mb-6 flex items-center gap-2 text-sm text-zinc-500">
        <UserRound class="h-4 w-4" aria-hidden="true" />
        <span>个人资料</span>
      </div>
      <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <aside class="min-w-0 lg:sticky lg:top-24">
          <UserInfo :userInfo="userInfo" />
        </aside>
        <div class="min-w-0">
          <History :id="realId" />
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useMessage } from 'naive-ui'
import { UserRound } from 'lucide-vue-next'
import type { APIUserProfile, APIUserProfileGivenId } from '@/types/api/user/profilePage'
import UserInfo from '@/components/user/profilePage/UserInfo.vue'
import History from '@/components/user/profilePage/History.vue'
import { api } from '@/lib/requests'

const { id } = defineProps<{
  id: string
}>()

const message = useMessage()
const userInfo = ref<APIUserProfile['response'] | APIUserProfileGivenId['response'] | null>(null)

const realId = computed(() => {
  return id === 'me' ? userInfo.value?.id.toString() : id
})

const fetchUserData = async (userId: string, isCurrent: () => boolean) => {
  try {
    let numberId: number
    if (userId !== 'me') {
      numberId = parseInt(userId)
      const resp = await api.get({
        url: '/api/user/profile/:id/',
        params: { id: numberId },
      })
      if (!isCurrent()) return
      if (resp.status === 200) {
        userInfo.value = resp.content
      } else {
        throw new Error('获取用户信息失败，请稍后重试')
      }
    } else {
      const resp = await api.get({ url: '/api/user/profile/' })
      if (!isCurrent()) return
      if (resp.status === 200 && resp.content.is_me) {
        userInfo.value = resp.content
      } else {
        throw new Error('获取用户信息失败，请稍后重试')
      }
    }
  } catch (error) {
    if (isCurrent()) message.error('获取用户信息失败，请稍后重试')
  }
}

watch(() => id, (userId, _oldId, onCleanup) => {
  let current = true
  onCleanup(() => { current = false })
  userInfo.value = null
  void fetchUserData(userId, () => current)
}, { immediate: true })
</script>
