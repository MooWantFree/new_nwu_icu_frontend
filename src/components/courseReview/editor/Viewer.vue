<template>
  <div class="relative">
    <div :class="{ 'max-h-60 overflow-hidden': !expanded }">
      <Editor 
        :editable="false" 
        :default-content="content" 
        :show-toolbar="false"
        @content-loaded="checkContentOverflow"
      />
    </div>
    <div v-if="!expanded && isContentOverflowing" 
         class="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent flex items-end justify-center">
      <ExpandButton :expanded="expanded" @toggle="toggleExpand" />
    </div>
    <div v-if="expanded && isContentOverflowing" class="flex justify-center w-full mt-4 mb-6">
      <ExpandButton :expanded="expanded" @toggle="toggleExpand" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Editor from "./Editor.vue"
import ExpandButton from "./ExpandButton.vue"

const props = defineProps<{
  content: string
}>()

const expanded = ref(false)
const isContentOverflowing = ref(false)

const checkContentOverflow = (contentHeight: number) => {
  isContentOverflowing.value = contentHeight > 240 // 60px * 4 lines
}

const toggleExpand = () => {
  expanded.value = !expanded.value
}
</script>
