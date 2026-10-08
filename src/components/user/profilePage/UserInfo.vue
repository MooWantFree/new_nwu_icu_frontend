<template>
  <section v-if="!userInfo" role="status" aria-label="正在加载个人资料" class="min-w-0 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
    <span class="sr-only">正在加载个人资料</span>
    <div aria-hidden="true" class="p-5 motion-safe:animate-pulse">
      <div class="flex min-w-0 items-start gap-3">
        <div class="h-16 w-16 shrink-0 rounded-full bg-zinc-100" />
        <div class="min-w-0 flex-1 py-1">
          <div class="h-6 w-full max-w-32 rounded bg-zinc-200" />
          <div class="mt-2 h-4 w-full max-w-24 rounded bg-zinc-100" />
        </div>
      </div>
      <div class="mt-5 h-11 w-full rounded-lg bg-zinc-200" />
    </div>
    <div aria-hidden="true" class="space-y-5 border-t border-zinc-100 p-5 motion-safe:animate-pulse">
      <div>
        <div class="h-3 w-16 rounded bg-zinc-100" />
        <div class="mt-3 h-4 w-full rounded bg-zinc-200" />
        <div class="mt-2 h-4 w-3/4 rounded bg-zinc-100" />
      </div>
      <div v-for="index in 2" :key="index">
        <div class="h-3 w-16 rounded bg-zinc-100" />
        <div class="mt-3 h-4 w-2/3 rounded bg-zinc-200" />
      </div>
    </div>
  </section>

  <section v-else class="profile-info min-w-0 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
    <header class="p-5">
      <div class="flex min-w-0 items-start gap-3">
        <UserAvatar
          :avatar="userInfo.avatar"
          :uuid="userInfo.uuid"
          :has-avatar="userInfo.has_avatar"
          :alt="userInfo.nickname"
          class="h-16 w-16 shrink-0 rounded-full border border-zinc-200 bg-zinc-100 object-cover"
        />
        <div class="min-w-0 flex-1">
          <h1 class="break-words text-xl font-semibold leading-7 tracking-tight text-zinc-950">
            {{ userInfo.nickname }}
          </h1>
          <p v-if="userInfo.is_me" class="mt-1 break-words text-xs leading-5 text-zinc-500">
            @{{ userInfo.username }}
          </p>
          <div v-if="userInfo.verified" class="mt-2">
            <VerifiedUniversityEmailBadge class="profile-verified-badge" />
          </div>
        </div>
      </div>
      <div class="mt-5">
        <button
          v-if="userInfo.is_me"
          type="button"
          class="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
          @click="handleEdit"
        >
          <Pencil class="h-4 w-4" aria-hidden="true" />
          编辑资料
        </button>
        <RouterLink
          v-else
          :to="`/message/inbox?talkTo=${userInfo.id}`"
          class="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
        >
          <MessageSquare class="h-4 w-4" aria-hidden="true" />
          发送消息
        </RouterLink>
      </div>
    </header>

    <div class="border-t border-zinc-100 p-5">
      <dl class="space-y-5">
        <div>
          <dt class="text-xs font-medium text-zinc-500">个人简介</dt>
          <dd class="mt-2 whitespace-pre-line break-words text-sm leading-6 text-zinc-700">
            {{ userInfo.bio || '暂无个人简介' }}
          </dd>
        </div>
        <div v-if="userInfo.is_me">
          <dt class="text-xs font-medium text-zinc-500">电子邮箱</dt>
          <dd class="mt-2 break-words text-sm leading-6 text-zinc-700">{{ userInfo.email }}</dd>
        </div>
        <div>
          <dt class="text-xs font-medium text-zinc-500">注册时间</dt>
          <dd class="mt-2 text-sm leading-6 text-zinc-700">
            <Time :time="new Date(userInfo.date_joined)" />
          </dd>
        </div>
      </dl>
    </div>
  </section>
</template>

<script setup lang="ts">
import Time from '@/components/tinyComponents/Time.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import VerifiedUniversityEmailBadge from '@/components/common/VerifiedUniversityEmailBadge.vue'
import type { APIUserProfileFromId } from '@/types/api/user/profilePage'
import { useRouter } from 'vue-router'
import { MessageSquare, Pencil } from 'lucide-vue-next'

defineProps<{
  userInfo: APIUserProfileFromId['response'] | null
}>()

const router = useRouter()

const handleEdit = () => {
  router.push('/user/settings/profile')
}
</script>

<style scoped>
.profile-info :deep(.profile-verified-badge) {
  border-radius: 0.375rem;
  color: #52525b;
  background: #f4f4f5;
  --tw-ring-color: #e4e4e7;
}

.profile-info :deep(.app-time) {
  color: #71717a;
  font-size: 0.875rem;
  line-height: 1.5rem;
}

.profile-info :deep(.app-time:hover) {
  color: #18181b;
}
</style>
