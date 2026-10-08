<template>
  <section class="min-w-0" aria-label="个人动态">
    <div class="mb-4">
      <nav aria-label="评价与评论" class="inline-flex w-full rounded-lg bg-zinc-100 p-1 sm:w-auto">
        <button
          v-for="tab in tabs"
          :key="tab.name"
          type="button"
          :aria-pressed="activeTab === tab.name"
          @click="setActiveTab(tab.name)"
          :class="[
            'inline-flex min-h-9 flex-1 items-center justify-center rounded-md px-5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 sm:flex-none',
            activeTab === tab.name
              ? 'bg-white text-zinc-950 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-950',
          ]"
        >
          {{ tab.label }}
        </button>
      </nav>
    </div>
    <div>
      <transition name="fade" mode="out-in">
        <ReviewList v-if="activeTab === 'reviews'" :id="id" key="reviews" />
        <ReplyList v-else-if="activeTab === 'comments'" :id="id" key="comments" />
      </transition>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ReviewList from './ReviewList.vue'
import ReplyList from './ReplyList.vue'

const { id } = defineProps<{
  id?: string
}>()

const tabs = [
  { name: 'reviews', label: '评价' },
  { name: 'comments', label: '评论' },
]

const route = useRoute()
const router = useRouter()
const activeTab = computed(() => route.query.tab === 'comments' ? 'comments' : 'reviews')

const setActiveTab = (tab: string) => {
  void router.push({ query: { ...route.query, tab, page: '1' } })
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
