<template>
  <div class="container mx-auto px-4 py-8 min-h-screen">
    <div class="flex flex-col lg:flex-row gap-8">
      <div class="w-full lg:w-1/3">
        <UserInfo :userInfo="userInfo" class="sticky top-8" />
      </div>
      <div class="w-full lg:w-2/3">
        <History :userInfo="userInfo" :id="id" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useMessage } from 'naive-ui'
import { APIUserProfileFromId } from '@/types/api/user/profilePage'
import UserInfo from '@/components/user/profilePage/UserInfo.vue'
import History from '@/components/user/profilePage/History.vue'
import { api } from '@/lib/requests'

const { id } = defineProps<{
  id: string
}>()

const message = useMessage()
const userInfo = ref<APIUserProfileFromId['response'] | null>(null)

watch(
  () => id,
  async () => {
    await fetchUserData()
  },
  { immediate: true }
)

const fetchUserData = async () => {
  try {
    let numberId: number
    if (id !== 'me') {
      numberId = parseInt(id)
      const resp = await api.get({
        url: '/api/user/profile/:id/',
        params: { id: numberId },
      })
      if (resp.status === 200) {
        userInfo.value = resp.content
      } else {
        throw new Error('获取用户信息失败，请稍后重试')
      }
    } else {
      const resp = await api.get({ url: '/api/user/profile/' })
      if (resp.status === 200 && resp.content.is_me) {
        userInfo.value = resp.content
      } else {
        throw new Error('获取用户信息失败，请稍后重试')
      }
    }
  } catch (error) {
    message.error('获取用户信息失败，请稍后重试')
  }
}

onMounted(async () => {
  await fetchUserData()
})
</script>
