<template>
  <form class="min-w-0 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm" novalidate @submit.prevent="saveNwuEmail">
    <header class="border-b border-zinc-100 px-5 py-5 sm:px-6">
      <h2 class="text-xl font-semibold tracking-tight text-zinc-950">邮箱设置</h2>
      <p class="mt-2 text-sm leading-6 text-zinc-500">管理主邮箱和 NWU 邮箱认证。</p>
    </header>

    <div class="space-y-6 px-5 py-6 sm:px-6">
      <div class="space-y-2">
        <label class="block text-sm font-medium text-zinc-950" :for="mainEmailId">主邮箱</label>
        <div class="flex min-w-0 gap-2">
          <input
            :id="mainEmailId"
            :value="userInfo.email"
            type="email"
            disabled
            :aria-describedby="mainEmailHintId"
            class="h-10 min-w-0 flex-1 rounded-md border border-zinc-200 bg-zinc-100 px-3 text-sm text-zinc-500 shadow-sm disabled:cursor-not-allowed"
          />
          <FieldHelpTooltip
            :id="mainEmailHintId"
            label="编辑主邮箱"
            button-text="编辑"
            aria-disabled
            content="主邮箱暂不支持修改。"
          />
        </div>
      </div>

      <div class="space-y-2">
        <div class="flex flex-wrap items-center gap-2">
          <label class="text-sm font-medium text-zinc-950" :for="nwuEmailId">NWU 邮箱</label>
          <FieldHelpTooltip
            :id="nwuEmailHintId"
            :label="`NWU 邮箱：${verificationStatus}`"
            :button-text="verificationStatus"
            badge
            content="请使用西北大学邮箱，完成验证后显示校邮认证标记。"
          >
            <template v-if="isNWUEmailVerified" #icon>
              <Check class="h-3 w-3" aria-hidden="true" />
            </template>
          </FieldHelpTooltip>
        </div>
        <div class="flex min-w-0 items-center gap-2">
          <input
            :id="nwuEmailId"
            ref="nwuEmailAddressInput"
            v-model="draftEmail"
            type="email"
            autocomplete="email"
            :disabled="!isEditing || isBusy"
            :placeholder="isEditing ? '请输入 NWU 邮箱' : '尚未绑定'"
            :aria-invalid="Boolean(nwuEmailError)"
            :aria-describedby="[nwuEmailHintId, isEditing ? nwuEmailEditHintId : '', nwuEmailError ? nwuEmailErrorId : ''].filter(Boolean).join(' ')"
            class="h-10 min-w-0 flex-1 rounded-md border px-3 text-sm text-zinc-950 shadow-sm transition-colors placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500"
            :class="nwuEmailError ? 'border-red-300 focus-visible:ring-red-400' : 'border-zinc-200 focus-visible:ring-zinc-400'"
          />
          <button v-if="!isEditing" type="button" class="shrink-0 whitespace-nowrap" :class="committedEmail && !isNWUEmailVerified ? secondaryButton : primaryButton" :disabled="isBusy" @click="beginEditing">
            {{ committedEmail ? '重新绑定' : '绑定 NWU 邮箱' }}
          </button>
        </div>
        <p v-if="isEditing" :id="nwuEmailEditHintId" class="text-xs leading-5 text-zinc-500">保存后需要重新验证 NWU 邮箱。</p>
        <p v-if="nwuEmailError" :id="nwuEmailErrorId" role="alert" class="text-sm leading-6 text-red-600">{{ nwuEmailError }}</p>
      </div>
    </div>

    <footer v-if="isEditing || (committedEmail && !isNWUEmailVerified)" class="flex flex-wrap items-center justify-end gap-2 border-t border-zinc-100 px-5 py-4 sm:px-6">
      <template v-if="isEditing">
        <button type="button" :class="secondaryButton" :disabled="isBusy" @click="cancelEditing">取消</button>
        <button type="submit" :class="primaryButton" :disabled="isBusy || resendCooldown > 0">
          <LoaderCircle v-if="isSaving" class="h-4 w-4 animate-spin" aria-hidden="true" />
          {{ isSaving ? '保存中…' : resendCooldown > 0 ? `${resendCooldown}s 后可保存` : '保存' }}
        </button>
      </template>
      <button v-else type="button" :class="primaryButton" :disabled="isBusy" @click="openVerification">验证邮箱</button>
    </footer>

    <NModal
      :show="verificationOpen"
      :mask-closable="!isBusy"
      :close-on-esc="!isBusy"
      :theme-overrides="{ color: '#ffffff', textColor: '#18181b' }"
      @update:show="handleModalVisibility"
    >
      <section role="dialog" aria-modal="true" :aria-labelledby="dialogTitleId" :aria-busy="isBusy" class="w-[calc(100vw-2rem)] max-w-[420px] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[0_20px_60px_-12px_rgba(0,0,0,0.25)]">
        <header class="flex items-start justify-between gap-4 border-b border-zinc-100 px-5 py-5 sm:px-6">
          <div class="min-w-0">
            <h2 :id="dialogTitleId" class="text-lg font-semibold tracking-tight text-zinc-950">验证你的 NWU 邮箱</h2>
            <p class="mt-2 text-sm leading-6 text-zinc-500">打开验证邮件中的链接，确认你可以访问这个邮箱。</p>
          </div>
          <button type="button" aria-label="关闭邮箱设置窗口" :disabled="isBusy" class="-mr-1 -mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:cursor-wait disabled:opacity-50" @click="closeVerification">
            <X class="h-4 w-4" aria-hidden="true" />
          </button>
        </header>
        <div class="space-y-4 px-5 py-5 sm:px-6">
          <div class="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
            <p class="text-xs text-zinc-500">验证邮件发送至</p>
            <p class="mt-1 break-all text-sm font-medium leading-6 text-zinc-950">{{ committedEmail }}</p>
          </div>
          <p class="text-sm leading-6 text-zinc-600">如果没有收到邮件，请先检查垃圾邮件，再重新发送。</p>
          <p class="text-xs leading-5 text-zinc-500">每次发送后需等待 60 秒。</p>
          <p v-if="resendError" role="alert" class="text-sm leading-6 text-red-600">{{ resendError }}</p>
        </div>
        <footer class="flex flex-col-reverse gap-2 border-t border-zinc-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button type="button" :class="secondaryButton" :disabled="isBusy" @click="closeVerification">稍后验证</button>
          <button type="button" :class="primaryButton" :disabled="isBusy || resendCooldown > 0" @click="resendVerificationEmail">
            <LoaderCircle v-if="isResending" class="h-4 w-4 animate-spin" aria-hidden="true" />
            <RotateCw v-else class="h-4 w-4" aria-hidden="true" />
            {{ resendButtonText }}
          </button>
        </footer>
      </section>
    </NModal>
  </form>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, useTemplateRef, watch } from 'vue'
