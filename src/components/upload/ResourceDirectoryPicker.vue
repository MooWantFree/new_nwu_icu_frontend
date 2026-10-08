<template>
  <div>
    <p v-if="directoryUpdatedAt" class="text-xs leading-5 text-zinc-500">
      目录缓存更新于 <Time :time="directoryUpdatedAt" />，通常每天 03:00 重新扫描。
    </p>

    <div class="mt-3 overflow-hidden rounded-xl border border-zinc-200">
      <div class="flex min-h-12 items-center gap-1 overflow-x-auto border-b border-zinc-200 bg-zinc-50 px-3 py-2">
        <button
          type="button"
          class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-500 transition hover:bg-white hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          aria-label="返回根目录"
          :disabled="disabled || directoryLoading"
          @click="openDirectory('/')"
        >
          <Home class="h-4 w-4" />
        </button>
        <template v-for="crumb in breadcrumbs" :key="crumb.path">
          <ChevronRight class="h-3.5 w-3.5 shrink-0 text-zinc-300" />
          <button
            type="button"
            class="inline-flex h-8 shrink-0 items-center justify-center rounded-md px-2 text-xs font-medium text-zinc-600 transition hover:bg-white hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            :disabled="disabled || directoryLoading"
            @click="openDirectory(crumb.path)"
          >
            {{ crumb.name }}
          </button>
        </template>
      </div>

      <div class="p-2" :class="compact ? 'min-h-52' : 'min-h-[17rem] sm:min-h-72'">
        <div
          v-if="directoryLoading"
          class="flex items-center justify-center text-sm text-zinc-500"
          :class="compact ? 'min-h-48' : 'min-h-[16rem] sm:min-h-68'"
          role="status"
        >
          <Loader2 class="mr-2 h-5 w-5 animate-spin text-zinc-800" />
          正在读取目录…
        </div>
        <div
          v-else-if="directoryError"
          class="flex flex-col items-center justify-center px-4 text-center"
          :class="compact ? 'min-h-48' : 'min-h-[16rem] sm:min-h-68'"
          role="alert"
        >
          <AlertCircle class="h-5 w-5 text-red-600" />
          <p class="mt-3 text-sm font-medium leading-6 text-zinc-700">{{ directoryError }}</p>
          <button
            type="button"
            class="mt-3 inline-flex h-8 items-center justify-center rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            :disabled="disabled || directoryLoading"
            @click="loadDirectories(path)"
          >
            重新加载
          </button>
        </div>
        <div
          v-else-if="!directories.length"
          class="flex flex-col items-center justify-center text-center text-zinc-500"
          :class="compact ? 'min-h-48' : 'min-h-[16rem] sm:min-h-68'"
        >
          <div class="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-500">
            <Folder class="h-5 w-5" />
          </div>
          <p class="mt-3 text-sm">当前目录下没有子文件夹</p>
          <p class="mt-1 text-xs">可以直接选择当前目录</p>
        </div>
        <ul v-else class="space-y-1">
          <li v-for="directory in directories" :key="directory.path">
            <button
              type="button"
              class="flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              :disabled="disabled || directoryLoading"
              @click="openDirectory(directory.path)"
            >
              <Folder class="h-4 w-4 shrink-0 text-zinc-500" />
              <span class="min-w-0 flex-1 truncate text-sm font-medium text-zinc-700">
                {{ directory.name }}
              </span>
              <ChevronRight class="h-4 w-4 shrink-0 text-zinc-300" />
            </button>
          </li>
        </ul>
      </div>
    </div>

    <div class="mt-3 rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3">
      <p class="text-xs font-medium text-zinc-500">当前选择</p>
      <p class="mt-1 break-all text-sm font-medium leading-6 text-zinc-900">{{ finalTargetPath }}</p>
      <p v-if="rootUploadBlocked" class="mt-2 text-xs font-medium leading-5 text-amber-700">
        不能直接投稿到根目录，请先选择一个子目录，或在此处新建文件夹。
      </p>
      <div v-if="publishedPathPreview.length" class="mt-3 border-t border-zinc-200 pt-3">
        <p class="text-xs font-medium text-zinc-500">最终文件路径预览</p>
        <ul class="mt-1.5 space-y-1">
          <li
            v-for="previewPath in publishedPathPreview"
            :key="previewPath"
            class="break-all font-mono text-xs text-zinc-700"
          >
            {{ previewPath }}
          </li>
        </ul>
        <p v-if="previewRelativePaths.length > publishedPathPreview.length" class="mt-1 text-xs text-zinc-500">
          另有 {{ previewRelativePaths.length - publishedPathPreview.length }} 个文件
        </p>
      </div>
    </div>

    <label
      class="mt-3 flex items-center gap-3 rounded-md border border-zinc-200 px-4 py-3 transition"
      :class="disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-zinc-50'"
    >
      <input
        :checked="createNewFolder"
        :disabled="disabled"
        type="checkbox"
        class="h-4 w-4 rounded border-zinc-300 accent-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed"
        @change="updateCreateNewFolder"
      />
      <span class="flex flex-1 items-center gap-2 text-sm font-medium text-zinc-700">
        <FolderPlus class="h-4 w-4 text-zinc-500" />
        在此处新建文件夹
      </span>
    </label>
    <div v-if="createNewFolder" class="mt-3">
      <label :for="folderNameInputId" class="sr-only">新文件夹名称</label>
      <input
        :id="folderNameInputId"
        :value="newFolderName"
        :disabled="disabled"
        type="text"
        maxlength="255"
        placeholder="输入新文件夹名称"
        class="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 shadow-sm outline-none transition placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        @input="updateNewFolderName"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { AlertCircle, ChevronRight, Folder, FolderPlus, Home, Loader2 } from 'lucide-vue-next'
