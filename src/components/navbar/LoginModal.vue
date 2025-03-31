<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 overflow-y-auto"
    aria-labelledby="modal-title"
    role="dialog"
    aria-modal="true"
  >
    <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
      <!-- Background overlay -->
      <div
        class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        aria-hidden="true"
        @click="$emit('close')"
      ></div>

      <!-- Modal panel -->
      <div
        class="relative inline-block w-full max-w-md p-6 my-8 bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all"
      >
        <div class="w-full">
          <div class="w-full">
            <LoginForm 
              @login-success="handleLoginSuccess" 
              @close-modal="$emit('close')" 
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LoginForm from '@/components/user/loginNRegister/LoginForm.vue'
import { APILogin } from '@/types/api/user/user'

type UserProfile = APILogin['response']

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'loginSuccess', data: UserProfile): void
}>()

const handleLoginSuccess = (data: UserProfile) => {
  emit('loginSuccess', data)
}
</script>
