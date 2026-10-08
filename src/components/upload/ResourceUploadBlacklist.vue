<template>
  <div class="space-y-5 text-zinc-950">
    <div v-if="error" role="alert" class="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><p>{{ error }}</p></div>
    <div v-if="message" role="status" class="flex items-start gap-2.5 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700"><CheckCircle2 class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><p>{{ message }}</p></div>
    <section class="overflow-hidden rounded-lg border border-zinc-200 bg-white" aria-label="禁止投稿的文件夹">
      <div class="border-b border-zinc-200 p-4"><h3 class="text-sm font-semibold tracking-tight">禁止投稿的文件夹</h3><p class="mt-2 text-xs leading-5 text-zinc-500">仅限制投稿；公开浏览、搜索和下载由“资料管理 → 访问权限”单独控制。</p></div>
      <p v-if="loadingBlacklist" role="status" class="flex items-center justify-center gap-2 p-6 text-sm text-zinc-500"><LoaderCircle class="h-4 w-4 animate-spin" aria-hidden="true" />正在加载黑名单…</p>
      <ul v-else-if="paths.length" class="divide-y divide-zinc-100">
        <li v-for="path in paths" :key="path" class="flex items-center justify-between gap-3 px-4 py-3">
          <span class="min-w-0 break-all text-sm text-zinc-700">{{ path }}</span>
          <button type="button" :class="outlineButtonClass" :disabled="busy" :aria-label="`解除黑名单 ${path}`" @click="updateBlacklist(path, 'remove')">解除</button>
        </li>
      </ul>
      <p v-else class="p-6 text-center text-sm text-zinc-500">尚未设置黑名单。</p>
    </section>
    <section class="overflow-hidden rounded-lg border border-zinc-200 bg-white" aria-label="选择黑名单目录">
      <div class="flex flex-wrap items-center gap-2 border-b border-zinc-200 bg-zinc-50/50 p-3">
        <button type="button" :class="ghostButtonClass" :disabled="loadingDirectories || busy || currentPath === '/'" @click="loadDirectories('/')"><House class="h-4 w-4" aria-hidden="true" />根目录</button>
        <button type="button" :class="ghostButtonClass" :disabled="loadingDirectories || busy || currentPath === '/'" @click="loadDirectories(parentPath)"><CornerLeftUp class="h-4 w-4" aria-hidden="true" />上一级</button>
        <span class="min-w-0 flex-1 break-all px-1 text-sm text-zinc-500">{{ currentPath }}</span>
        <button type="button" :class="outlineButtonClass" :disabled="loadingDirectories || busy" @click="refresh"><RefreshCw class="h-4 w-4" aria-hidden="true" />刷新</button>
      </div>
      <p v-if="loadingDirectories" role="status" class="flex items-center justify-center gap-2 p-8 text-sm text-zinc-500"><LoaderCircle class="h-4 w-4 animate-spin" aria-hidden="true" />正在读取目录…</p>
      <p v-else-if="!directories.length" class="p-8 text-center text-sm text-zinc-500">当前目录下没有子文件夹。</p>
      <ul v-else class="max-h-80 divide-y divide-zinc-100 overflow-y-auto overscroll-contain">
        <li v-for="directory in directories" :key="directory.path" class="flex items-center gap-3 px-4 py-2 hover:bg-zinc-50">
          <button type="button" :disabled="busy" class="flex min-h-10 min-w-0 flex-1 items-center gap-2.5 rounded-md py-2 text-left text-sm text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:opacity-40" @click="loadDirectories(directory.path)">
            <Folder class="h-4 w-4 shrink-0 fill-zinc-100 text-zinc-500" aria-hidden="true" /><span class="break-all">{{ directory.name }}</span>
          </button>
          <span v-if="isBlocked(directory.path)" class="shrink-0 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-500">{{ paths.includes(directory.path) ? '已拉黑' : '父文件夹已拉黑' }}</span>
          <button v-else type="button" :class="outlineButtonClass" :disabled="busy || loadingBlacklist" :aria-label="`拉黑 ${directory.path}`" @click="updateBlacklist(directory.path, 'add')">拉黑</button>
        </li>
      </ul>
    </section>
    <p class="text-xs leading-5 text-zinc-500">点击文件夹可查看下级目录。操作立即保存；解除父文件夹后，单独拉黑的子文件夹仍会受限。</p>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { AlertCircle, CheckCircle2, CornerLeftUp, Folder, House, LoaderCircle, RefreshCw } from 'lucide-vue-next'
import { api } from '@/lib/requests'
import type { APIResourceDirectories } from '@/types/api/resourceUpload'

const emit = defineEmits<{ (event: 'session-expired'): void }>()
const buttonClass = 'inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40'
const outlineButtonClass = `${buttonClass} border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-100`
const ghostButtonClass = `${buttonClass} text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950`
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
  if (busy.value) return
  busy.value = true; error.value = ''; message.value = ''
  try {
    const response = await api.post({ url: '/api/management/uploads/blacklist/', query: { path, action } })
    checkResponse(response, '黑名单保存失败，请重试。')
    paths.value = response.content.paths
    message.value = action === 'add' ? '已禁止向该文件夹及其子文件夹投稿。公开访问权限保持不变。' : '已解除该条投稿黑名单。'
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
