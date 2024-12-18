<template>
  <div class="flex items-center justify-between text-sm text-gray-500">
    <!-- Dropdown Menu -->
    <div
      v-if="isAuthor"
      class="relative inline-block text-left"
      ref="dropdownMenu"
    >
      <button
        @click="toggleDropdownMenu"
        id="dropdownButton"
        type="button"
        class="inline-flex items-center p-2 text-sm font-medium text-gray-700 bg-white rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        aria-expanded="true"
        aria-haspopup="true"
      >
        <span class="sr-only">打开下拉菜单</span>
        <svg
          class="w-5 h-5"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"
          />
        </svg>
      </button>

      <div
        v-if="showDropdownMenu"
        id="dropdownMenu"
        class="z-50 origin-top-right absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none"
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="dropdownButton"
        tabindex="-1"
      >
        <div class="py-1" role="none">
          <button
            @click="handleEdit"
            class="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
            role="menuitem"
            tabindex="-1"
            id="editButton"
          >
            <svg
              class="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
              />
            </svg>
            编辑评价
          </button>
          <button
            @click="handleDelete"
            class="group flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-100 hover:text-red-900 w-full text-left"
            role="menuitem"
            tabindex="-1"
            id="deleteButton"
          >
            <svg
              class="mr-3 h-5 w-5 text-red-400 group-hover:text-red-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
            删除评价
          </button>
        </div>
      </div>
    </div>
    <div class="flex items-center space-x-2">
      <Time :time="new Date(review.created_time)" />
      <div v-if="review.edited">
        <span
          >(最后修改于: <Time :time="new Date(review.modified_time)" />)</span
        >
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Review } from '@/types/courses'
import { watch, onUnmounted, ref, useTemplateRef } from 'vue'
import Time from '@/components/tinyComponents/Time.vue'

const { review, isAuthor } = defineProps<{
  review: Review
  isAuthor: boolean
}>()

const emit = defineEmits<{
  (e: 'reviewEdit'): void
  (e: 'reviewDelete'): void
}>()

const dropdownMenuRef = useTemplateRef('dropdownMenu')

const toggleDropdownMenu = () => {
  handleDropdownMenuOpened()
  showDropdownMenu.value = !showDropdownMenu.value
}

// Dropdown menu
const showDropdownMenu = ref(false)

const handleClickEvent = (e: MouseEvent) => {
  if (dropdownMenuRef && !dropdownMenuRef.value.contains(e.target as Node)) {
    showDropdownMenu.value = false
  }
}
const handleDropdownMenuClosed = () => {
  document.removeEventListener('click', handleClickEvent)
}
const handleDropdownMenuOpened = () => {
  document.addEventListener('click', handleClickEvent)
}
onUnmounted(() => {
  document.removeEventListener('click', handleClickEvent)
})
watch(showDropdownMenu, (newValue) => {
  if (!newValue) {
    handleDropdownMenuClosed()
  }
})

// Event Trigger
const handleEdit = () => {
  emit('reviewEdit')
  showDropdownMenu.value = false
}

const handleDelete = () => {
  emit('reviewDelete')
  showDropdownMenu.value = false
}
</script>