import { NModal } from 'naive-ui'
import { Check, LoaderCircle, RotateCw, X } from 'lucide-vue-next'
import { api } from '@/lib/requests'
import { useShadcnToast } from '@/lib/useShadcnToast'
import { useUser } from '@/lib/useUser'
import FieldHelpTooltip from '@/components/common/FieldHelpTooltip.vue'
import { APIBindScholarEmailQuery, type APIUserProfile } from '@/types/api/user/profilePage'

const props = defineProps<{ userInfo: APIUserProfile['response'] }>()
const message = useShadcnToast()
const { userInfo: sharedUserInfo, login } = useUser(false)
const instanceId = useId()
const mainEmailId = `main-email-${instanceId}`
const mainEmailHintId = `main-email-hint-${instanceId}`
const nwuEmailId = `nwu-email-${instanceId}`
const nwuEmailHintId = `nwu-email-hint-${instanceId}`
const nwuEmailEditHintId = `nwu-email-edit-hint-${instanceId}`
const nwuEmailErrorId = `nwu-email-error-${instanceId}`
const dialogTitleId = `email-dialog-title-${instanceId}`
const primaryButton = 'inline-flex h-10 items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-50'
const secondaryButton = 'inline-flex h-10 items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-950 shadow-sm transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-50'

const committedEmail = ref(props.userInfo.college_email || '')
const draftEmail = ref(committedEmail.value)
const isNWUEmailVerified = ref(props.userInfo.verified)
const verificationStatus = computed(() => isNWUEmailVerified.value ? '已验证' : committedEmail.value ? '待验证' : '未绑定')
const isEditing = ref(false)
const isSaving = ref(false)
const isResending = ref(false)
const isBusy = computed(() => isSaving.value || isResending.value)
const nwuEmailError = ref('')
const resendError = ref('')
const verificationOpen = ref(false)
const resendCooldown = ref(0)
const nwuEmailAddressInput = useTemplateRef<HTMLInputElement>('nwuEmailAddressInput')
let cooldownTimer: ReturnType<typeof setInterval> | undefined
let cooldownDeadline = 0
let requestVersion = 0

const resendButtonText = computed(() => isResending.value ? '正在发送…' : resendCooldown.value > 0 ? `${resendCooldown.value}s 后可重新发送` : '重新发送验证邮件')
const isCurrentRequest = (version: number, userId: number) => version === requestVersion && userId === props.userInfo.id
const errorMessage = (errors: { err_msg: string }[] | undefined, fallback: string) => errors?.map(error => error.err_msg).filter(Boolean).join('；') || fallback

function clearResendCooldown() {
  if (cooldownTimer !== undefined) clearInterval(cooldownTimer)
  cooldownTimer = undefined
  cooldownDeadline = 0
  resendCooldown.value = 0
}

function startResendCooldown(seconds = 60) {
  clearResendCooldown()
  const duration = Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : 60
  cooldownDeadline = Date.now() + duration * 1000
  resendCooldown.value = duration
  cooldownTimer = setInterval(() => {
    resendCooldown.value = Math.max(0, Math.ceil((cooldownDeadline - Date.now()) / 1000))
    if (resendCooldown.value === 0) clearResendCooldown()
  }, 1000)
}

