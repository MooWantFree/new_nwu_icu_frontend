<template>
  <form class="min-w-0 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm" novalidate @submit.prevent="handleSubmit">
    <header class="border-b border-zinc-100 px-5 py-5 sm:px-6">
      <h2 class="text-xl font-semibold tracking-tight text-zinc-950">编辑个人资料</h2>
    </header>

    <div class="space-y-6 px-5 py-6 sm:px-6">
      <div>
        <p class="text-sm font-medium text-zinc-950">头像</p>
        <div class="mt-4 flex justify-center">
          <button
            type="button"
            aria-label="更换头像"
            class="group inline-flex rounded-full text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-4 disabled:cursor-wait disabled:opacity-50"
            :disabled="isSubmitting"
            @click="showImageUpload = true"
          >
            <span class="relative block h-32 w-32 rounded-full border border-zinc-200 bg-white p-1 shadow-sm">
              <span class="relative block h-full w-full overflow-hidden rounded-full bg-zinc-100">
                <UserAvatar
                  :avatar="displayedAvatar"
                  :uuid="userInfo.uuid"
                  :has-avatar="displayedHasAvatar"
                  :alt="`${userInfo.nickname}的头像`"
                  class="h-full w-full rounded-full object-cover motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:scale-105"
                />
                <span aria-hidden="true" class="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  <Camera class="h-7 w-7 text-white" />
                </span>
              </span>
              <span aria-hidden="true" class="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-4 border-white bg-zinc-950 text-white shadow-sm">
                <Camera class="h-4 w-4" />
              </span>
            </span>
          </button>
        </div>
        <p v-if="errors.avatar_uuid" role="alert" class="mt-2 text-sm text-red-600">{{ errors.avatar_uuid }}</p>
      </div>

      <div class="space-y-2">
        <div class="flex items-center gap-1.5">
          <label class="text-sm font-medium text-zinc-950" for="profile-username">用户名</label>
          <FieldHelpTooltip id="profile-username-hint" label="用户名说明" content="用户名用于登录，暂不支持修改。" />
        </div>
        <input
          id="profile-username"
          :value="userInfo.username"
          type="text"
          disabled
          aria-describedby="profile-username-hint"
          class="h-10 w-full rounded-md border border-zinc-200 bg-zinc-100 px-3 text-sm text-zinc-500 shadow-sm disabled:cursor-not-allowed"
        />
      </div>

      <div class="space-y-2">
        <div class="flex items-center gap-1.5">
          <label class="text-sm font-medium text-zinc-950" for="profile-nickname">昵称</label>
          <FieldHelpTooltip id="profile-nickname-hint" label="昵称说明" :content="nicknameHint" />
        </div>
        <input
          id="profile-nickname"
          v-model="formData.nickname"
          type="text"
          maxlength="30"
          autocomplete="nickname"
          :disabled="isSubmitting"
          :aria-invalid="Boolean(errors.nickname)"
          :aria-describedby="errors.nickname ? 'profile-nickname-hint profile-nickname-error' : 'profile-nickname-hint'"
          class="h-10 w-full rounded-md border bg-white px-3 text-sm text-zinc-950 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-50"
          :class="errors.nickname ? 'border-red-300 focus-visible:ring-red-400' : 'border-zinc-200 focus-visible:ring-zinc-400'"
          @compositionstart="startNicknameComposition"
          @compositionend="endNicknameComposition"
        />
        <p v-if="errors.nickname" id="profile-nickname-error" class="text-sm text-red-600">{{ errors.nickname }}</p>
      </div>

      <div class="space-y-2">
        <label class="block text-sm font-medium text-zinc-950" for="profile-bio">个人简介</label>
        <textarea
          id="profile-bio"
          v-model="formData.bio"
          rows="4"
          maxlength="255"
          placeholder="简单介绍一下自己"
          :disabled="isSubmitting"
          :aria-invalid="Boolean(errors.bio)"
          :aria-describedby="errors.bio ? 'profile-bio-count profile-bio-error' : 'profile-bio-count'"
          class="block min-h-28 w-full resize-y rounded-md border bg-white px-3 py-2 text-sm leading-6 text-zinc-950 shadow-sm transition-colors placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-50"
          :class="errors.bio ? 'border-red-300 focus-visible:ring-red-400' : 'border-zinc-200 focus-visible:ring-zinc-400'"
        />
        <div class="flex items-start justify-between gap-3">
          <p v-if="errors.bio" id="profile-bio-error" class="text-sm text-red-600">{{ errors.bio }}</p>
          <p id="profile-bio-count" class="ml-auto shrink-0 text-xs tabular-nums leading-5 text-zinc-500">{{ formData.bio.length }} / 255</p>
        </div>
      </div>

      <div v-if="generalError" role="alert" class="grid grid-cols-[1rem_1fr] items-start gap-x-3 gap-y-1 rounded-lg border border-red-200 bg-white p-4 text-sm text-red-700">
        <CircleAlert class="mt-0.5 h-4 w-4" aria-hidden="true" />
        <p class="font-medium leading-5">保存失败</p>
        <p class="col-start-2 break-words leading-6">{{ generalError }}</p>
      </div>
    </div>

    <footer class="flex justify-end border-t border-zinc-100 px-5 py-4 sm:px-6">
      <button
        type="submit"
        class="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-50 sm:w-auto"
        :disabled="isSubmitting"
      >
        <LoaderCircle v-if="isSaving" class="h-4 w-4 animate-spin" aria-hidden="true" />
        {{ isSaving ? '保存中…' : '保存更改' }}
      </button>
    </footer>
    <AvatarUpload v-if="showImageUpload" :binding="isAvatarBinding" @close="showImageUpload = false" @upload="handleImageUpload" />
  </form>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { z } from 'zod'
