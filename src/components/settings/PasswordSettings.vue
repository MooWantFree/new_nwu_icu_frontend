<template>
  <form
    class="min-w-0 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm"
    novalidate
    :aria-busy="isSubmitting"
    @submit.prevent="handleSubmit"
  >
    <header class="border-b border-zinc-100 px-5 py-5 sm:px-6">
      <h2 class="text-xl font-semibold tracking-tight text-zinc-950">修改密码</h2>
      <p class="mt-2 text-sm leading-6 text-zinc-500">修改成功后需要重新登录。</p>
    </header>

    <div class="space-y-6 px-5 py-6 sm:px-6">
      <div v-for="field in fields" :key="field.name" class="space-y-2">
        <label :for="`settings-${field.name}`" class="block text-sm font-medium text-zinc-950">
          {{ field.label }}
        </label>
        <div class="relative">
          <input
            :id="`settings-${field.name}`"
            v-model="formData[field.name]"
            :name="field.name"
            :type="showPasswords[field.name] ? 'text' : 'password'"
            :autocomplete="field.autocomplete"
            :disabled="isSubmitting"
            aria-required="true"
            :aria-invalid="Boolean(errors[field.name])"
            :aria-describedby="[
              field.name === 'new_password' ? 'settings-new-password-hint' : '',
              errors[field.name] ? `settings-${field.name}-error` : '',
            ].filter(Boolean).join(' ') || undefined"
            class="h-10 w-full rounded-md border bg-white py-2 pl-3 pr-10 text-sm text-zinc-950 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-wait disabled:bg-zinc-50 disabled:opacity-50"
            :class="errors[field.name] ? 'border-red-300 focus-visible:ring-red-400' : 'border-zinc-200 focus-visible:ring-zinc-400'"
          />
          <button
            type="button"
            :aria-label="`${showPasswords[field.name] ? '隐藏' : '显示'}${field.label}`"
            :aria-pressed="showPasswords[field.name]"
            :disabled="isSubmitting"
            class="absolute right-1 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-sm text-zinc-400 transition-colors hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:cursor-wait disabled:opacity-50"
            @click="showPasswords[field.name] = !showPasswords[field.name]"
          >
            <EyeOff v-if="showPasswords[field.name]" class="h-4 w-4" aria-hidden="true" />
            <Eye v-else class="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <p v-if="field.name === 'new_password'" id="settings-new-password-hint" class="text-xs leading-5 text-zinc-500">
          8–30 个字符，需包含大写字母、小写字母和数字。
        </p>
        <p v-if="errors[field.name]" :id="`settings-${field.name}-error`" class="text-sm leading-6 text-red-600">
          {{ errors[field.name] }}
        </p>
      </div>

      <div
        v-if="generalError"
        ref="errorAlert"
        role="alert"
        tabindex="-1"
        class="grid grid-cols-[1rem_1fr] items-start gap-x-3 gap-y-1 rounded-lg border border-red-200 bg-white p-4 text-sm text-red-700 outline-none"
      >
        <CircleAlert class="mt-0.5 h-4 w-4" aria-hidden="true" />
        <p class="font-medium leading-5">密码修改失败</p>
        <p class="col-start-2 break-words leading-6">{{ generalError }}</p>
      </div>
    </div>

    <footer class="flex justify-end border-t border-zinc-100 px-5 py-4 sm:px-6">
      <button
        type="submit"
        :disabled="isSubmitting"
        class="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-50 sm:w-auto"
      >
        <LoaderCircle v-if="isSubmitting" class="h-4 w-4 animate-spin" aria-hidden="true" />
        {{ isSubmitting ? '保存中…' : '保存更改' }}
      </button>
    </footer>
  </form>
</template>

