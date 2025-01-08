<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="closeModal">
    <div class="bg-white p-8 rounded-lg shadow-xl w-[480px] max-w-full">
      <h2 class="text-2xl font-bold mb-6">上传图片</h2>
      <div class="space-y-6">
        <div
          class="border-2 border-dashed border-gray-300 p-8 rounded-lg text-center cursor-pointer relative transition-all duration-300 ease-in-out"
          :class="{
            'bg-blue-50 border-blue-500': selectedFile || isDragging,
            'hover:bg-gray-50': !selectedFile && !isDragging
          }"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
          @paste="handlePaste"
          @click="$refs.fileInput.click()"
        >
          <div v-if="!selectedFile" class="space-y-2">
            <i class="fas fa-cloud-upload-alt text-4xl text-gray-400"></i>
            <p class="text-lg">拖放图片到此处，或点击选择</p>
            <p class="text-sm text-gray-500">支持 JPEG, PNG, GIF 和 WebP 格式，最大 25MB</p>
          </div>
          <div v-else class="flex flex-col items-center">
            <img :src="previewUrl" alt="预览图片" class="max-h-48 max-w-full mb-4 rounded shadow" />
            <span class="text-sm text-gray-600">{{ selectedFile.name }}</span>
          </div>
          <input
            ref="fileInput"
            type="file"
            @change="handleFileUpload"
            accept="image/jpeg,image/png,image/gif,image/webp"
            class="hidden"
          />
        </div>
        <div v-if="progress > 0" class="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div 
            class="bg-blue-600 h-full rounded-full transition-all duration-300 ease-in-out flex items-center justify-center text-xs text-white font-semibold" 
            :style="{ width: `${progress}%` }"
          >
            {{ `${Math.round(progress)}%` }}
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">或直接使用图片网址</label>
          <input
            v-model="imageUrl"
            type="url"
            placeholder="https://example.com/image.jpg"
            class="w-full border border-gray-300 p-3 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div class="flex justify-end space-x-4">
          <button
            @click="confirmClose"
            class="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-300"
          >
            取消
          </button>
          <button
            @click="submitImage"
            class="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!selectedFile && !imageUrl || loading"
          >
            <span v-if="loading" class="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
            {{ loading ? '上传中...' : '上传' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import { useFileUpload } from '@/lib/fileUploads'

const {
  loading,
  succeed,
  imageUrl: uploadedImageUrl,
  uploadFile,
  progress,
  errors,
} = useFileUpload()

const dialog = useDialog()
const messageAPI = useMessage()
const imageUrl = ref('')
const selectedFile = ref<File | null>(null)
const previewUrl = ref('')
const isDragging = ref(false)

const emit = defineEmits(['close', 'upload'])

const closeModal = () => emit('close')

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) setSelectedFile(target.files[0])
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  const file = event.dataTransfer?.files[0]
  if (file) {
    if (ALLOWED_IMAGE_TYPES.includes(file.type)) setSelectedFile(file)
    else messageAPI.error(MESSAGE_IMAGE_EXTENSION_NOT_ALLOW)
  }
}

const handlePaste = (event: ClipboardEvent) => {
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
  imageUrl.value = ''
}

const submitImage = async () => {
  if (selectedFile.value) {
    if (selectedFile.value.size > MAX_FILE_SIZE) {
      messageAPI.error(MESSAGE_IMAGE_FILE_SIZE_EXCEED)
      return
    }
    uploadFile(selectedFile.value)
    watch([loading], ([newLoading]) => {
      if (!newLoading) {
        if (succeed.value) {
          emit('upload', uploadedImageUrl.value)
          closeModal()
        } else {
          messageAPI.error(errors.value.join(', '))
        }
      }
    }, { once: true })
  } else if (imageUrl.value) {
    await new Promise(resolve => setTimeout(resolve, 500))
    emit('upload', imageUrl.value)
    closeModal()
  }
}

const confirmClose = () => {
  if (loading.value) {
    dialog.warning({
      title: '确认取消',
      content: '正在上传文件，确定要取消吗？\n请注意，将无法撤销此操作。',
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: closeModal
    })
  } else {
    closeModal()
  }
}

const MAX_FILE_SIZE = 25 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MESSAGE_IMAGE_EXTENSION_NOT_ALLOW = '只支持 JPEG, PNG, GIF 和 WebP 格式的图片'
const MESSAGE_IMAGE_FILE_SIZE_EXCEED = '文件大小不能超过25MB'
</script>
