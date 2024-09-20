<template>
  <editor-toolbar :editor="editor" v-if="editor && showToolbar && editable" />
  <div class="max-w-none">
    <editor-content :editor="editor" />
  </div>
</template>

<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import { ref, watch } from 'vue'
import EditorToolbar from './EditorToolbar.vue'
import 'prosemirror-view/style/prosemirror.css'

const { editable = true, placeholder = '点击此处，在这里输入新内容...', showToolbar = true } = defineProps<{
  editable?: boolean,
  placeholder?: string,
  showToolbar?: boolean,
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const content = defineModel<string>()

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
    Placeholder.configure({
      placeholder,
    }),
    Underline,
  ],
  editorProps: {
    attributes: {
      class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none',
    },
  },
  autofocus: true,
  injectCSS: true,
  content: content.value,
  editable,
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  },
})

watch(() => content.value, (newContent) => {
  if (editor.value && newContent !== editor.value.getHTML() && newContent !== undefined) {
    editor.value.commands.setContent(newContent, false)
  }
})

</script>

<style>
/* Styles for the placeholder */
.tiptap p.is-editor-empty:first-child::before {
  color: #adb5bd;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

.tiptap {
  blockquote {
    quotes: none;
    font-style: normal;
  }
}

/* TODO: Not sure if this is a good fix */
.tiptap > * {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}
</style>
