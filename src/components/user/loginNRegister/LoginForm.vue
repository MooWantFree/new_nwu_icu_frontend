<template>
  <section :aria-labelledby="`${formId}-heading`" class="w-full p-6">
    <header class="mb-6 pr-10">
      <h2 :id="`${formId}-heading`" class="text-xl font-semibold tracking-tight text-zinc-950">
        {{ activeMode === 'login' ? '登录账号' : '注册账号' }}
      </h2>
    </header>
    <div ref="formContent">
      <LoginTabContent
        v-if="activeMode === 'login'"
        :loading="loading"
        :id-prefix="idPrefix"
        @login-success="handleLoginSuccess"
        @update:loading="updateLoading"
        @close-modal="emit('close-modal')"
      />
      <RegisterTabContent
        v-else
        :loading="loading"
        :id-prefix="idPrefix"
        @register-success="handleRegisterSuccess"
        @update:loading="updateLoading"
      />
    </div>
    <div
      v-if="successMessage"
      role="status"
      class="mt-5 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm leading-6 text-emerald-800"
    >
      {{ successMessage }}
    </div>
    <footer class="mt-6 border-t border-zinc-100 pt-5 text-center text-sm text-zinc-500">
      <span>{{ activeMode === 'login' ? '还没有账号？' : '已有账号？' }}</span>
      <button
        type="button"
        :disabled="loading"
        class="ml-1 rounded-sm font-medium text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:cursor-wait disabled:opacity-50"
        @click="setActiveMode(activeMode === 'login' ? 'register' : 'login')"
      >
        {{ activeMode === 'login' ? '注册' : '登录' }}
      </button>
    </footer>
  </section>
</template>

<script lang="ts" setup>
import { nextTick, ref, useId } from 'vue'
import LoginTabContent from './LoginTabContent.vue'
import RegisterTabContent from './RegisterTabContent.vue'
import type { APILogin } from '@/types/api/user/user'

type UserProfile = APILogin['response']
type AuthMode = 'login' | 'register'

withDefaults(defineProps<{ idPrefix?: string }>(), { idPrefix: '' })

const formId = useId()
const formContent = ref<HTMLDivElement | null>(null)
const activeMode = ref<AuthMode>('login')
const loading = ref(false)
const successMessage = ref('')

const emit = defineEmits<{
  (e: 'close-modal'): void
  (e: 'login-success', data: UserProfile): void
}>()

const setActiveMode = async (mode: AuthMode) => {
  if (loading.value || activeMode.value === mode) return
  activeMode.value = mode
  successMessage.value = ''
  await nextTick()
  formContent.value?.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true })
}

const updateLoading = (value: boolean) => { loading.value = value }
const handleLoginSuccess = (profile: UserProfile) => { emit('login-success', profile) }
const handleRegisterSuccess = () => {
  successMessage.value = '注册成功！请检查你的邮箱，点击激活链接完成账号激活。'
}

defineExpose({
  switchToLoginTab: () => setActiveMode('login'),
  switchToSignInTabTrigger: () => setActiveMode('login'),
})
</script>
