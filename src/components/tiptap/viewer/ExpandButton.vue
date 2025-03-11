<template>
  <button
    @click="handleExpandClick"
    class="group flex items-center px-4 py-2 rounded-full bg-white text-blue-500 hover:text-blue-700 font-semibold shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105"
  >
    <template v-if="expandButtonText">
      {{ expandButtonText }}
    </template>
    <template v-else>
      <span>{{ expanded ? '收起' : '展开' }}</span>
      <svg
        class="w-5 h-5 ml-1 transition-transform duration-300 ease-in-out"
        :class="{ 'rotate-180': expanded }"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fill-rule="evenodd"
          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
          clip-rule="evenodd"
        />
      </svg>
    </template>
  </button>
</template>

<script setup lang="ts">
const { expanded, expandButtonText } = defineProps<{
  expanded: boolean
  expandButtonText?: string
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
  (e: 'buttonClick'): void
}>()

const handleExpandClick = () => {
  emit('toggle')
}
</script>
