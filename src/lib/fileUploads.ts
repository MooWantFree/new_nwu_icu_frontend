import { ref } from 'vue'
import { api } from '@/lib/requests'

export function useFileUpload() {
  const loading = ref(false)
  const succeed = ref(false)
  const errorsRef = ref<string[]>([])
  const imageUrl = ref('')
  const message = ref('')
  const progress = ref(0)

  const uploadFile = async (file: File) => {
    loading.value = true
    succeed.value = false
    imageUrl.value = ''
    progress.value = 0

    const formData = new FormData()
    formData.append('file', file)

    try {
      const { status, data, content, errors } = await api.post({
        url: '/api/upload/',
        query: formData,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            progress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          }
        },
      })

      if (status.toString().startsWith('4') || status.toString().startsWith('5')) {
        const errorMessages = errors ? errors.map(err => `${err.field}: ${err.err_msg}`) : []
        errorsRef.value = errorMessages
        throw new Error(errorMessages.join(', '))
      }

      succeed.value = true
      message.value = data.message
      imageUrl.value = `/api/download/${content.uuid}/`
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
    progress,
  }
}
