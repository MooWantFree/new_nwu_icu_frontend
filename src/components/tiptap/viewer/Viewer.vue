<template>
  <div class="relative">
    <div :class="{ 'max-h-60 overflow-hidden': !expanded && needExpand }">
      <div ref="editorContainer">
        <div class="max-w-none">
          <editor-content :editor="editor" />
        </div>
      </div>
    </div>
    <div v-if="!expanded && isContentOverflowing && needExpand"
      class="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-300 to-transparent flex items-end justify-center">
      <ExpandButton :expanded="expanded" @toggle="toggleExpand" />
      <div class="mt-3"></div>
    </div>
    <div v-if="expanded && isContentOverflowing && needExpand" class="flex justify-center w-full mt-4 mb-6">
      <ExpandButton :expanded="expanded" @toggle="toggleExpand" />
      <div class="mt-3"></div>
    </div>
  </div>

</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'
import ExpandButton from './ExpandButton.vue'
import 'prosemirror-view/style/prosemirror.css'

const { value = '', needExpand = true } = defineProps<{
  value: string,
  needExpand?: boolean,
}>()

const editor = useEditor({
  extensions: [
    StarterKit,
    /* Not exists in StarterKit: {
      Nodes: [Table, Task],
      Marks: [Highlight, Link, Subscript, Superscript, TextStyle, Underline],
      Functionality: [BubbleMenu, CharacterCount, Color, FloatingMenu, Focus, Undo/Redo
                      Placeholder, Math, TableOfContents, TextAlign, Typography,]
    } */
    // TODO: Mathematics
    // TODO: CodeBlockLowlight
    Underline,
    Image,
  ],
  editorProps: {
    attributes: {
      class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none',
    },
  },
  injectCSS: true,
  editable: false,
  content: value,
})

const editorContainer = ref<HTMLElement | null>()
onMounted(async () => {
  await nextTick()
  if (editorContainer.value) {
    checkContentOverflow(editorContainer.value.scrollHeight)
  }
})

const expanded = ref(false)
const isContentOverflowing = ref(false)

const checkContentOverflow = (contentHeight: number) => {
  if (needExpand) {
    isContentOverflowing.value = contentHeight > 240 // 60px * 4 lines  
  } else {
    isContentOverflowing.value = false
  }
}

const toggleExpand = () => {
  expanded.value = !expanded.value
}

</script>

<style>
.tiptap {
  blockquote {
    quotes: none;
    font-style: normal;
  }

  p {
    @apply text-base
  }

  @apply ml-2
}

/* TODO: Not sure if this is a good fix */
.tiptap * {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}
</style>
