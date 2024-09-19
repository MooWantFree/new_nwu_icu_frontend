<template>
  <div class="prose max-w-none">
    <editor-content :editor="editor" class="min-h-[200px] border border-gray-300 rounded-md p-4" />
  </div>
</template>

<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { ref, watch } from 'vue';

type EditorProps = {
  editable?: boolean
}

const props = withDefaults(defineProps<EditorProps>(), {
  editable: true,
})

const emit = defineEmits(['update:modelValue'])

const content = defineModel()

const editor = useEditor({
  extensions: [
    StarterKit,
    Placeholder.configure({
      placeholder: 'Start typing your content here...',
    }),
  ],
  editorProps: {
    attributes: {
      class: 'focus:outline-none',
    },
  },
  content: content.value,
  editable: props.editable,
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  },
})

watch(() => content.value, (newContent) => {
  if (editor.value && newContent !== editor.value.getHTML()) {
    editor.value.commands.setContent(newContent, false)
  }
})

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
</style>
