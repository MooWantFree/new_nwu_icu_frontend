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
          :key="notification.id"
          class="p-4 border-b hover:bg-gray-50"
        >
          <div class="flex items-start space-x-3">
            <n-avatar src="/path/to/system-icon.png" />
            <div class="flex-1">
              <div class="flex items-center justify-between">
                <span class="font-medium">系统通知</span>
                <n-time
                  :time="new Date(notification.timestamp)"
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
    <n-pagination
      v-if="totalCount > 0"
      v-model:page="currentPage"
      :page-count="totalPages"
      :on-update:page="handlePageChange"
      class="p-4"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useMessage } from 'naive-ui'
import { api } from '@/lib/requests'

interface SystemNotification {
  id: number
  content: string
  timestamp: string
}

const message = useMessage()
const loading = ref(true)
const systemNotifications = ref<SystemNotification[]>([])
const currentPage = ref(1)
const totalCount = ref(0)
const pageSize = 20

const totalPages = computed(() => Math.ceil(totalCount.value / pageSize))

const fetchSystemNotifications = async (page: number) => {
  try {
    loading.value = true
    const response = await api.get(`/system-notifications?page=${page}`)
    systemNotifications.value = response.data.results
    totalCount.value = response.data.count
  } catch (error) {
    message.error('获取系统通知失败')
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchSystemNotifications(page)
}

onMounted(() => {
  fetchSystemNotifications(currentPage.value)
})
</script>
