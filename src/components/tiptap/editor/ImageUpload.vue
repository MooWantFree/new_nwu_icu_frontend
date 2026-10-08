<template>
  <ShadcnFormDialog :show="true" title="上传图片" :suspended="confirmingClose" max-width="max-w-[480px]" @close="confirmClose">
    <div class="space-y-5">
      <div
        class="relative cursor-pointer rounded-lg border border-dashed p-6 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 sm:p-8"
        :class="isDragging ? 'border-zinc-950 bg-zinc-100' : 'border-zinc-300 bg-zinc-50 hover:bg-zinc-100'"
        role="button"
        tabindex="0"
        aria-label="选择要上传的图片"
        :aria-disabled="loading || isCompressing"
        @dragover.prevent="isDragging = !loading && !isCompressing"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
        @paste="handlePaste"
        @click="openFilePicker"
        @keydown.enter.prevent="openFilePicker"
        @keydown.space.prevent="openFilePicker"
      >
        <div v-if="!selectedFile" class="space-y-3">
          <CloudUpload class="mx-auto h-10 w-10 text-zinc-400" aria-hidden="true" />
          <p class="text-sm font-medium text-zinc-950">{{ isDragging ? '松开以上传图片' : '拖放图片到此处，或点击选择' }}</p>
          <p class="text-xs leading-5 text-zinc-500">支持 JPEG、PNG、GIF 和 WebP 格式，最大 100MB</p>
          <p v-if="isCompressing" class="text-xs text-zinc-500" role="status">正在压缩图片，请稍候…</p>
        </div>
        <div v-else class="flex flex-col items-center">
          <img :src="previewUrl" alt="预览图片" class="mb-4 max-h-48 max-w-full rounded-md border border-zinc-200" />
          <span class="break-all text-sm text-zinc-700">{{ selectedFile.name }}</span>
          <button type="button" :disabled="loading || isCompressing" @click.stop="clearSelection"
            class="mt-3 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:opacity-50">
            重新选择
          </button>
        </div>
        <input ref="fileInput" type="file" :disabled="loading || isCompressing" @change="handleFileUpload" accept="image/jpeg,image/png,image/gif,image/webp" class="hidden" />
      </div>
      <div v-if="loading || progress > 0" class="space-y-2" role="status" aria-live="polite">
        <div class="flex items-center justify-between text-xs text-zinc-500">
          <span>{{ loading ? '正在上传图片' : '上传进度' }}</span>
          <span>{{ Math.round(progress) }}%</span>
        </div>
        <div class="h-2 overflow-hidden rounded-full bg-zinc-100" role="progressbar" aria-label="图片上传进度" :aria-valuenow="progress" aria-valuemin="0" aria-valuemax="100">
          <div class="h-full rounded-full bg-zinc-950 transition-all duration-300" :style="{ width: progress + '%' }"></div>
        </div>
      </div>
    </div>
    <template #footer>
      <button type="button" :disabled="confirmingClose" @click="confirmClose"
        class="inline-flex h-10 items-center justify-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-950 shadow-sm transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:opacity-50">
        取消
      </button>
      <button type="button" @click="submitImage" :disabled="!selectedFile || loading || isCompressing || confirmingClose"
        class="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
        <Loader2 v-if="loading || isCompressing" class="h-4 w-4 animate-spin" aria-hidden="true" />
        {{ loading ? '上传中…' : isCompressing ? '压缩中…' : '上传' }}
      </button>
    </template>
  </ShadcnFormDialog>
</template>
<script setup lang="ts">
import { onBeforeUnmount, ref, useTemplateRef } from 'vue'
import { CloudUpload, Loader2 } from 'lucide-vue-next'
import { useShadcnToast } from '@/lib/useShadcnToast'
import { useShadcnDialog } from '@/lib/useShadcnDialog'
import ShadcnFormDialog from '@/components/common/ShadcnFormDialog.vue'
import { useFileUpload } from '@/lib/fileUploads'

const {
  loading,
  succeed,
  imageUrl: uploadedImageUrl,
  uploadFile,
  progress,
  errors,
} = useFileUpload('img')

const dialog = useShadcnDialog()
const messageAPI = useShadcnToast()
const confirmingClose = ref(false)
let mounted = true
const selectedFile = ref<File | null>(null)
const previewUrl = ref('')
const isDragging = ref(false)
const isCompressing = ref(false)
const fileInput = useTemplateRef<HTMLInputElement>('fileInput')
const openFilePicker = () => { if (!loading.value && !isCompressing.value) fileInput.value?.click() }

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'upload', url: string): void
}>()

const closeModal = () => emit('close')

