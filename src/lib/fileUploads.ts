import { ref } from 'vue'
import { api } from '@/lib/requests'
import type { FileUploadResponse } from '@/types/api/file'

export function useFileUpload() {
  const loading = ref(false)
  const succeed = ref(false)
  const errorsRef = ref([])
  const imageUrl = ref('')
  const message = ref('')

  const uploadFile = async (file: File) => {
    loading.value = true
    succeed.value = false
    imageUrl.value = ''

    const formData = new FormData()
    formData.append('file', file)

    try {
      const { status, data, content, errors } = await api.post<FileUploadResponse>('/api/upload/', formData)

      if (status !== 200) {
        const errorMessages = []
        if(errors) {
          for (const err of errors) {
            errorMessages.push(`${err.field}: ${err.err_msg}`)
          }
        }
        errorsRef.value = errorMessages

        throw new Error(errorMessages.join(', '))
      }

      succeed.value = true
      message.value = data.message
      imageUrl.value = content.file
    } catch (error) {
      succeed.value = false
    } finally {
      loading.value = false
    }
  }

  return {
    uploadFile,
    loading,
    succeed,
    imageUrl,
    message,
    errors: errorsRef,
  }
}
