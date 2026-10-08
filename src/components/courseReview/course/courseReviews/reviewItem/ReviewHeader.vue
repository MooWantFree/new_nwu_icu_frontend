<template>
  <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
    <div class="min-w-0">
      <div class="flex min-w-0 items-start gap-3">
        <div v-if="!review.author.anonymous" class="shrink-0">
          <router-link :to="`/user/${review.author.id}`" class="block rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2">
            <UserAvatar
              :avatar="review.author.avatar"
              :uuid="review.author.uuid"
              :has-avatar="review.author.has_avatar"
              :alt="`${review.author.nickname}的头像`"
              class="h-10 w-10 rounded-full border border-zinc-200 bg-zinc-100 object-cover"
              :class="review.author.is_student ? 'ring-2 ring-blue-500' : ''"
            />
          </router-link>
        </div>
        <UserAvatar
          v-else
          :avatar="review.author.avatar"
          :has-avatar="true"
          alt="匿名用户头像"
          class="h-10 w-10 shrink-0 rounded-full border border-zinc-200 bg-zinc-100 object-cover"
        />
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
          <h3 class="min-w-0 break-words text-sm font-semibold leading-6 text-zinc-950">
            <router-link
              v-if="review.author.id > 0"
              :to="`/user/${review.author.id}`"
              class="rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
            >
              {{ review.author.nickname }}
            </router-link>
            <span v-else class="text-zinc-600">匿名用户</span>
          </h3>
          <span v-if="isAuthor" class="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-600">我</span>
          </div>
          <div class="mt-1 flex flex-wrap items-center gap-2">
            <div class="flex items-center">
              <n-rate readonly allow-half :default-value="review.rating" :size="16" />
            </div>
            <span class="text-xs text-zinc-500">{{ review.semester }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="flex shrink-0 items-start justify-between gap-2 text-xs text-zinc-500 sm:justify-end sm:text-right">
      <div class="leading-5">
        <Time :time="new Date(review.created_time)" />
        <div v-if="review.edited" class="text-xs text-zinc-400">
          修改于 <Time :time="new Date(review.modified_time)" />
        </div>
      </div>
      <div v-if="isAuthor" ref="dropdownMenuRef" class="relative -mt-1">
        <button
          :id="`reviewActionsButton-${review.id}`"
          type="button"
          class="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
          :aria-expanded="showDropdownMenu"
          aria-haspopup="true"
          aria-label="打开评价操作菜单"
          @click="toggleDropdownMenu"
        >
          <EllipsisVertical class="h-4 w-4" aria-hidden="true" />
        </button>
        <div
          v-if="showDropdownMenu"
          class="absolute right-0 z-50 mt-1 w-40 origin-top-right rounded-md border border-zinc-200 bg-white p-1 shadow-md"
          role="menu"
          aria-orientation="vertical"
          :aria-labelledby="`reviewActionsButton-${review.id}`"
        >
          <div class="py-1" role="none">
            <button
              type="button"
              class="group flex w-full items-center rounded-sm px-2 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
              role="menuitem"
              @click="handleEdit"
            >
              <Pencil class="mr-2 h-4 w-4 text-zinc-400 group-hover:text-zinc-600" aria-hidden="true" />
              编辑评价
            </button>
            <button
              type="button"
              class="group flex w-full items-center rounded-sm px-2 py-2 text-left text-sm text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
              role="menuitem"
              @click="handleDelete"
            >
              <Trash2 class="mr-2 h-4 w-4 text-red-400 group-hover:text-red-600" aria-hidden="true" />
              删除评价
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { EllipsisVertical, Pencil, Trash2 } from 'lucide-vue-next'
import { Review } from '@/types/courseReview'
import UserAvatar from '@/components/common/UserAvatar.vue'
import Time from '@/components/tinyComponents/Time.vue'

const { review, isAuthor } = defineProps<{
  review: Review
  isAuthor: boolean
}>()

const emit = defineEmits<{
  (e: 'reviewEdit'): void
  (e: 'reviewDelete'): void
}>()

const dropdownMenuRef = ref<HTMLElement | null>(null)
const showDropdownMenu = ref(false)

onClickOutside(dropdownMenuRef, () => {
  showDropdownMenu.value = false
})

const toggleDropdownMenu = () => {
  showDropdownMenu.value = !showDropdownMenu.value
}

const handleEdit = () => {
  showDropdownMenu.value = false
  emit('reviewEdit')
}

const handleDelete = () => {
  showDropdownMenu.value = false
  emit('reviewDelete')
}
</script>

<style scoped>
:deep(.app-time) { color: #71717a; }
:deep(.app-time:hover) { color: #18181b; }
</style>
