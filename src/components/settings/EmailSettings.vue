<template>
  <div class="mb-4 bg-white p-6">
    <h2 class="mb-4 text-xl font-semibold">邮箱设置</h2>
    <div class="space-y-5">
      <div>
        <label class="mb-1.5 block text-sm font-medium text-gray-700">主邮箱</label>
        <div class="flex">
          <input
            type="text"
            :value="mainEmailAddress"
            disabled
            class="min-w-0 flex-grow rounded-l-[10px] border border-gray-300 bg-gray-100 px-3 py-2 text-gray-700"
          />
          <button
            type="button"
            class="min-h-10 rounded-r-[10px] bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            @click="openDialog('main-email')"
          >
            编辑
          </button>
        </div>
      </div>

      <div>
        <label class="mb-1.5 block text-sm font-medium text-gray-700">NWU 邮箱</label>
        <div class="flex">
          <input
            ref="nwuEmailAddressInput"
            v-model="nwuEmailAddress"
            type="email"
            :disabled="!editNwuEmailAddress"
            :placeholder="editNwuEmailAddress ? '请输入 NWU 邮箱' : '暂无'"
            class="min-w-0 flex-grow rounded-l-[10px] border border-gray-300 px-3 py-2 text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            :class="{
              'bg-gray-100': !editNwuEmailAddress,
              'border-red-500': nwuEmailError,
            }"
          />
          <button
            v-if="!nwuEmailAddress || editNwuEmailAddress"
            type="button"
            class="flex min-h-10 items-center justify-center rounded-r-[10px] bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
            :disabled="isLoadingBindNWUEmail"
            @click="handleNwuEmailAction"
          >
            <LoaderCircle v-if="isLoadingBindNWUEmail" class="mr-2 h-4 w-4 animate-spin" />
            {{ isLoadingBindNWUEmail ? '正在保存' : editNwuEmailAddress ? '保存' : '绑定' }}
          </button>
          <button
            v-else-if="!isNWUEmailVerified"
            type="button"
            class="flex min-h-10 items-center justify-center rounded-r-[10px] bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600"
            @click="openDialog('verification')"
          >
            等待验证
          </button>
          <button
            v-else
            type="button"
            class="flex min-h-10 items-center justify-center rounded-r-[10px] bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            @click="openDialog('college-email')"
          >
            编辑
          </button>
        </div>
        <p v-if="nwuEmailError" class="mt-1.5 text-sm text-red-600">
          {{ nwuEmailError }}
        </p>
        <p v-else-if="nwuEmailAddress && !isNWUEmailVerified" class="mt-1.5 text-xs text-amber-700">
          验证后将获得 NWU 身份标识。
        </p>
      </div>
    </div>

    <NModal
      :show="activeDialog !== null"
      :mask-closable="!isResending"
      @update:show="handleModalVisibility"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-dialog-title"
        class="w-[calc(100vw-2rem)] max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex min-w-0 items-start gap-3.5">
            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">
              <MailCheck v-if="activeDialog === 'verification'" class="h-5 w-5" />
              <Mail v-else class="h-5 w-5" />
            </div>
            <div class="min-w-0 pt-0.5">
              <h2 id="email-dialog-title" class="text-lg font-semibold text-gray-900">
                {{ dialogTitle }}
              </h2>
              <p class="mt-1 text-sm leading-6 text-gray-500">
                {{ dialogDescription }}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="关闭邮箱设置窗口"
            class="-mr-2 -mt-2 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="isResending"
            @click="closeDialog"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <template v-if="activeDialog === 'verification'">
          <div class="mt-5 rounded-xl border border-blue-100 bg-blue-50/70 p-4">
            <p class="text-xs font-medium uppercase tracking-wide text-blue-700">验证邮件发送至</p>
            <p class="mt-1 break-all text-sm font-semibold text-gray-900">{{ nwuEmailAddress }}</p>
          </div>
          <p class="mt-4 text-sm leading-6 text-gray-600">
            点击邮件中的验证链接即可完成绑定。没有收到时，请先检查垃圾邮件，再重新发送。
          </p>
          <p class="mt-2 text-xs text-gray-400">为避免重复邮件，每次发送后需等待 60 秒。</p>
          <div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" class="btn-secondary" :disabled="isResending" @click="closeDialog">
              稍后验证
            </button>
            <button
              type="button"
              class="btn-primary min-w-44"
              :disabled="isResending || resendCooldown > 0"
              @click="resendVerificationEmail"
            >
              <LoaderCircle v-if="isResending" class="h-4 w-4 animate-spin" />
              <RotateCw v-else class="h-4 w-4" />
              {{ resendButtonText }}
            </button>
          </div>
        </template>
        <div v-else class="mt-6 flex justify-end">
          <button type="button" class="btn-primary" @click="closeDialog">我知道了</button>
        </div>
      </section>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useTemplateRef } from 'vue'
