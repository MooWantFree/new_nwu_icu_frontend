<template>
  <div class="h-full min-w-0 overflow-hidden bg-slate-50 p-3 sm:p-4">
    <section class="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header class="flex min-h-20 items-center justify-between gap-4 border-b border-slate-200 px-5 sm:px-6">
        <div class="flex min-w-0 items-center gap-3">
          <div class="rounded-xl bg-blue-50 p-2.5 text-blue-700">
            <Bell class="h-5 w-5" aria-hidden="true" />
          </div>
          <div class="min-w-0">
            <h1 class="text-xl font-bold tracking-tight text-slate-900">系统通知</h1>
            <p class="mt-1 text-xs text-slate-500">账户动态与全站公告</p>
          </div>
        </div>
        <button type="button" aria-label="刷新系统通知" @click="fetchSystemNotifications" :disabled="loading" class="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
          <span class="hidden sm:inline">刷新</span>
        </button>
      </header>

      <div class="min-h-0 flex-1 overflow-y-auto bg-slate-50/70 p-3 sm:p-5">
        <div v-if="loading" class="flex h-full items-center justify-center">
          <div class="text-center">
            <LoaderCircle class="mx-auto h-9 w-9 animate-spin text-blue-700" />
            <p class="mt-3 text-sm text-slate-500">正在加载通知…</p>
          </div>
        </div>

        <div v-else class="mx-auto max-w-4xl space-y-7">
          <section aria-labelledby="personal-notifications-title">
            <div class="mb-3 flex items-center gap-2 px-1">
              <Bell class="h-4 w-4 text-blue-700" />
              <h2 id="personal-notifications-title" class="text-sm font-semibold text-slate-700">个人通知</h2>
              <span class="text-xs text-slate-400">{{ personalNotifications.length }}</span>
            </div>
            <div v-if="personalNotifications.length" class="space-y-3">
              <article v-for="notification in personalNotifications" :key="`personal-${notification.id}`" class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md sm:p-5">
                <div class="flex min-w-0 items-start gap-3">
                  <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <Bell class="h-5 w-5" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <h3 class="break-words font-semibold text-slate-900 [overflow-wrap:anywhere]">{{ notification.title }}</h3>
                      <Time class="shrink-0" :time="notification.datetime" />
                    </div>
                    <p class="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600 [overflow-wrap:anywhere]">{{ notification.content }}</p>
                  </div>
                </div>
              </article>
            </div>
            <div v-else class="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-400">暂无个人通知</div>
          </section>

          <section aria-labelledby="bulletins-title">
            <div class="mb-3 flex items-center gap-2 px-1">
              <Megaphone class="h-4 w-4 text-blue-700" />
              <h2 id="bulletins-title" class="text-sm font-semibold text-slate-700">全站公告</h2>
              <span class="text-xs text-slate-400">{{ bulletins.length }}</span>
            </div>
            <div v-if="bulletins.length" class="space-y-3">
              <article v-for="bulletin in bulletins" :key="`${bulletin.title}-${bulletin.update_time}`" class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md sm:p-5">
                <div class="flex min-w-0 items-start gap-3">
                  <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                    <Megaphone class="h-5 w-5" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <h3 class="break-words font-semibold text-slate-900 [overflow-wrap:anywhere]">{{ bulletin.title }}</h3>
                      <Time class="shrink-0" :time="bulletin.update_time" />
                    </div>
                    <p class="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600 [overflow-wrap:anywhere]">{{ bulletin.content }}</p>
                  </div>
                </div>
              </article>
            </div>
            <div v-else class="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-400">暂无全站公告</div>
          </section>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import { api } from '@/lib/requests'
import Time from '@/components/tinyComponents/Time.vue'
import { Bell, LoaderCircle, Megaphone, RefreshCw } from 'lucide-vue-next'

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