import Time from '@/components/tinyComponents/Time.vue'
import { api } from '@/lib/requests'
import type { APIResourceDirectories } from '@/types/api/resourceUpload'

type ResourceDirectory = APIResourceDirectories['response']['directories'][number]

const props = withDefaults(defineProps<{
  path: string
  createNewFolder: boolean
  newFolderName: string
  previewRelativePaths?: string[]
  compact?: boolean
  inputId?: string
  disabled?: boolean
}>(), {
  previewRelativePaths: () => [],
  compact: false,
  inputId: 'new-folder-name',
  disabled: false,
})

const emit = defineEmits<{
  (event: 'update:path', value: string): void
  (event: 'update:createNewFolder', value: boolean): void
  (event: 'update:newFolderName', value: string): void
}>()

const directories = ref<ResourceDirectory[]>([])
const directoryUpdatedAt = ref<string | null>(null)
const directoryLoading = ref(false)
const directoryError = ref('')
let directoryRequestId = 0

watch(() => props.disabled, (disabled) => {
  if (disabled) {
    directoryRequestId += 1
    directoryLoading.value = false
  }
}, { flush: 'sync' })

const folderNameInputId = computed(() => props.inputId)
const breadcrumbs = computed(() => {
  const parts = props.path.split('/').filter(Boolean)
  return parts.map((name, index) => ({
    name,
    path: `/${parts.slice(0, index + 1).join('/')}`,
  }))
})
const finalTargetPath = computed(() => {
  const folderName = props.newFolderName.trim()
  if (!props.createNewFolder || !folderName) return props.path
  return `${props.path === '/' ? '' : props.path}/${folderName}`
})
const rootUploadBlocked = computed(
  () => props.path === '/' && (!props.createNewFolder || !props.newFolderName.trim()),
)
const publishedPathPreview = computed(() => props.previewRelativePaths.slice(0, 3).map((relativePath) =>
  `${finalTargetPath.value.replace(/\/$/, '')}/${relativePath}`,
))

const getErrorMessage = (errors: { err_msg: string }[] | undefined, fallback: string) =>
  errors?.map((error) => error.err_msg).filter(Boolean).join('；') || fallback

const loadDirectories = async (requestedPath: string) => {
  if (props.disabled) return
  const requestId = ++directoryRequestId
  directoryLoading.value = true
  directoryError.value = ''
  try {
    const response = await api.get({
      url: '/api/upload/directories/',
      query: { path: requestedPath },
    })
    if (props.disabled || requestId !== directoryRequestId) return
    if (response.status !== 200) {
      directoryError.value = getErrorMessage(response.errors, '目录缓存暂时不可用，请稍后重试')
      return
    }
    directories.value = response.content.directories
    directoryUpdatedAt.value = response.content.updated_at
    emit('update:path', response.content.path)
  } catch {
    if (props.disabled || requestId !== directoryRequestId) return
    directoryError.value = '暂时无法读取本地目录缓存，请稍后重试'
  } finally {
    if (requestId === directoryRequestId) directoryLoading.value = false
  }
}

const openDirectory = async (requestedPath: string) => {
  if (props.disabled || directoryLoading.value || requestedPath === props.path) return
  emit('update:createNewFolder', false)
  emit('update:newFolderName', '')
  await loadDirectories(requestedPath)
}

const updateCreateNewFolder = (event: Event) => {
  if (props.disabled) return
  emit('update:createNewFolder', (event.target as HTMLInputElement).checked)
}

const updateNewFolderName = (event: Event) => {
  if (props.disabled) return
  emit('update:newFolderName', (event.target as HTMLInputElement).value.trimStart())
}

onMounted(() => loadDirectories(props.path))
</script>
