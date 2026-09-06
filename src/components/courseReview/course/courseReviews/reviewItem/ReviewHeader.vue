<template>
  <div class="mb-5 flex items-start justify-between">
    <div class="min-w-0">
      <div class="flex items-center relative">
        <div v-if="!review.author.anonymous" class="relative group">
          <router-link :to="`/user//${review.author.id}`">
            <UserAvatar
              :avatar="review.author.avatar"
              :uuid="review.author.uuid"
              :has-avatar="review.author.has_avatar"
              alt="Avatar"
              class="w-10 h-10 rounded-full mr-3 border-2 border-transparent group-hover:border-blue-500 transition-all duration-300"
            />
          </router-link>
        </div>
        <img
          v-else
          :src="`/api/download/${review.author.avatar}`"
          alt="Anonymous Avatar"
          class="w-10 h-10 rounded-full mr-3 border-2 border-gray-200"
        />
        <div>
          <div class="flex flex-wrap items-center gap-2">
          <h3 class="text-lg font-bold text-slate-900">
            <router-link
              v-if="review.author.id > 0"
              :to="`/user/${review.author.id}`"
              class="text-blue-700 transition-colors hover:text-blue-800"
            >
              {{ review.author.nickname }}
            </router-link>
            <span v-else class="text-slate-600">匿名用户</span>
          </h3>
          <span v-if="isAuthor" class="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">我</span>
          </div>
          <div class="mt-1 flex flex-wrap items-center gap-2">
            <div class="flex items-center">
              <n-rate readonly allow-half :default-value="review.rating" :size="16" />
            </div>
            <span class="text-sm text-slate-500">{{ review.semester }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="flex shrink-0 items-start gap-2 text-right text-sm text-slate-500">
      <div class="leading-5">
        <Time :time="new Date(review.created_time)" />
        <div v-if="review.edited" class="text-xs text-slate-400">
          修改于 <Time :time="new Date(review.modified_time)" />
        </div>
      </div>
      <div v-if="isAuthor" ref="dropdownMenuRef" class="relative -mt-1">
        <button
          id="reviewActionsButton"
          type="button"
          class="inline-flex items-center rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          :aria-expanded="showDropdownMenu"
          aria-haspopup="true"
          aria-label="打开评价操作菜单"
          @click="toggleDropdownMenu"
        >
          <EllipsisVertical class="h-5 w-5" />
        </button>
        <div
          v-if="showDropdownMenu"
          class="absolute right-0 z-50 mt-2 w-40 origin-top-right divide-y divide-slate-100 rounded-lg bg-white shadow-lg ring-1 ring-black/5"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="reviewActionsButton"
        >
          <div class="py-1" role="none">
            <button
              class="group flex w-full items-center px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              role="menuitem"
              @click="handleEdit"
            >
              <Pencil class="mr-3 h-4 w-4 text-slate-400 group-hover:text-slate-600" />
              编辑评价
            </button>
            <button
              class="group flex w-full items-center px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50"
              role="menuitem"
              @click="handleDelete"
            >
              <Trash2 class="mr-3 h-4 w-4 text-red-400 group-hover:text-red-600" />
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
