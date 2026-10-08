<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50" aria-hidden="true" @click="closeModal" />
      <section
        ref="panel"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="headingId"
        :aria-describedby="descriptionId"
        :aria-busy="busy"
        tabindex="-1"
        class="relative max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-xl border border-zinc-200 bg-white p-6 text-zinc-950 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.25)] outline-none"
        @keydown.esc.stop.prevent="closeModal"
        @keydown.tab="trapFocus"
        @paste="handlePaste"
      >
        <button
          type="button"
          aria-label="关闭头像上传窗口"
          :disabled="busy"
          class="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          @click="closeModal"
        >
          <X class="h-4 w-4" aria-hidden="true" />
        </button>
        <header class="pr-8">
          <h2 :id="headingId" class="text-lg font-semibold tracking-tight">上传头像</h2>
          <p :id="descriptionId" class="mt-2 text-sm leading-6 text-zinc-500">
            选择图片并裁剪为正方形头像。
          </p>
        </header>

        <div class="mt-6 space-y-4">
          <button
            v-if="!selectedFile"
            type="button"
            aria-label="选择头像图片"
            :disabled="busy"
            class="flex min-h-52 w-full flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50/50 px-5 py-8 text-center transition-colors hover:border-zinc-400 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            @dragover.prevent
            @drop.prevent="handleDrop"
            @click="openFilePicker"
          >
            <UploadCloud class="mb-3 h-8 w-8 text-zinc-400" aria-hidden="true" />
            <span class="text-sm font-medium leading-6 text-zinc-700">点击选择，或拖放、粘贴图片</span>
            <span class="mt-2 text-xs leading-5 text-zinc-500">JPEG、PNG、WebP，最大 5MB</span>
          </button>
          <input
            ref="fileInput"
            type="file"
            aria-label="头像图片文件"
            accept="image/jpeg,image/png,image/webp"
            hidden
            :disabled="busy"
            @change="handleFileUpload"
          />

          <div v-if="selectedFile" class="space-y-3">
            <div class="avatar-cropper aspect-square w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100" :class="{ 'pointer-events-none': busy }">
              <vue-cropper
                ref="cropper"
                :src="previewUrl"
                alt="待裁剪的头像"
                :aspect-ratio="1"
                :view-mode="1"
                drag-mode="move"
                :initial-aspect-ratio="1"
                :min-container-width="0"
                :min-container-height="0"
                :background="true"
                :rotatable="true"
                :scalable="false"
                :zoomable="true"
                :center="true"
                :guides="true"
                :movable="true"
                :container-style="{ width: '100%', height: '100%' }"
                :img-style="{ display: 'block', maxWidth: '100%' }"
                class="h-full w-full"
              />
            </div>
            <div class="flex items-center justify-center gap-2">
              <button
                type="button"
                aria-label="向左旋转"
                :disabled="busy"
                class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 shadow-sm transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                @click="rotateLeft"
              >
                <RotateCcw class="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="向右旋转"
                :disabled="busy"
                class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 shadow-sm transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                @click="rotateRight"
              >
                <RotateCw class="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div v-if="busy || progress > 0" class="space-y-2" role="status">
            <div class="flex items-center justify-between gap-3 text-xs text-zinc-500">
              <span>{{ binding ? '正在保存头像...' : processing && !loading ? '正在处理头像...' : '上传进度' }}</span>
              <span v-if="!binding" class="tabular-nums">{{ progress }}%</span>
            </div>
            <div
              role="progressbar"
              aria-label="头像上传进度"
              :aria-valuenow="progress"
              aria-valuemin="0"
              aria-valuemax="100"
              class="h-1.5 overflow-hidden rounded-full bg-zinc-100"
            >
              <div :style="{ width: `${progress}%` }" class="h-full rounded-full bg-zinc-900 transition-[width] duration-200" />
            </div>
          </div>

          <footer class="flex flex-wrap justify-end gap-2 border-t border-zinc-100 pt-4">
            <button
              type="button"
              :disabled="busy"
              class="inline-flex h-9 items-center justify-center rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              @click="closeModal"
            >
              取消
            </button>
            <button
              v-if="selectedFile"
              type="button"
              :disabled="busy"
              class="inline-flex h-9 items-center justify-center rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              @click="resetSelection"
            >
              重新选择
            </button>
            <button
              v-if="selectedFile"
              ref="submitButton"
              type="button"
              :disabled="busy"
              class="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              @click="submitImage"
            >
              <LoaderCircle v-if="busy" class="h-4 w-4 animate-spin" aria-hidden="true" />
              {{ binding ? '保存中...' : busy ? '上传中...' : '上传' }}
            </button>
          </footer>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, useTemplateRef, watch } from 'vue'
import { useFileUpload } from '@/lib/fileUploads'
import { useShadcnToast } from '@/lib/useShadcnToast'
import VueCropper from 'vue-cropperjs'
import 'cropperjs/dist/cropper.css'
import { UploadCloud, RotateCcw, RotateCw, LoaderCircle, X } from 'lucide-vue-next'

const props = withDefaults(defineProps<{ binding?: boolean }>(), { binding: false })
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'upload', url: string): void
}>()

const { loading, succeed, imageUrl: uploadedImageUrl, uploadFile, progress, errors } = useFileUpload('avatar')
const messageAPI = useShadcnToast()
const processing = ref(false)
const busy = computed(() => processing.value || loading.value || props.binding)
const selectedFile = ref<File | null>(null)
const previewUrl = ref('')
const panel = useTemplateRef<HTMLElement>('panel')
const fileInput = useTemplateRef<HTMLInputElement>('fileInput')
const submitButton = useTemplateRef<HTMLButtonElement>('submitButton')
const cropper = useTemplateRef<{
  getCroppedCanvas: () => HTMLCanvasElement | undefined
  rotate: (angle: number) => void
}>('cropper')
const headingId = `avatar-upload-${useId()}`
const descriptionId = `${headingId}-description`
let active = true
let previousFocus: HTMLElement | null = null
let previousOverflow = ''

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MESSAGE_IMAGE_EXTENSION_NOT_ALLOW = '只支持 JPEG, PNG 和 WebP 格式的图片'
const MESSAGE_IMAGE_FILE_SIZE_EXCEED = '头像文件大小不能超过5MB'