import type { MessageReactive } from 'naive-ui'
import { Camera, CircleAlert, LoaderCircle } from 'lucide-vue-next'
import { APIUpdateProfileBody, type APIUserProfile } from '@/types/api/user/profilePage'
import { api } from '@/lib/requests'
import { useUser } from '@/lib/useUser'
import { useShadcnToast } from '@/lib/useShadcnToast'
import AvatarUpload from './AvatarUpload.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import FieldHelpTooltip from '@/components/common/FieldHelpTooltip.vue'

const { userInfo } = defineProps<{ userInfo: APIUserProfile['response'] }>()
const message = useShadcnToast()
const { fetchUserInfo } = useUser(false)
const profileSchema = APIUpdateProfileBody.pick({ nickname: true, bio: true })
const nicknameSymbols = '! @ # $ % ^ & * ( ) _ + ~ - = { }'
const nicknameHint = `2–30 个字符，可使用中文、英文字母、数字及这些半角符号：${nicknameSymbols}。不支持空格或其他字符。`
const nicknameFormatError = `昵称只能使用中文、英文字母、数字和这些半角符号：${nicknameSymbols}`
const formData = ref({ nickname: userInfo.nickname, bio: userInfo.bio ?? '' })
const displayedAvatar = ref(userInfo.avatar)
const displayedHasAvatar = ref(userInfo.has_avatar)
const errors = ref({ nickname: '', avatar_uuid: '', bio: '' })
const generalError = ref('')
const showImageUpload = ref(false)
const isSaving = ref(false)
const isAvatarBinding = ref(false)
const isSubmitting = computed(() => isSaving.value || isAvatarBinding.value)
let isNicknameComposing = false
let nicknameToast: MessageReactive | undefined
let generalApiErrors: { field: string; err_msg: string }[] = []

const closeNicknameToast = () => {
  const previous = nicknameToast
  nicknameToast = undefined
  previous?.destroy()
}

const nicknameError = (value: string) => {
  const result = APIUpdateProfileBody.shape.nickname.safeParse(value)
  if (result.success) return ''
  return result.error.issues.some(issue => issue.code === 'too_small' || issue.code === 'too_big')
    ? '昵称长度需要在 2–30 个字符之间'
    : nicknameFormatError
}

