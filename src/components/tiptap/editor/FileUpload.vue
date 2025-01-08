<template>
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="attemptCloseModal"
  >
    <div class="bg-white p-6 rounded-lg shadow-xl w-96">
      <h2 class="text-xl font-bold mb-4">上传文件</h2>
      <div class="space-y-4">
        <div
          class="border-2 border-dashed border-gray-300 p-4 rounded-lg text-center cursor-pointer"
          :class="{ 'bg-blue-50 border-blue-500': selectedFile }"
          @dragover.prevent
          @drop.prevent="handleDrop"
          @click="$refs.fileInput.click()"
        >
          <p v-if="!selectedFile">将文件拖放到此处或点击选择</p>
          <div v-else class="flex flex-col items-center">
            <span class="text-sm text-gray-600">{{ selectedFile.name }}</span>
          </div>
          <input
            ref="fileInput"
            type="file"
            @change="handleFileUpload"
            class="hidden"
          />
        </div>
        <div v-if="progress > 0" class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
          <div class="bg-blue-600 h-2.5 rounded-full" :style="{ width: `${progress}%` }"></div>
        </div>
        <div class="flex justify-end space-x-2">
          <button
            @click="$emit('close')"
            class="px-4 py-2 bg-gray-200 rounded"
            :disabled="loading"
          >
            取消
          </button>
          <button
            @click="submitFile"
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
  imageUrl: uploadedFileUrl,
  message,
  uploadFile,
  errors,
  progress,
} = useFileUpload()
const messageAPI = useMessage()
const selectedFile = ref<File | null>(null)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'upload', filename: string, url: string): void
}>()

const attemptCloseModal = () => {
  if (!loading.value) {
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
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    checkFileSize(files[0])
  }
}

const checkFileSize = (file: File) => {
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
  if (selectedFile.value) {
    uploadFile(selectedFile.value)

    watch(
      [loading],
      ([newLoading]) => {
        if (!newLoading && succeed.value) {
          emit('upload', selectedFile.value!.name, uploadedFileUrl.value)
          attemptCloseModal()
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
}
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