async function beginEditing() {
  if (isBusy.value) return
  draftEmail.value = committedEmail.value
  nwuEmailError.value = ''
  isEditing.value = true
  await nextTick()
  nwuEmailAddressInput.value?.focus()
}

function cancelEditing() {
  if (isBusy.value) return
  draftEmail.value = committedEmail.value
  nwuEmailError.value = ''
  isEditing.value = false
}

function openVerification() {
  if (isBusy.value || !committedEmail.value || isNWUEmailVerified.value) return
  resendError.value = ''
  verificationOpen.value = true
}

function closeVerification() {
  if (!isBusy.value) verificationOpen.value = false
}

function handleModalVisibility(show: boolean) {
  if (!show) closeVerification()
}

function syncCommittedProfile(email: string) {
  const currentUser = sharedUserInfo.value
  if (currentUser?.id === props.userInfo.id) login({ ...currentUser, college_email: email, verified: false })
}

async function saveNwuEmail() {
  if (!isEditing.value || isBusy.value || resendCooldown.value > 0) return
  nwuEmailError.value = ''
  const validation = APIBindScholarEmailQuery.safeParse({ college_email: draftEmail.value.trim().toLowerCase() })
  if (!validation.success) {
    const firstError = validation.error.errors[0]
    nwuEmailError.value = firstError?.code === 'invalid_string' ? '请输入有效的 NWU 邮箱地址' : firstError?.message || '邮箱格式不正确'
    nwuEmailAddressInput.value?.focus()
    return
  }

  const email = validation.data.college_email
  const userId = props.userInfo.id
  const version = ++requestVersion
  isSaving.value = true
  try {
    const response = await api.post({ url: '/api/user/bind-college-email/bind/', query: validation.data })
    if (!isCurrentRequest(version, userId)) return
    if (response.status === 429) {
      startResendCooldown(response.retryAfter ?? 60)
      nwuEmailError.value = errorMessage(response.errors, '操作过于频繁，请稍后再试')
      message.warning(nwuEmailError.value)
      return
    }
    if (response.status < 200 || response.status >= 300) {
      nwuEmailError.value = errorMessage(response.errors, '绑定失败，请重试')
      message.error(nwuEmailError.value)
      return
    }

    committedEmail.value = email
    draftEmail.value = email
    isNWUEmailVerified.value = false
    isEditing.value = false
    resendError.value = ''
    startResendCooldown()
    verificationOpen.value = true
    syncCommittedProfile(email)
    message.success('验证邮件已发送')
  } catch {
    if (!isCurrentRequest(version, userId)) return
    nwuEmailError.value = '绑定失败，请稍后重试'
    message.error(nwuEmailError.value)
  } finally {
    if (isCurrentRequest(version, userId)) isSaving.value = false
  }
}

async function resendVerificationEmail() {
  if (isBusy.value || resendCooldown.value > 0 || !committedEmail.value || isNWUEmailVerified.value) return
  const email = committedEmail.value
  const userId = props.userInfo.id
  const version = ++requestVersion
  isResending.value = true
  resendError.value = ''
  try {
    const response = await api.post({ url: '/api/user/bind-college-email/bind/', query: { college_email: email } })
    if (!isCurrentRequest(version, userId)) return
    if (response.status === 429) {
      startResendCooldown(response.retryAfter ?? 60)
      resendError.value = errorMessage(response.errors, `发送过于频繁，请在 ${resendCooldown.value} 秒后重试`)
      message.warning(resendError.value)
      return
    }
    if (response.status < 200 || response.status >= 300) {
      resendError.value = errorMessage(response.errors, '验证邮件发送失败，请稍后重试')
      message.error(resendError.value)
      return
    }
    startResendCooldown()
    message.success('验证邮件已重新发送')
  } catch {
    if (!isCurrentRequest(version, userId)) return
    resendError.value = '验证邮件发送失败，请稍后重试'
    message.error(resendError.value)
  } finally {
    if (isCurrentRequest(version, userId)) isResending.value = false
  }
}

watch(() => props.userInfo.id, () => {
  requestVersion += 1
  clearResendCooldown()
  committedEmail.value = props.userInfo.college_email || ''
  draftEmail.value = committedEmail.value
  isNWUEmailVerified.value = props.userInfo.verified
  isEditing.value = false
  isSaving.value = false
  isResending.value = false
  verificationOpen.value = false
  nwuEmailError.value = ''
  resendError.value = ''
})
watch(() => props.userInfo.verified, verified => {
  if (isBusy.value || (props.userInfo.college_email || '') !== committedEmail.value) return
  isNWUEmailVerified.value = verified
  if (verified) verificationOpen.value = false
})
onBeforeUnmount(() => { requestVersion += 1; clearResendCooldown() })
</script>
