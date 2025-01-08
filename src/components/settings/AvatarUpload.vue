<!-- 
  UploadAvatar.vue
  This component provides a user interface for uploading and updating user avatars.
  It supports drag and drop, file selection, clipboard paste functionality, and image cropping.
  Features:
  - Image preview with cropping
  - File size validation
  - File type validation
  - Upload progress indicator
  - Improved UI/UX for cropper
-->
<template>
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="closeModal"
  >
    <div class="bg-white p-6 rounded-lg shadow-xl w-[480px]">
      <h2 class="text-xl font-bold mb-4">上传头像</h2>
      <div class="space-y-4">
        <div
          v-if="!selectedFile"
          class="border-2 border-dashed border-gray-300 p-8 rounded-lg text-center cursor-pointer hover:bg-gray-50 transition-colors"
          @dragover.prevent
          @drop.prevent="handleDrop"
          @paste="handlePaste"
          @click="$refs.fileInput.click()"
        >
          <UploadCloud class="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p class="text-gray-600">
            将头像图片拖放到此处，粘贴剪贴板内容或点击选择
          </p>
          <p class="text-sm text-gray-400 mt-2">
            支持 JPEG, PNG 和 WebP 格式，最大 5MB
          </p>
          <input
            ref="fileInput"
            type="file"
            @change="handleFileUpload"
            accept="image/*"
            class="hidden"
          />
        </div>
        <div v-else class="space-y-4">
          <vue-cropper
            ref="cropper"
            :src="previewUrl"
            :aspect-ratio="1"
            :view-mode="1"
            :drag-mode="'move'"
            :initial-aspect-ratio="1"
            :min-container-width="400"
            :min-container-height="400"
            :background="true"
            :rotatable="true"
            :scalable="false"
            :zoomable="true"
            :center="true"
            :guides="true"
            :movable="true"
            class="max-h-[400px] rounded-lg overflow-hidden"
          />
          <div class="flex justify-center space-x-4">
            <button
              @click.prevent="rotateLeft"
              class="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
              aria-label="向左旋转"
            >
              <RotateCcw class="w-5 h-5" />
            </button>
            <button
              @click.prevent="rotateRight"
              class="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
              aria-label="向右旋转"
            >
              <RotateCw class="w-5 h-5" />
            </button>
          </div>
        </div>
        <div
          v-if="progress > 0"
          class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700"
        >
          <div
            class="bg-blue-600 h-2.5 rounded-full"
            :style="{ width: `${progress}%` }"
          ></div>
          <div class="text-center text-sm text-gray-600 mt-1">
            {{ progress }}%
          </div>
        </div>
        <hr class="my-4" />
        <div class="flex justify-end space-x-2">
          <button
            @click="closeModal"
            class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
            :disabled="loading"
          >
            取消
          </button>
          <button
            v-if="selectedFile"
            @click="resetSelection"
            class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
            :disabled="loading"
          >
            重新选择
          </button>
          <button
            v-if="selectedFile"
            @click="submitImage"
            class="px-4 py-2 bg-blue-500 text-white rounded flex items-center justify-center hover:bg-blue-600 transition-colors"
            :disabled="loading"
          >
            <Loader v-if="loading" class="w-5 h-5 animate-spin mr-2" />
            {{ loading ? '上传中...' : '上传' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, useTemplateRef, watch } from 'vue'
import { useMessage } from 'naive-ui'
import { useFileUpload } from '@/lib/fileUploads'
import VueCropper from 'vue-cropperjs'
import 'cropperjs/dist/cropper.css'
import { UploadCloud, RotateCcw, RotateCw, Loader } from 'lucide-vue-next'

const {
  loading,
  succeed,
  imageUrl: uploadedImageUrl,
  message,
  uploadFile,
  progress,
  errors,
} = useFileUpload()

const messageAPI = useMessage()
const selectedFile = ref<File | null>(null)
const previewUrl = ref('')
const cropper = useTemplateRef('cropper')

const emit = defineEmits(['close', 'upload'])

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB for avatar
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MESSAGE_IMAGE_EXTENSION_NOT_ALLOW = '只支持 JPEG, PNG 和 WebP 格式的图片'
const MESSAGE_IMAGE_FILE_SIZE_EXCEED = '头像文件大小不能超过5MB'

const closeModal = () => {
  emit('close')
}

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    setSelectedFile(target.files[0])
  }
}

const handleDrop = (event: DragEvent) => {
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    const file = files[0]
    if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setSelectedFile(file)
    } else {
      messageAPI.error(MESSAGE_IMAGE_EXTENSION_NOT_ALLOW)
    }
  }
}

const handlePaste = (event: ClipboardEvent) => {
  const items = event.clipboardData?.items
  if (items) {
    for (let i = 0; i < items.length; i++) {
      if (ALLOWED_IMAGE_TYPES.includes(items[i].type)) {
        const blob = items[i].getAsFile()
        if (blob) {
          setSelectedFile(blob)
          break
        }
      }
    }
  }
}

const setSelectedFile = (file: File) => {
  if (file.size > MAX_FILE_SIZE) {
    messageAPI.error(MESSAGE_IMAGE_FILE_SIZE_EXCEED)
    return
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    messageAPI.error(MESSAGE_IMAGE_EXTENSION_NOT_ALLOW)
    return
  }
  selectedFile.value = file
  previewUrl.value = URL.createObjectURL(file)
}

const submitImage = async () => {
  if (selectedFile.value && cropper.value) {
    // @ts-expect-error The function exists but the type is not defined
    const croppedCanvas = cropper.value.getCroppedCanvas() as HTMLCanvasElement
    croppedCanvas.toBlob((blob) => {
      if (blob) {
        const croppedFile = new File([blob], selectedFile.value!.name, {
          type: selectedFile.value!.type,
        })
        if (croppedFile.size > MAX_FILE_SIZE) {
          messageAPI.error(MESSAGE_IMAGE_FILE_SIZE_EXCEED)
          return
        }
        uploadFile(croppedFile)

        watch(
          [loading],
          ([newLoading]) => {
            if (!newLoading && succeed.value) {
              emit('upload', uploadedImageUrl.value)
              closeModal()
              return
            }
            if (!newLoading && !succeed.value) {
              messageAPI.error(errors.value.join(', '))
              return
            }
          },
          { once: true }
        )
      }
    }, selectedFile.value.type)
  }
}

const rotateLeft = () => {
  // @ts-expect-error The function exists but the type is not defined
  cropper.value?.rotate(-90)
}

const rotateRight = () => {
  // @ts-expect-error The function exists but the type is not defined
  cropper.value?.rotate(90)
}

const resetSelection = () => {
  selectedFile.value = null
  previewUrl.value = ''
}
</script>
