<template>
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="attemptCloseModal"
  >
    <div class="bg-white p-8 rounded-lg shadow-xl w-[480px] max-w-full">
      <h2 class="text-2xl font-bold mb-6">上传文件</h2>
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
          @click="$refs.fileInput.click()"
        >
          <template v-if="!selectedFile">
            <svg class="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
            <p class="text-lg font-medium text-gray-700">
              {{ isDragging ? '松开以上传文件' : '将文件拖放到此处或点击选择' }}
            </p>
            <p class="mt-2 text-sm text-gray-500">支持所有文件类型，最大 25MB</p>
          </template>
          <div v-else class="flex flex-col items-center">
            <svg class="w-12 h-12 text-blue-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <span class="text-lg font-medium text-gray-700">{{ selectedFile.name }}</span>
            <span class="mt-1 text-sm text-gray-500">{{ formatFileSize(selectedFile.size) }}</span>
          </div>
          <input
            ref="fileInput"
            type="file"
            @change="handleFileUpload"
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
        <div class="flex justify-end space-x-4">
          <button
            @click="confirmClose"
            class="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-300"
          >
            取消
          </button>
          <button
            @click="submitFile"
            class="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!selectedFile || loading"
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
  imageUrl: uploadedFileUrl,
  uploadFile,
  errors,
  progress,
} = useFileUpload()
const messageAPI = useMessage()
const dialog = useDialog()
const selectedFile = ref<File | null>(null)
const isDragging = ref(false)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'upload', filename: string, url: string): void
}>()

const attemptCloseModal = () => {
  if (!loading.value) {
    emit('close')
  }
}

const confirmClose = () => {
  if (loading.value) {
    dialog.warning({
      title: '确认取消',
      content: '正在上传文件，确定要取消吗？\n请注意，将无法撤销此操作。',
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: () => {
        emit('close')
      }
    })
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

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>