import { NModal, useMessage } from 'naive-ui'
import { LoaderCircle, Mail, MailCheck, RotateCw, X } from 'lucide-vue-next'
import { api } from '@/lib/requests'
import {
  APIBindScholarEmailQuery,
  type APIUserProfile,
} from '@/types/api/user/profilePage'

type EmailDialog = 'main-email' | 'college-email' | 'verification'

const props = defineProps<{
  userInfo: APIUserProfile['response']
}>()

const message = useMessage()
const mainEmailAddress = ref(props.userInfo.email)
const nwuEmailAddress = ref(props.userInfo.college_email || '')
const editNwuEmailAddress = ref(false)
const isNWUEmailVerified = ref(props.userInfo.verified)
const isLoadingBindNWUEmail = ref(false)
const isResending = ref(false)
const nwuEmailError = ref('')
const activeDialog = ref<EmailDialog | null>(null)
const resendCooldown = ref(0)
const nwuEmailAddressInput = useTemplateRef('nwuEmailAddressInput')
let cooldownTimer: ReturnType<typeof setInterval> | undefined

const dialogTitle = computed(() => {
  if (activeDialog.value === 'verification') return '验证你的 NWU 邮箱'
  if (activeDialog.value === 'college-email') return 'NWU 邮箱暂不支持修改'
  return '主邮箱暂不支持修改'
})

const dialogDescription = computed(() => {
  if (activeDialog.value === 'verification') return '我们需要确认你可以访问这个邮箱。'
  return '如有特殊情况需要更换邮箱，请联系我们协助处理。'
})

const resendButtonText = computed(() => {
  if (isResending.value) return '正在发送'
  if (resendCooldown.value > 0) return `${resendCooldown.value}s 后可重新发送`
  return '重新发送验证邮件'
})

function openDialog(dialog: EmailDialog) {
  activeDialog.value = dialog
}

function closeDialog() {
  if (!isResending.value) activeDialog.value = null
}

function handleModalVisibility(show: boolean) {
  if (!show) closeDialog()
}

function startResendCooldown(seconds = 60) {
  if (cooldownTimer) clearInterval(cooldownTimer)
  resendCooldown.value = Math.max(1, Math.ceil(seconds))
  cooldownTimer = setInterval(() => {
    resendCooldown.value -= 1
    if (resendCooldown.value <= 0 && cooldownTimer) {
      clearInterval(cooldownTimer)
      cooldownTimer = undefined
    }
  }, 1000)
}

async function handleNwuEmailAction() {
  if (!editNwuEmailAddress.value) {
    editNwuEmailAddress.value = true
    await nextTick()
    nwuEmailAddressInput.value?.focus()
    return
  }

  try {
    nwuEmailError.value = ''
    const validationResult = APIBindScholarEmailQuery.safeParse({
      college_email: nwuEmailAddress.value,
    })
    if (!validationResult.success) {
      nwuEmailError.value = validationResult.error.errors[0]?.message || '邮箱格式不正确'
      return
    }

    isLoadingBindNWUEmail.value = true
    const response = await api.post({
      url: '/api/user/bind-college-email/bind/',
      query: validationResult.data,
    })
    if (response.status === 429) {
      startResendCooldown(response.retryAfter ?? 60)
      throw new Error('操作过于频繁，请稍后再试')
    }
    if (!response.status.toString().startsWith('2')) {
      throw new Error(response.errors?.[0]?.err_msg || '绑定失败，请重试')
    }

    nwuEmailAddress.value = validationResult.data.college_email
    editNwuEmailAddress.value = false
    isNWUEmailVerified.value = false
    startResendCooldown(60)
    openDialog('verification')
    message.success('验证邮件已发送')
  } catch (error) {
    nwuEmailError.value = error instanceof Error ? error.message : '绑定失败，请重试'
  } finally {
    isLoadingBindNWUEmail.value = false
  }
}

async function resendVerificationEmail() {
  if (isResending.value || resendCooldown.value > 0 || !nwuEmailAddress.value) return
  isResending.value = true
  try {
    const response = await api.post({
      url: '/api/user/bind-college-email/bind/',
      query: { college_email: nwuEmailAddress.value },
    })
    if (response.status === 429) {
      const wait = response.retryAfter ?? 60
      startResendCooldown(wait)
      message.warning(`发送过于频繁，请在 ${wait} 秒后重试`)
      return
    }
    if (!response.status.toString().startsWith('2')) {
      throw new Error(response.errors?.[0]?.err_msg || '验证邮件发送失败')
    }
    startResendCooldown(60)
    message.success('验证邮件已重新发送')
  } catch (error) {
    message.error(error instanceof Error ? error.message : '验证邮件发送失败，请稍后重试')
  } finally {
    isResending.value = false
  }
}

onBeforeUnmount(() => {
  if (cooldownTimer) clearInterval(cooldownTimer)
})
</script>