const focusableElements = () => Array.from(panel.value?.querySelectorAll<HTMLElement>(
  'button:not(:disabled), a[href], input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
) ?? []).filter(element => element.tabIndex >= 0
  && !element.matches(':disabled')
  && !element.closest('[hidden], [inert], [aria-hidden="true"]')
  && getComputedStyle(element).display !== 'none'
  && getComputedStyle(element).visibility !== 'hidden')

const trapFocus = (event: KeyboardEvent) => {
  const elements = focusableElements()
  if (!elements.length) {
    event.preventDefault()
    panel.value?.focus({ preventScroll: true })
    return
  }
  const first = elements[0]
  const last = elements[elements.length - 1]
  if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.value)) {
    event.preventDefault()
    last.focus({ preventScroll: true })
  } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panel.value)) {
    event.preventDefault()
    first.focus({ preventScroll: true })
  }
}

onMounted(async () => {
  previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  previousOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  await nextTick()
  if (!active) return
  const picker = panel.value?.querySelector<HTMLButtonElement>('button[aria-label="选择头像图片"]')
  const focusTarget = picker && !picker.disabled ? picker : panel.value
  focusTarget?.focus({ preventScroll: true })
})

watch(busy, async isBusy => {
  if (!isBusy) return
  await nextTick()
  if (active) panel.value?.focus({ preventScroll: true })
})

const closeModal = () => {
  if (!busy.value) emit('close')
}

const openFilePicker = () => {
  if (!busy.value) fileInput.value?.click()
}

const releasePreviewUrl = () => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
}

onBeforeUnmount(() => {
  active = false
  releasePreviewUrl()
  document.body.style.overflow = previousOverflow
  if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true })
})

const setSelectedFile = (file: File) => {
  if (busy.value) return
  if (file.size > MAX_FILE_SIZE) {
    messageAPI.error(MESSAGE_IMAGE_FILE_SIZE_EXCEED)
    return
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    messageAPI.error(MESSAGE_IMAGE_EXTENSION_NOT_ALLOW)
    return
  }
  selectedFile.value = file
  releasePreviewUrl()
  previewUrl.value = URL.createObjectURL(file)
  void nextTick(() => { if (active) submitButton.value?.focus({ preventScroll: true }) })
}

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) setSelectedFile(file)
  target.value = ''
}

const handleDrop = (event: DragEvent) => {
  const file = event.dataTransfer?.files[0]
  if (file) setSelectedFile(file)
}

const handlePaste = (event: ClipboardEvent) => {
  const items = event.clipboardData?.items
  if (!items || busy.value) return
  for (const item of Array.from(items)) {
    if (!item.type.startsWith('image/')) continue
    const file = item.getAsFile()
    if (file) {
      event.preventDefault()
      setSelectedFile(file)
      break
    }
  }
}

const submitImage = async () => {
  if (busy.value || !selectedFile.value || !cropper.value) return
  const source = selectedFile.value
  processing.value = true
  try {
    const canvas = cropper.value.getCroppedCanvas()
    if (!canvas) throw new Error('头像裁剪失败')
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, source.type))
    if (!active) return
    if (!blob) {
      messageAPI.error('头像裁剪失败，请重新选择图片')
      return
    }
    const croppedFile = new File([blob], source.name, { type: source.type })
    if (croppedFile.size > MAX_FILE_SIZE) {
      messageAPI.error(MESSAGE_IMAGE_FILE_SIZE_EXCEED)
      return
    }
    await uploadFile(croppedFile)
    if (!active) return
    if (succeed.value && uploadedImageUrl.value) {
      emit('upload', uploadedImageUrl.value)
      await nextTick()
    } else {
      const uploadErrors = errors.value.map(error => error.replace(/^[a-zA-Z0-9_.-]+:\s*/, '')).join('；')
      messageAPI.error(uploadErrors || '头像上传失败，请重试')
    }
  } catch {
    if (active) messageAPI.error('头像上传失败，请重试')
  } finally {
    processing.value = false
  }
}

const rotateLeft = () => {
  if (!busy.value) cropper.value?.rotate(-90)
}

const rotateRight = () => {
  if (!busy.value) cropper.value?.rotate(90)
}

const resetSelection = () => {
  if (busy.value) return
  selectedFile.value = null
  releasePreviewUrl()
  void nextTick(() => {
    if (active) panel.value?.querySelector<HTMLButtonElement>('button[aria-label="选择头像图片"]')?.focus({ preventScroll: true })
  })
}
</script>

<style scoped>
.avatar-cropper :deep(.cropper-container) {
  max-width: 100%;
}

.avatar-cropper :deep(.cropper-view-box) {
  outline-color: #fff;
  box-shadow: 0 0 0 1px rgb(24 24 27 / 55%);
}

.avatar-cropper :deep(.cropper-line) {
  background-color: #fff;
  opacity: 0.2;
}

.avatar-cropper :deep(.cropper-point) {
  border: 1px solid rgb(24 24 27 / 70%);
  background-color: #fff;
  box-shadow: 0 1px 4px rgb(24 24 27 / 35%);
  opacity: 1;
}

.avatar-cropper :deep(.cropper-point.point-se::before) {
  background-color: #fff;
}
</style>
