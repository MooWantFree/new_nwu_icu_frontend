<template>
  <form class="min-w-0 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm" :aria-busy="isLoading || isSubmitting" @submit.prevent="handleSubmit">
    <header class="border-b border-zinc-100 px-5 py-5 sm:px-6">
      <h2 class="text-xl font-semibold tracking-tight text-zinc-950">隐私设置</h2>
      <p class="mt-2 text-sm leading-6 text-zinc-500">仅控制他人在你的个人资料页看到的评价和回复。</p>
    </header>

    <div class="space-y-6 px-5 py-6 sm:px-6">
      <div v-if="isLoading || (!savedSettings && !loadError)" role="status" class="flex min-h-40 items-center justify-center gap-2 text-sm text-zinc-500">
        <LoaderCircle class="h-5 w-5 animate-spin text-zinc-400" aria-hidden="true" />
        正在加载隐私设置…
      </div>
      <div v-else-if="loadError" class="space-y-4">
        <div role="alert" class="grid grid-cols-[1rem_1fr] items-start gap-x-3 gap-y-1 rounded-lg border border-red-200 bg-white p-4 text-sm text-red-700">
          <CircleAlert class="mt-0.5 h-4 w-4" aria-hidden="true" />
          <p class="font-medium leading-5">读取失败</p>
          <p class="col-start-2 break-words leading-6">{{ loadError }}</p>
        </div>
        <button type="button" class="inline-flex h-10 items-center justify-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2" @click="fetchPrivateSettings">
          重新加载
        </button>
      </div>
      <template v-else-if="savedSettings">
        <fieldset v-for="group in groups" :key="group.key" :disabled="isSubmitting" class="min-w-0">
          <legend class="mb-3 text-sm font-medium text-zinc-950">{{ group.label }}</legend>
          <div class="grid grid-cols-1 gap-2 lg:grid-cols-3">
            <label
              v-for="level in levels"
              :key="level.value"
              :class="[
                'flex min-w-0 items-start gap-3 rounded-lg border p-3 text-sm transition-colors',
                draft[group.key] === level.value ? 'border-zinc-300 bg-zinc-50' : 'border-zinc-200 bg-white',
                isSubmitting ? 'cursor-wait opacity-60' : 'cursor-pointer hover:bg-zinc-50',
              ]"
            >
              <input v-model="draft[group.key]" type="radio" :name="`privacy-${group.key}`" :value="level.value" class="mt-0.5 h-4 w-4 shrink-0 accent-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2" />
              <span class="min-w-0">
                <span class="block font-medium text-zinc-900">{{ level.label }}</span>
                <span class="mt-1 block text-xs leading-5 text-zinc-500">{{ level.description }}</span>
              </span>
            </label>
          </div>
        </fieldset>
        <div v-if="saveError" role="alert" class="grid grid-cols-[1rem_1fr] items-start gap-x-3 gap-y-1 rounded-lg border border-red-200 bg-white p-4 text-sm text-red-700">
          <CircleAlert class="mt-0.5 h-4 w-4" aria-hidden="true" />
          <p class="font-medium leading-5">保存失败</p>
          <p class="col-start-2 break-words leading-6">{{ saveError }}</p>
        </div>
      </template>
    </div>

    <footer class="flex flex-col gap-3 border-t border-zinc-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p v-if="savedSettings" class="text-xs leading-5 text-zinc-500">{{ hasChanges ? '有未保存的更改' : '所有更改已保存' }}</p>
      <button
        type="submit"
        :disabled="isLoading || isSubmitting || !savedSettings || !hasChanges"
        class="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:ml-auto sm:w-auto"
      >
        <LoaderCircle v-if="isSubmitting" class="h-4 w-4 animate-spin" aria-hidden="true" />
        {{ isSubmitting ? '保存中…' : '保存更改' }}
      </button>
    </footer>
  </form>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { CircleAlert, LoaderCircle } from 'lucide-vue-next'
import { api } from '@/lib/requests'
import { useShadcnToast } from '@/lib/useShadcnToast'
import type { APIPrivate } from '@/types/api/user/profilePage'

type PrivacyLevel = 0 | 1 | 2
type PrivacySettings = { review: PrivacyLevel; reply: PrivacyLevel }
const groups = [
  { key: 'review', label: '课程评价' },
  { key: 'reply', label: '课程评价回复' },
] as const
const levels = [
  { value: 0, label: '允许所有人', description: '任何人都可以查看。' },
  { value: 1, label: '仅允许登录用户', description: '访客登录后才能查看。' },
  { value: 2, label: '禁止所有人', description: '仅自己可以查看。' },
] as const

const message = useShadcnToast()
const draft = ref<PrivacySettings>({ review: 0, reply: 0 })
const savedSettings = ref<PrivacySettings | null>(null)
const isLoading = ref(false)
const isSubmitting = ref(false)
const loadError = ref('')
const saveError = ref('')
const hasChanges = computed(() => savedSettings.value !== null
  && (draft.value.review !== savedSettings.value.review || draft.value.reply !== savedSettings.value.reply))
let active = true

const errorMessage = (errors: unknown, fallback: string) => {
  if (Array.isArray(errors)) {
    const error = errors.find(item => typeof item?.err_msg === 'string' && item.err_msg.trim())
    if (error) return error.err_msg as string
  }
  return fallback
}
const isPrivacyLevel = (value: unknown): value is PrivacyLevel => value === 0 || value === 1 || value === 2
const parseSettings = (content: APIPrivate['response']): PrivacySettings => {
  const review = content?.review?.setting
  const reply = content?.reply?.setting
  if (!isPrivacyLevel(review) || !isPrivacyLevel(reply)) throw new Error('服务器返回的隐私设置无效，请重新加载')
  return { review, reply }
}

const fetchPrivateSettings = async () => {
  if (isLoading.value || isSubmitting.value) return
  isLoading.value = true
  loadError.value = ''
  try {
    const response = await api.get({ url: '/api/user/private/' })
    if (!active) return
    if (response.status !== 200) throw new Error(errorMessage(response.errors, '获取隐私设置失败，请重试'))
    const settings = parseSettings(response.content)
    draft.value = { ...settings }
    savedSettings.value = settings
    saveError.value = ''
  } catch (error) {
    if (!active) return
    loadError.value = error instanceof Error ? error.message : '获取隐私设置失败，请重试'
  } finally {
    if (active) isLoading.value = false
  }
}

const handleSubmit = async () => {
  if (isLoading.value || isSubmitting.value || !savedSettings.value || !hasChanges.value) return
  isSubmitting.value = true
  saveError.value = ''
  try {
    const response = await api.post({
      url: '/api/user/private/',
      query: { private_review: draft.value.review, private_reply: draft.value.reply },
    })
    if (!active) return
    if (response.status !== 200) throw new Error(errorMessage(response.errors, '更新隐私设置失败，请重试'))
    const settings = parseSettings(response.content)
    draft.value = { ...settings }
    savedSettings.value = settings
    message.success('隐私设置已保存')
  } catch (error) {
    if (!active) return
    saveError.value = error instanceof Error ? error.message : '更新隐私设置失败，请重试'
  } finally {
    if (active) isSubmitting.value = false
  }
}

onMounted(fetchPrivateSettings)
onBeforeUnmount(() => { active = false })
</script>
