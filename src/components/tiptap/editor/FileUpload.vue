<template>
  <ShadcnFormDialog :show="true" title="上传文件" :suspended="confirmingClose" max-width="max-w-[480px]" @close="confirmClose">
    <div class="space-y-5">
      <div
        class="relative cursor-pointer rounded-lg border border-dashed p-6 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 sm:p-8"
        :class="isDragging ? 'border-zinc-950 bg-zinc-100' : 'border-zinc-300 bg-zinc-50 hover:bg-zinc-100'"
        role="button"
        tabindex="0"
        aria-label="选择要上传的文件"
        :aria-disabled="loading"
        @dragover.prevent="isDragging = !loading"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
        @click="openFilePicker"
        @keydown.enter.prevent="openFilePicker"
        @keydown.space.prevent="openFilePicker"
      >
        <template v-if="!selectedFile">
          <CloudUpload class="mx-auto mb-4 h-10 w-10 text-zinc-400" aria-hidden="true" />
          <p class="text-sm font-medium text-zinc-950">{{ isDragging ? '松开以上传文件' : '将文件拖放到此处或点击选择' }}</p>
          <p class="mt-2 text-xs leading-5 text-zinc-500">支持所有文件类型，最大 25MB</p>
        </template>
        <div v-else class="flex flex-col items-center">
          <File class="mb-4 h-10 w-10 text-zinc-500" aria-hidden="true" />
          <span class="break-all text-sm font-medium text-zinc-950">{{ selectedFile.name }}</span>
          <span class="mt-1 text-xs text-zinc-500">{{ formatFileSize(selectedFile.size) }}</span>
          <button type="button" :disabled="loading" @click.stop="selectedFile = null"
            class="mt-3 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:opacity-50">
            重新选择
          </button>
        </div>
        <input ref="fileInput" type="file" :disabled="loading" @change="handleFileUpload" class="hidden" />
      </div>
      <div v-if="loading || progress > 0" class="space-y-2" role="status" aria-live="polite">
        <div class="flex items-center justify-between text-xs text-zinc-500">
          <span>{{ loading ? '正在上传文件' : '上传进度' }}</span>
          <span>{{ Math.round(progress) }}%</span>
        </div>
        <div class="h-2 overflow-hidden rounded-full bg-zinc-100" role="progressbar" aria-label="文件上传进度" :aria-valuenow="progress" aria-valuemin="0" aria-valuemax="100">
          <div class="h-full rounded-full bg-zinc-950 transition-all duration-300" :style="{ width: progress + '%' }"></div>
        </div>
      </div>
    </div>
    <template #footer>
      <button type="button" :disabled="confirmingClose" @click="confirmClose"
        class="inline-flex h-10 items-center justify-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-950 shadow-sm transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:opacity-50">
        取消
      </button>
      <button type="button" @click="submitFile" :disabled="!selectedFile || loading || confirmingClose"
        class="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
        <Loader2 v-if="loading" class="h-4 w-4 animate-spin" aria-hidden="true" />
        {{ loading ? '上传中…' : '上传' }}
      </button>
    </template>
  </ShadcnFormDialog>
</template>
<script setup lang="ts">
import { onBeforeUnmount, ref, useTemplateRef } from 'vue'
import { useShadcnToast } from '@/lib/useShadcnToast'
import { useShadcnDialog } from '@/lib/useShadcnDialog'
import ShadcnFormDialog from '@/components/common/ShadcnFormDialog.vue'
import { useFileUpload } from '@/lib/fileUploads'
import { CloudUpload, File, Loader2 } from 'lucide-vue-next'

const {
  loading,
  succeed,
  imageUrl: uploadedFileUrl,
  uploadFile,
  errors,
  progress,
} = useFileUpload()
const messageAPI = useShadcnToast()
const dialog = useShadcnDialog()
const confirmingClose = ref(false)
let mounted = true
onBeforeUnmount(() => { mounted = false })
const selectedFile = ref<File | null>(null)
const isDragging = ref(false)
const fileInput = useTemplateRef<HTMLInputElement>('fileInput')
const openFilePicker = () => { if (!loading.value) fileInput.value?.click() }

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'upload', filename: string, url: string): void
}>()

const attemptCloseModal = () => {
  if (!loading.value) {
    emit('close')
  }
}

const confirmClose = async () => {
  if (confirmingClose.value) return
  if (loading.value) {
    confirmingClose.value = true
    try {
      const confirmed = await dialog.confirm({
        title: '确认取消',
        description: '正在上传文件，确定要关闭窗口吗？关闭后将不会把文件插入编辑器。',
        confirmText: '关闭窗口',
        cancelText: '继续上传',
      })
      if (confirmed && mounted) emit('close')
    } finally {
      confirmingClose.value = false
    }
  } else {
    emit('close')
  }
}

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    checkFileSize(target.files[0])
  }
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  if (loading.value) return
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    checkFileSize(files[0])
  }
}

const checkFileSize = (file: File) => {
  if (loading.value) return
  if (file.size > 25 * 1024 * 1024) {
    messageAPI.error('文件大小不能超过25MB')
  } else {
    setSelectedFile(file)
  }
}

const setSelectedFile = (file: File) => {
  selectedFile.value = file
}

const submitFile = async () => {
  const file = selectedFile.value
  if (!file || loading.value || confirmingClose.value) return
  await uploadFile(file)
  if (!mounted) return
  if (succeed.value) {
    emit('upload', file.name, uploadedFileUrl.value)
    attemptCloseModal()
  } else {
    messageAPI.error(errors.value.join(', '))
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>
