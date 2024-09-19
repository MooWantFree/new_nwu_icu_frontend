<template>
  <div class="prose max-w-none">
    <editor-content :editor="editor" class="min-h-[200px] border border-gray-300 rounded-md p-4 mx-2" />
  </div>
</template>

<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { ref, watch } from 'vue'

const { editable = true, placeholder = '在这里开始输入您的内容...' } = defineProps<{
  editable?: boolean,
  placeholder?: string
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
      placeholder: placeholder,
    }),
  ],
  editorProps: {
    attributes: {
      class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none',
    },
  },
  autofocus: true,
  injectCSS: false,
  content: content.value,
  editable: editable,
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  },
})

watch(() => content.value, (newContent) => {
  if (editor.value && newContent !== editor.value.getHTML() && newContent !== undefined) {
    editor.value.commands.setContent(newContent, false)
  }
})

// FIXME: I don't think this is a good idea since it will let the cursor at the previous position
</script>

<style>
/* Add styles for the placeholder */
.ProseMirror p.is-editor-empty:first-child::before {
  color: #adb5bd;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

.editor-wrapper {
  cursor: text;
}
</style>
