<template>
  <div
    class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-0 overflow-y-auto"
    @click.self="attemptCloseModal"
  >
    <div class="bg-white p-5 sm:p-8 rounded-xl shadow-2xl w-full max-w-[480px] animate-fade-in">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl sm:text-2xl font-bold text-gray-800">上传文件</h2>
        <button 
          @click="confirmClose"
          class="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100"
          aria-label="关闭"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div class="space-y-5">
        <div
          class="border-2 border-dashed border-gray-300 p-6 sm:p-8 rounded-xl text-center cursor-pointer relative transition-all duration-300 ease-in-out"
          :class="{
            'bg-blue-50/70 border-blue-500': selectedFile || isDragging,
            'hover:bg-gray-50': !selectedFile && !isDragging
          }"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
          @click="$refs.fileInput.click()"
        >
          <template v-if="!selectedFile">
            <CloudUpload class="w-12 h-12 mx-auto mb-4 text-blue-400" />
            <p class="text-lg font-medium text-gray-700">
              {{ isDragging ? '松开以上传文件' : '将文件拖放到此处或点击选择' }}
            </p>
            <p class="mt-2 text-sm text-gray-500">支持所有文件类型，最大 25MB</p>
          </template>
          <div v-else class="flex flex-col items-center">
            <File class="w-12 h-12 text-blue-500 mb-4" />
            <span class="text-lg font-medium text-gray-700 break-all">{{ selectedFile.name }}</span>
            <span class="mt-1 text-sm text-gray-500">{{ formatFileSize(selectedFile.size) }}</span>
            <button 
              @click.stop="selectedFile = null" 
              class="mt-3 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600 hover:bg-gray-200 transition-colors"
            >
              重新选择
            </button>
          </div>
          <input
            ref="fileInput"
            type="file"
            @change="handleFileUpload"
            class="hidden"
          />
        </div>
        
        <div v-if="progress > 0" class="w-full bg-gray-100 rounded-full h-5 overflow-hidden">
          <div 
            class="bg-blue-500 h-full rounded-full transition-all duration-300 ease-in-out flex items-center justify-center text-xs text-white font-semibold" 
            :style="{ width: `${progress}%` }"
          >
            {{ `${Math.round(progress)}%` }}
          </div>
        </div>
        
        <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:space-x-4">
          <button
            @click="confirmClose"
            class="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-300 font-medium"
          >
            取消
          </button>
          <button
            @click="submitFile"
            class="px-5 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed font-medium"
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
import { CloudUpload, File } from 'lucide-vue-next'

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

<style scoped>
@keyframes fade-in {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
</style>
