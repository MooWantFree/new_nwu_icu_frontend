<template>
  <div>
    <div class="bg-white shadow-md rounded-lg p-6">
      <div class="border-b border-gray-200">
        <nav class="-mb-px flex relative">
          <button
            v-for="tab in tabs"
            :key="tab.name"
            @click="setActiveTab(tab.name)"
            :class="[
              'w-1/2 py-4 px-1 text-center font-medium text-sm transition-colors duration-200',
              activeTab === tab.name
                ? 'text-indigo-600'
                : 'text-gray-500 hover:text-gray-700',
            ]"
          >
            {{ tab.label }}
          </button>
          <div
            class="absolute bottom-0 w-1/2 h-0.5 bg-indigo-500 transition-transform duration-300 ease-in-out"
            :style="{
              transform: `translateX(${
                activeTab === 'reviews' ? '0%' : '100%'
              })`,
            }"
          ></div>
        </nav>
      </div>
      <div class="mt-4">
        <transition name="fade" mode="out-in">
          <ReviewList v-if="activeTab === 'reviews'" :id="id" key="reviews" />
          <ReplyList v-else-if="activeTab === 'comments'" :id="id" key="comments" />
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ReviewList from './ReviewList.vue'
import ReplyList from './ReplyList.vue'

const { id } = defineProps<{
  id?: string
}>()

const tabs = [
  { name: 'reviews', label: '评价' },
  { name: 'comments', label: '评论' },
]

const activeTab = ref('reviews')

const setActiveTab = (tab: string) => {
  activeTab.value = tab
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
