<template>
  <div class="flex flex-col h-full">
    <div class="p-4 border-b">
      <h2 class="text-lg font-semibold">系统通知</h2>
    </div>
    <div class="flex-grow overflow-y-auto">
      <div v-if="loading" class="p-4">
        <n-skeleton text :repeat="5" />
      </div>
      <template v-else-if="systemNotifications.length">
        <div
          v-for="notification in systemNotifications"
          :key="`${notification.title}-${notification.update_time}`"
          class="p-4 border-b hover:bg-gray-50"
        >
          <div class="flex items-start space-x-3">
            <n-avatar src="/path/to/system-icon.png" />
            <div class="flex-1">
              <div class="flex items-center justify-between">
                <span class="font-medium">{{ notification.title }}</span>
                <n-time
                  :time="new Date(notification.update_time)"
                  format="yyyy-MM-dd HH:mm"
                />
              </div>
              <p class="mt-1 text-sm text-gray-600">
                {{ notification.content }}
              </p>
            </div>
          </div>
        </div>
      </template>
      <div v-else class="p-4 text-center text-gray-500">暂无系统通知</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import { api } from '@/lib/requests'

interface SystemNotification {
  title: string
  content: string
  update_time: string
}

const message = useMessage()
const loading = ref(true)
const systemNotifications = ref<SystemNotification[]>([])
const fetchSystemNotifications = async () => {
  try {
    loading.value = true
    const response = await api.get({ url: '/api/bulletins/' })
    if (response.status !== 200) throw new Error('Failed to fetch bulletins')
    systemNotifications.value = response.content.bulletin_list
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
