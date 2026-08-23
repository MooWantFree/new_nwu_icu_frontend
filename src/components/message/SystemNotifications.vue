<template>
  <div class="flex flex-col h-full">
    <div class="p-4 border-b">
      <h2 class="text-lg font-semibold">系统通知</h2>
    </div>
    <div class="flex-grow overflow-y-auto">
      <div v-if="loading" class="p-4">
        <n-skeleton text :repeat="5" />
      </div>
      <template v-else>
        <div class="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50">个人通知</div>
        <div
          v-for="notification in personalNotifications"
          :key="`personal-${notification.id}`"
          class="p-4 border-b hover:bg-gray-50"
        >
          <div class="flex items-start space-x-3">
            <n-avatar src="/path/to/system-icon.png" />
            <div class="flex-1">
              <div class="flex items-center justify-between">
                <span class="font-medium">{{ notification.title }}</span>
                <n-time
                  :time="new Date(notification.datetime)"
                  format="yyyy-MM-dd HH:mm"
                />
              </div>
              <p class="mt-1 text-sm text-gray-600">
                {{ notification.content }}
              </p>
            </div>
          </div>
        </div>
        <div v-if="!personalNotifications.length" class="p-4 text-center text-gray-500">暂无个人通知</div>

        <div class="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50">全站公告</div>
        <div
          v-for="bulletin in bulletins"
          :key="`${bulletin.title}-${bulletin.update_time}`"
          class="p-4 border-b hover:bg-gray-50"
        >
          <div class="flex items-start space-x-3">
            <n-avatar src="/path/to/system-icon.png" />
            <div class="flex-1">
              <div class="flex items-center justify-between">
                <span class="font-medium">{{ bulletin.title }}</span>
                <n-time :time="new Date(bulletin.update_time)" format="yyyy-MM-dd HH:mm" />
              </div>
              <p class="mt-1 text-sm text-gray-600">{{ bulletin.content }}</p>
            </div>
          </div>
        </div>
        <div v-if="!bulletins.length" class="p-4 text-center text-gray-500">暂无全站公告</div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import { api } from '@/lib/requests'

interface Bulletin {
  title: string
  content: string
  update_time: string
}

const message = useMessage()
const loading = ref(true)
const personalNotifications = ref<Array<{
  id: number
  title: string
  content: string
  datetime: string
}>>([])
const bulletins = ref<Bulletin[]>([])
const fetchSystemNotifications = async () => {
  try {
    loading.value = true
    const [notificationResponse, bulletinResponse] = await Promise.all([
      api.get({ url: '/api/message/system/', query: { page: 1 } }),
      api.get({ url: '/api/bulletins/' }),
    ])
    if (notificationResponse.status !== 200 || bulletinResponse.status !== 200) {
      throw new Error('Failed to fetch system notifications')
    }
    personalNotifications.value = notificationResponse.content.results
    bulletins.value = bulletinResponse.content.bulletin_list
    if (personalNotifications.value.length) {
      await api.post({
        url: '/api/message/notifications/read/',
        query: { ids: personalNotifications.value.map(item => item.id) },
      })
    }
  } catch (error) {
    message.error('获取系统通知失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchSystemNotifications()
})
</script>
