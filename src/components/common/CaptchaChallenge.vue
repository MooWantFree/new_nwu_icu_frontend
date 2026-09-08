<template>
  <NModal :show="visible" :mask-closable="!submitting" @update:show="cancel">
    <section role="dialog" aria-modal="true" aria-labelledby="captcha-challenge-title" class="w-[calc(100vw-2rem)] max-w-md rounded-xl bg-white p-6 shadow-xl">
      <h2 id="captcha-challenge-title" class="text-lg font-semibold text-gray-900">请完成人机验证</h2>
      <p class="mt-1 text-sm text-gray-500">操作较为频繁，验证后会自动重试刚才的操作。</p>
      <div class="mt-5">
        <CaptchaInput
          id="step-up-captcha"
          v-model="value"
          label="验证码"
          placeholder="请输入图片中的字符"
          required
          :error="error"
          :image-url="imageUrl"
          @refresh="loadCaptcha"
        />
      </div>
      <div class="mt-5 flex justify-end gap-3">
        <button type="button" class="rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" :disabled="submitting" @click="cancel()">取消</button>
        <button type="button" class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50" :disabled="submitting || !value.trim() || !key" @click="verify">
          {{ submitting ? '验证中…' : '验证并继续' }}
        </button>
      </div>
    </section>
  </NModal>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { NModal } from 'naive-ui'
import CaptchaInput from '@/components/user/loginNRegister/CaptchaInput.vue'
import { api } from '@/lib/requests'
import { registerCaptchaChallengeHandler, type CaptchaScope } from '@/lib/captchaChallenge'

const visible = ref(false)
const submitting = ref(false)
const imageUrl = ref('')
const key = ref('')
const value = ref('')
const error = ref('')
let scope: CaptchaScope = 'login'
let settle: ((proof: string | null) => void) | undefined

async function loadCaptcha() {
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
