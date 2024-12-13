<template>
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="closeModal"
  >
    <div class="bg-white p-6 rounded-lg shadow-xl w-96">
      <h2 class="text-xl font-bold mb-4">上传图片</h2>
      <div class="space-y-4">
        <div
          class="border-2 border-dashed border-gray-300 p-4 rounded-lg text-center cursor-pointer"
          :class="{ 'bg-blue-50 border-blue-500': selectedFile }"
          @dragover.prevent
          @drop.prevent="handleDrop"
          @paste="handlePaste"
          @click="$refs.fileInput.click()"
        >
          <p v-if="!selectedFile">将图片拖放到此处，粘贴剪贴板内容或点击选择</p>
          <div v-else class="flex flex-col items-center">
            <img
              :src="previewUrl"
              alt="已选择的图片"
              class="max-h-32 max-w-full mb-2"
            />
            <span class="text-sm text-gray-600">{{ selectedFile.name }}</span>
          </div>
          <input
            ref="fileInput"
            type="file"
            @change="handleFileUpload"
            accept="image/*"
            class="hidden"
          />
        </div>
        <hr class="my-4" />
        <div>
          <label class="block mb-2">或直接使用图片网址</label>
          <input
            v-model="imageUrl"
            type="url"
            placeholder="https://example.com/image.jpg"
            class="w-full border p-2 rounded"
          />
        </div>
        <div class="flex justify-end space-x-2">
          <button
            @click="closeModal"
            class="px-4 py-2 bg-gray-200 rounded"
            :disabled="loading"
          >
            取消
          </button>
          <button
            @click="submitImage"
            class="px-4 py-2 bg-blue-500 text-white rounded flex items-center justify-center"
            :disabled="loading"
          >
            <span v-if="loading" class="spinner"></span>
            {{ loading ? '上传中...' : '上传' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useMessage } from 'naive-ui'
import { useFileUpload } from '@/lib/fileUploads'

const {
  loading,
  succeed,
  imageUrl: uploadedImageUrl,
  message,
  uploadFile,
  errors,
} = useFileUpload()
const messageAPI = useMessage()
const imageUrl = ref('')
const selectedFile = ref<File | null>(null)
const previewUrl = ref('')

const emit = defineEmits(['close', 'upload'])

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
  if (selectedFile.value) {
    if (selectedFile.value.size > MAX_FILE_SIZE) {
      messageAPI.error(MESSAGE_IMAGE_FILE_SIZE_EXCEED)
      return
    }
    uploadFile(selectedFile.value)

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
  } else if (imageUrl.value) {
    // Simulate a short delay to show loading state
    await new Promise((resolve) => setTimeout(resolve, 500))
    emit('upload', imageUrl.value)
    closeModal()
  }
}

const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB in bytes
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]
const MESSAGE_IMAGE_EXTENSION_NOT_ALLOW =
  '只支持 JPEG, PNG, GIF 和 WebP 格式的图片'
const MESSAGE_IMAGE_FILE_SIZE_EXCEED = '文件大小不能超过25MB'
</script>

<style scoped>
.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
  margin-right: 8px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
