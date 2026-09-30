<template>
  <div class="container mx-auto px-4 py-8 min-h-screen">
    <div class="flex flex-col lg:flex-row gap-8">
      <div class="w-full lg:w-1/3">
        <UserInfo :userInfo="userInfo" class="sticky top-8" />
      </div>
      <div class="w-full lg:w-2/3">
        <History :userInfo="userInfo" :id="realId" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useMessage } from 'naive-ui'
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