const showNicknameValidation = (value: string) => {
  const error = nicknameError(value)
  errors.value.nickname = error
  if (!error) {
    closeNicknameToast()
    return
  }
  if (nicknameToast) {
    nicknameToast.content = error
    return
  }
  const toast = message.error(error, {
    duration: 0,
    onClose: () => { if (nicknameToast === toast) nicknameToast = undefined },
    onAfterLeave: () => { if (nicknameToast === toast) nicknameToast = undefined },
  })
  nicknameToast = toast
}

const clearNicknameApiError = () => {
  if (!generalApiErrors.some(error => error.field === 'nickname')) return
  generalApiErrors = generalApiErrors.filter(error => error.field !== 'nickname')
  generalError.value = generalApiErrors.map(error => error.err_msg).filter(Boolean).join('；')
}

watch(() => formData.value.nickname, value => {
  if (isNicknameComposing || isSubmitting.value) return
  clearNicknameApiError()
  showNicknameValidation(value)
})

const startNicknameComposition = () => {
  isNicknameComposing = true
  errors.value.nickname = ''
  closeNicknameToast()
}

const endNicknameComposition = (event: CompositionEvent) => {
  isNicknameComposing = false
  if (isSubmitting.value) return
  const value = (event.target as HTMLInputElement).value
  showNicknameValidation(value)
}

onBeforeUnmount(closeNicknameToast)

const showApiErrors = (apiErrors: { field: string; err_msg: string }[] | undefined, fallback: string) => {
  generalApiErrors = apiErrors ?? []
  const details = apiErrors?.map(error => error.err_msg).filter(Boolean) ?? []
  for (const error of apiErrors ?? []) {
    const field = error.field === 'avatar' ? 'avatar_uuid' : error.field
    if (field in errors.value) errors.value[field as keyof typeof errors.value] = error.err_msg
  }
  generalError.value = details.join('；') || fallback
  message.error(generalError.value)
}

const handleImageUpload = async (url: string) => {
  if (isSubmitting.value) return
  errors.value.avatar_uuid = ''
  generalError.value = ''
  generalApiErrors = []
  const avatarUuid = url.split('/')[3]
  if (!z.string().uuid().safeParse(avatarUuid).success) {
    showApiErrors(undefined, '头像上传失败，请重新选择图片')
    return
  }
  isAvatarBinding.value = true
  try {
    const resp = await api.post({ url: '/api/user/profile/', query: { avatar_uuid: avatarUuid } })
    if (resp.status !== 200) {
      showApiErrors(resp.errors, '头像保存失败，请重试')
      return
    }
    displayedAvatar.value = resp.content.avatar
    displayedHasAvatar.value = resp.content.has_avatar
    await fetchUserInfo()
    showImageUpload.value = false
    message.success('头像更新成功')
  } catch {
    showApiErrors(undefined, '头像保存失败，请稍后重试')
  } finally {
    isAvatarBinding.value = false
  }
}

const validateForm = () => {
  errors.value = { nickname: '', avatar_uuid: '', bio: '' }
  generalError.value = ''
  generalApiErrors = []
  const result = profileSchema.safeParse(formData.value)
  showNicknameValidation(formData.value.nickname)
  if (result.success) return result.data
  for (const error of result.error.errors) {
    if (error.path[0] === 'nickname') {
      errors.value.nickname = nicknameError(formData.value.nickname)
    } else if (error.path[0] === 'bio') {
      errors.value.bio = '个人简介不能超过 255 个字符'
    }
  }
  const firstField = errors.value.nickname ? 'profile-nickname' : 'profile-bio'
  document.getElementById(firstField)?.focus()
  return null
}

const handleSubmit = async () => {
  if (isSubmitting.value || isNicknameComposing) return
  const payload = validateForm()
  if (!payload) return
  isSaving.value = true
  try {
    const resp = await api.post({ url: '/api/user/profile/', query: payload })
    if (resp.status !== 200) {
      showApiErrors(resp.errors, '更新个人资料失败，请稍后重试')
      return
    }
    displayedAvatar.value = resp.content.avatar
    displayedHasAvatar.value = resp.content.has_avatar
    await fetchUserInfo()
    message.success('个人资料更新成功')
  } catch {
    showApiErrors(undefined, '更新个人资料失败，请稍后重试')
  } finally {
    isSaving.value = false
  }
}
</script>
