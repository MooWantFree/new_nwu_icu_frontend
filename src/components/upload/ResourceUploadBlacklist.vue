<template>
  <div class="space-y-5">
    <p v-if="error" role="alert" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
    <p v-if="message" role="status" class="text-sm text-emerald-700">{{ message }}</p>
    <div>
      <h3 class="text-sm font-semibold text-gray-800">已拉黑的文件夹</h3>
      <p v-if="loadingBlacklist" class="mt-3 text-sm text-gray-500">正在加载黑名单…</p>
      <ul v-else-if="paths.length" class="mt-3 divide-y divide-gray-200 rounded-lg border border-gray-200">
        <li v-for="path in paths" :key="path" class="flex items-center justify-between gap-3 px-3 py-2">
          <span class="min-w-0 break-all text-sm text-gray-700">{{ path }}</span>
          <button type="button" class="btn-secondary shrink-0 disabled:opacity-40" :disabled="busy" :aria-label="`解除黑名单 ${path}`" @click="updateBlacklist(path, 'remove')">解除</button>
        </li>
      </ul>
      <p v-else class="mt-3 text-sm text-gray-500">尚未设置黑名单。</p>
    </div>
    <div class="overflow-hidden rounded-lg border border-gray-200">
      <div class="flex flex-wrap items-center gap-3 border-b border-gray-200 bg-gray-50 p-3">
        <button type="button" class="text-link text-sm disabled:opacity-40" :disabled="loadingDirectories || currentPath === '/'" @click="loadDirectories('/')">根目录</button>
        <button type="button" class="text-link text-sm disabled:opacity-40" :disabled="loadingDirectories || currentPath === '/'" @click="loadDirectories(parentPath)">上一级</button>
        <span class="min-w-0 flex-1 break-all text-sm text-gray-600">{{ currentPath }}</span>
        <button type="button" class="text-link text-sm disabled:opacity-40" :disabled="loadingDirectories || busy" @click="refresh">刷新</button>
      </div>
      <p v-if="loadingDirectories" role="status" class="p-6 text-center text-sm text-gray-500">正在读取目录…</p>
      <p v-else-if="!directories.length" class="p-6 text-center text-sm text-gray-500">当前目录下没有子文件夹。</p>
      <ul v-else class="max-h-80 divide-y divide-gray-100 overflow-y-auto">
        <li v-for="directory in directories" :key="directory.path" class="flex items-center gap-3 px-3 py-2">
          <button type="button" class="flex min-w-0 flex-1 items-center gap-2 py-2 text-left text-sm text-blue-700 hover:underline" @click="loadDirectories(directory.path)">
            <Folder class="h-4 w-4 shrink-0" /><span class="break-all">{{ directory.name }}</span>
          </button>
          <span v-if="isBlocked(directory.path)" class="shrink-0 text-xs text-gray-500">{{ paths.includes(directory.path) ? '已拉黑' : '父文件夹已拉黑' }}</span>
          <button v-else type="button" class="btn-secondary shrink-0 disabled:opacity-40" :disabled="busy || loadingBlacklist" :aria-label="`拉黑 ${directory.path}`" @click="updateBlacklist(directory.path, 'add')">拉黑</button>
        </li>
      </ul>
    </div>
    <p class="text-xs text-gray-500">点击文件夹可查看下级目录。操作立即保存；解除父文件夹后，单独拉黑的子文件夹仍会受限。</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Folder } from 'lucide-vue-next'
import { api } from '@/lib/requests'
import type { APIResourceDirectories } from '@/types/api/resourceUpload'

const emit = defineEmits<{ (event: 'session-expired'): void }>()
const paths = ref<string[]>([])
const directories = ref<APIResourceDirectories['response']['directories']>([])
const currentPath = ref('/')
const parentPath = computed(() => currentPath.value.slice(0, currentPath.value.lastIndexOf('/')) || '/')
const loadingBlacklist = ref(true)
const loadingDirectories = ref(false)
const busy = ref(false)
const error = ref('')
const message = ref('')
const isBlocked = (path: string) => paths.value.some(blocked => path === blocked || path.startsWith(`${blocked}/`))
const checkResponse = (response: { status: number; errors?: { err_msg: string }[] }, fallback: string) => {
  if (response.status === 403) emit('session-expired')
  if (response.status !== 200) throw new Error(response.errors?.[0]?.err_msg || fallback)
}

const loadBlacklist = async () => {
  loadingBlacklist.value = true
  try {
    const response = await api.get({ url: '/api/management/uploads/blacklist/' })
    checkResponse(response, '黑名单加载失败，请刷新重试。')
    paths.value = response.content.paths
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : '黑名单加载失败，请刷新重试。'
  } finally { loadingBlacklist.value = false }
}

const loadDirectories = async (path: string) => {
  loadingDirectories.value = true
  try {
    const response = await api.get({ url: '/api/management/uploads/directories/', query: { path } })
    checkResponse(response, '目录加载失败，请刷新重试。')
    directories.value = response.content.directories
    currentPath.value = response.content.path
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : '目录加载失败，请刷新重试。'
  } finally { loadingDirectories.value = false }
}

const updateBlacklist = async (path: string, action: 'add' | 'remove') => {
  busy.value = true; error.value = ''; message.value = ''
  try {
    const response = await api.post({ url: '/api/management/uploads/blacklist/', query: { path, action } })
    checkResponse(response, '黑名单保存失败，请重试。')
    paths.value = response.content.paths
    message.value = action === 'add' ? '已拉黑，该文件夹及其子文件夹已对投稿用户隐藏。' : '已解除该条黑名单。'
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : '黑名单保存失败，请重试。'
  } finally { busy.value = false }
}

const refresh = async () => {
  error.value = ''; message.value = ''
  await Promise.all([loadBlacklist(), loadDirectories(currentPath.value)])
}
onMounted(refresh)
</script>
