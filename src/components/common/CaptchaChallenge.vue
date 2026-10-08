<template>
  <ShadcnModal :show="visible" title="请完成人机验证" :busy="submitting" :mask-closable="!submitting" @update:show="cancel">
    <div role="dialog" aria-modal="true" aria-labelledby="captcha-challenge-title" class="max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-md overflow-y-auto rounded-xl border border-zinc-200 bg-white p-5 text-zinc-950 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.25)] outline-none sm:p-6">
      <h2 id="captcha-challenge-title" class="text-lg font-semibold tracking-tight">请完成人机验证</h2>
      <p class="mt-1.5 text-sm leading-6 text-zinc-500">操作较为频繁，验证后会自动重试刚才的操作。</p>
      <div class="captcha-challenge-field mt-5">
        <CaptchaInput
          id="step-up-captcha"
          v-model="value"
          label="验证码"
          placeholder="请输入图片中的字符"
          required
          :error="error"
          :image-url="imageUrl"
          :loading="isLoadingCaptcha"
          @refresh="loadCaptcha"
          @error="error = '验证码加载失败，请稍后重试'"
        />
      </div>
      <div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" class="inline-flex h-10 items-center justify-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-950 shadow-sm transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" :disabled="submitting" @click="cancel()">取消</button>
        <button type="button" class="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" :disabled="submitting || !value.trim() || !key" @click="verify">
          <LoaderCircle v-if="submitting" class="h-4 w-4 animate-spin" aria-hidden="true" />
          {{ submitting ? '验证中…' : '验证并继续' }}
        </button>
      </div>
    </div>
  </ShadcnModal>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import ShadcnModal from '@/components/common/ShadcnModal.vue'
import { LoaderCircle } from 'lucide-vue-next'
import CaptchaInput from '@/components/user/loginNRegister/CaptchaInput.vue'
import { api } from '@/lib/requests'
import { registerCaptchaChallengeHandler, type CaptchaScope } from '@/lib/captchaChallenge'

const visible = ref(false)
const submitting = ref(false)
const isLoadingCaptcha = ref(false)
const imageUrl = ref('')
const key = ref('')
const value = ref('')
const error = ref('')
let scope: CaptchaScope = 'login'
let settle: ((proof: string | null) => void) | undefined

async function loadCaptcha() {
  if (isLoadingCaptcha.value) return
  isLoadingCaptcha.value = true
  error.value = ''
  value.value = ''
  imageUrl.value = ''
  key.value = ''
  try {
    const response = await api.get({ url: '/api/captcha/' })
    if (response.status === 200) {
      key.value = response.content.key
      imageUrl.value = response.content.image_url
      return
    }
    error.value = '验证码加载失败，请稍后重试'
  } catch {
    error.value = '验证码加载失败，请稍后重试'
  } finally {
    isLoadingCaptcha.value = false
  }
}

function open(nextScope: CaptchaScope) {
  if (settle) settle(null)
  scope = nextScope
  visible.value = true
  void loadCaptcha()
  return new Promise<string | null>(resolve => { settle = resolve })
}

async function verify() {
  if (!key.value || !value.value.trim()) return
  submitting.value = true
  error.value = ''
  try {
    const response = await api.post({
      url: '/api/captcha/',
      query: { captcha_key: key.value, captcha_value: value.value.trim(), scope },
    })
    if (response.status === 200 && response.content.captcha_proof) {
      const resolve = settle
      settle = undefined
      visible.value = false
      resolve?.(response.content.captcha_proof)
      return
    }
    const message = response.errors?.[0]?.err_msg || '验证码错误，请重试'
    await loadCaptcha()
    error.value = message
  } catch {
    error.value = '验证失败，请检查网络后重试'
  } finally {
    submitting.value = false
  }
}

function cancel(show = false) {
  if (show || submitting.value) return
  visible.value = false
  const resolve = settle
  settle = undefined
  resolve?.(null)
}

onMounted(() => registerCaptchaChallengeHandler(open))
onBeforeUnmount(() => {
  registerCaptchaChallengeHandler(undefined)
  settle?.(null)
})
</script>

<style scoped>
.captcha-challenge-field :deep(#step-up-captcha-error) {
  margin-top: 0.75rem;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  background: #fef2f2;
  padding: 0.75rem;
  color: #b91c1c;
  font-size: 0.875rem;
  line-height: 1.5rem;
}
</style>