const releasePreviewUrl = () => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
}

const clearSelection = () => {
  selectedFile.value = null
  releasePreviewUrl()
}

onBeforeUnmount(() => { mounted = false; releasePreviewUrl() })

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) setSelectedFile(target.files[0])
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  if (loading.value || isCompressing.value) return
  const file = event.dataTransfer?.files[0]
  if (file) {
    if (ALLOWED_IMAGE_TYPES.includes(file.type)) setSelectedFile(file)
    else messageAPI.error(MESSAGE_IMAGE_EXTENSION_NOT_ALLOW)
  }
}

const handlePaste = (event: ClipboardEvent) => {
  if (loading.value || isCompressing.value) return
  const items = event.clipboardData?.items
  if (items) {
    for (const item of items) {
      if (ALLOWED_IMAGE_TYPES.includes(item.type)) {
        const blob = item.getAsFile()
        if (blob) {
          setSelectedFile(blob)
          break
        }
      }
    }
  }
}

const setSelectedFile = async (file: File) => {
  if (loading.value || isCompressing.value) return
  if (file.size > MAX_FILE_SIZE_HARD_LIMIT) {
    messageAPI.error(MESSAGE_IMAGE_FILE_SIZE_EXCEED_HARD_LIMIT)
    return
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    messageAPI.error(MESSAGE_IMAGE_EXTENSION_NOT_ALLOW)
    return
  }
  
  let compressedFile = file
  if (file.size > MAX_FILE_SIZE) {
    try {
      isCompressing.value = true
      let quality = 0.8
      while (compressedFile.size > MAX_FILE_SIZE && quality > 0.1) {
        compressedFile = await compressImage(file, quality)
        if (!mounted) return
        quality -= 0.1
      }
      if (compressedFile.size > MAX_FILE_SIZE) {
        throw new Error('Unable to compress image to desired size')
      }
    } catch (error) {
      if (mounted) messageAPI.error('图片压缩失败，请尝试使用更小的图片')
      return
    } finally {
      isCompressing.value = false
    }
  }
  
  if (!mounted) return
  selectedFile.value = compressedFile
  releasePreviewUrl()
  previewUrl.value = URL.createObjectURL(compressedFile)
}

const compressImage = (file: File, quality: number): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      if (!mounted) { reject(new Error('上传窗口已关闭')); return }
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        if (!mounted) { reject(new Error('上传窗口已关闭')); return }
        const elem = document.createElement('canvas')
        const scaleFactor = Math.sqrt(MAX_FILE_SIZE / file.size)
        elem.width = img.width * scaleFactor
        elem.height = img.height * scaleFactor
        const ctx = elem.getContext('2d')
        ctx?.drawImage(img, 0, 0, elem.width, elem.height)
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
        const imageType = isSafari ? 'image/jpeg' : 'image/webp'
        const fileExtension = isSafari ? 'jpg' : 'webp'
        ctx?.canvas.toBlob(
          (blob) => {
            if (!mounted) { reject(new Error('上传窗口已关闭')); return }
            if (blob) {
              const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, `.${fileExtension}`), {
                type: imageType,
                lastModified: Date.now(),
              })
              resolve(newFile)
            } else {
              reject(new Error('Blob creation failed'))
            }
          },
          imageType,
          quality
        )
      }
    }
    reader.onerror = (error) => reject(error)
  })
}

const submitImage = async () => {
  const file = selectedFile.value
  if (!file || loading.value || isCompressing.value || confirmingClose.value) return
  await uploadFile(file)
  if (!mounted) return
  if (succeed.value) {
    emit('upload', uploadedImageUrl.value)
    closeModal()
  } else {
    messageAPI.error(errors.value.join(', '))
  }
}

const confirmClose = async () => {
  if (confirmingClose.value) return
  if (loading.value) {
    confirmingClose.value = true
    try {
      const confirmed = await dialog.confirm({
        title: '确认取消',
        description: '正在上传图片，确定要关闭窗口吗？关闭后将不会把图片插入编辑器。',
        confirmText: '关闭窗口',
        cancelText: '继续上传',
      })
      if (confirmed && mounted) closeModal()
    } finally {
      confirmingClose.value = false
    }
  } else {
    closeModal()
  }
}

const MAX_FILE_SIZE = 25 * 1024 * 1024
const MAX_FILE_SIZE_HARD_LIMIT = 100 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MESSAGE_IMAGE_EXTENSION_NOT_ALLOW = '只支持 JPEG, PNG, GIF 和 WebP 格式的图片'
const MESSAGE_IMAGE_FILE_SIZE_EXCEED_HARD_LIMIT = '图片大小不能超过100MB'
</script>
