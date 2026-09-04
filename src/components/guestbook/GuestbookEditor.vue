<template>
  <div class="rounded-lg border border-gray-300 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
    <div class="flex items-center gap-1 border-b border-gray-200 p-2" aria-label="文字格式">
      <button
        v-for="button in buttons"
        :key="button.name"
        type="button"
        :title="button.title"
        :aria-label="button.title"
        :aria-pressed="editor?.isActive(button.name) || false"
        :disabled="disabled"
        class="rounded p-2 text-gray-700 hover:bg-gray-100"
        :class="{ 'bg-blue-100 text-blue-700': editor?.isActive(button.name) }"
        @click="button.toggle"
      >
        <component :is="button.icon" class="h-4 w-4" />
      </button>
    </div>
    <EditorContent :editor="editor" class="guestbook-editor p-3" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import { Bold, Italic, Strikethrough, Underline as UnderlineIcon } from 'lucide-vue-next'

import { guestbookPasteContent, sanitizeGuestbookHtml } from '@/lib/guestbook'

const props = defineProps<{ modelValue: string; placeholder?: string; disabled?: boolean }>()
const emit = defineEmits<{ (event: 'update:modelValue', value: string): void }>()

const editor = useEditor({
  content: sanitizeGuestbookHtml(props.modelValue),
  editable: !props.disabled,
  extensions: [
    StarterKit.configure({
      blockquote: false,
      bulletList: false,
      code: false,
      codeBlock: false,
      heading: false,
      horizontalRule: false,
      orderedList: false,
    }),
    Underline,
    Placeholder.configure({ placeholder: props.placeholder || '写下你的留言…' }),
  ],
  editorProps: {
    attributes: { class: 'min-h-32 outline-none prose prose-sm max-w-none', role: 'textbox', 'aria-label': '留言内容', 'aria-multiline': 'true' },
    handlePaste: (_view, event) => {
      const text = event.clipboardData?.getData('text/plain')
      if (text === undefined) return false
      event.preventDefault()
      if (text) editor.value?.chain().focus().insertContent(guestbookPasteContent(text)).run()
      return true
    },
  },
  onUpdate: ({ editor: currentEditor }) => emit('update:modelValue', sanitizeGuestbookHtml(currentEditor.getHTML())),
})

watch(() => props.modelValue, (value) => {
  if (editor.value && value !== editor.value.getHTML()) {
    editor.value.commands.setContent(sanitizeGuestbookHtml(value), false)
  }
})
watch(() => props.disabled, disabled => editor.value?.setEditable(!disabled))

const buttons = computed(() => [
  { name: 'bold', title: '加粗', icon: Bold, toggle: () => editor.value?.chain().focus().toggleBold().run() },
  { name: 'italic', title: '斜体', icon: Italic, toggle: () => editor.value?.chain().focus().toggleItalic().run() },
  { name: 'strike', title: '删除线', icon: Strikethrough, toggle: () => editor.value?.chain().focus().toggleStrike().run() },
  { name: 'underline', title: '下划线', icon: UnderlineIcon, toggle: () => editor.value?.chain().focus().toggleUnderline().run() },
])

onBeforeUnmount(() => editor.value?.destroy())
</script>

<style>
.guestbook-editor .ProseMirror p { margin: 0 0 0.5rem; }
.guestbook-editor .ProseMirror p:last-child { margin-bottom: 0; }
.guestbook-editor .ProseMirror p.is-editor-empty:first-child::before { color: #8e8e93; content: attr(data-placeholder); float: left; height: 0; pointer-events: none; }
</style>