<script setup lang="ts">
import { nextTick, ref, useTemplateRef } from 'vue'
import { z } from 'zod'
import { CircleAlert, Eye, EyeOff, LoaderCircle } from 'lucide-vue-next'
import { api } from '@/lib/requests'
import { APIUserResetPasswordQuery } from '@/types/api/user/resetPassword'
import { useUser } from '@/lib/useUser'
import { useShadcnToast } from '@/lib/useShadcnToast'
import { useRouter } from 'vue-router'

const message = useShadcnToast()
const user = useUser()
const router = useRouter()
type FormData = z.infer<typeof APIUserResetPasswordQuery>
type PasswordField = keyof FormData

const fields = [
  { name: 'old_password', label: '当前密码', autocomplete: 'current-password' },
  { name: 'new_password', label: '新密码', autocomplete: 'new-password' },
  { name: 'confirm_password', label: '确认新密码', autocomplete: 'new-password' },
] as const

const emptyPasswords = (): FormData => ({ old_password: '', new_password: '', confirm_password: '' })
const formData = ref(emptyPasswords())
const errors = ref(emptyPasswords())
const generalError = ref('')
const showPasswords = ref({ old_password: false, new_password: false, confirm_password: false })
const isSubmitting = ref(false)
const errorAlert = useTemplateRef<HTMLElement>('errorAlert')

const focusFirstError = async () => {
  await nextTick()
  const field = fields.find(field => errors.value[field.name])
  if (field) document.getElementById(`settings-${field.name}`)?.focus({ preventScroll: true })
  else if (generalError.value) errorAlert.value?.focus({ preventScroll: true })
}

const validateForm = () => {
  if (!formData.value.old_password) errors.value.old_password = '请输入当前密码'
  if (!formData.value.new_password) errors.value.new_password = '请输入新密码'
  if (!formData.value.confirm_password) errors.value.confirm_password = '请再次输入新密码'
  const result = APIUserResetPasswordQuery.safeParse(formData.value)
  if (!result.success) {
    for (const error of result.error.errors) {
      const field = error.path[0] as PasswordField
      if (field in errors.value && !errors.value[field]) errors.value[field] = error.message
    }
  }
  return result.success && !Object.values(errors.value).some(Boolean) ? result.data : null
}

const passwordErrorFields: Record<string, PasswordField> = {
  password_old_not_true: 'old_password',
  password_re_not_consistent: 'confirm_password',
  password_re_equal_old: 'new_password',
  password_invalid_char: 'new_password',
  password_not_match_length: 'new_password',
}

const showApiErrors = (apiErrors: { field: string; err_code: string; err_msg: string }[] | undefined) => {
  const details = apiErrors?.map(error => error.err_msg).filter(Boolean) ?? []
  const generalDetails: string[] = []
  for (const error of apiErrors ?? []) {
    const field = passwordErrorFields[error.err_code]
      ?? fields.find(field => field.name === error.field)?.name
    if (field) {
      if (!errors.value[field]) errors.value[field] = error.err_msg
    } else if (error.err_msg) {
      generalDetails.push(error.err_msg)
    }
  }
  const fallback = '密码修改失败，请稍后重试'
  generalError.value = generalDetails.join('；') || (details.length ? '' : fallback)
  message.error(details.join('；') || fallback)
}

const handleSubmit = async () => {
  if (isSubmitting.value) return
  errors.value = emptyPasswords()
  generalError.value = ''
  const payload = validateForm()
  if (!payload) {
    await focusFirstError()
    return
  }

  isSubmitting.value = true
  try {
    const resp = await api.post({ url: '/api/user/reset-login/', query: payload })
    if (resp.status !== 200) {
      showApiErrors(resp.errors)
      return
    }
    message.success('密码修改成功，请重新登录')
    user.logout()
    formData.value = emptyPasswords()
    showPasswords.value = { old_password: false, new_password: false, confirm_password: false }
    void router.push('/')
  } catch {
    showApiErrors(undefined)
  } finally {
    isSubmitting.value = false
    await focusFirstError()
  }
}
</script>
