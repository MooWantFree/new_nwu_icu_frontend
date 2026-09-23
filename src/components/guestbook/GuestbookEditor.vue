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
    <div v-if="allowImages && editor?.isActive('image')" class="flex items-center gap-2 border-b border-gray-200 px-3 py-2" aria-label="图片大小">
      <span class="text-xs font-medium text-gray-500">图片大小</span>
      <button
        v-for="size in imageSizes"
        :key="size"
        type="button"
        :aria-pressed="editor?.isActive('image', { size }) || false"
        :disabled="disabled"
        class="rounded px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        :class="{ 'bg-blue-100 text-blue-700': editor?.isActive('image', { size }) }"
        @click="setImageSize(size)"
      >
        {{ size }}%
      </button>
    </div>
    <EditorContent :editor="editor" class="guestbook-editor p-3" />
    <ImageUpload v-if="allowImages && showImageUpload" @close="showImageUpload = false" @upload="insertImage" />
    <InsertLink v-model="showLinkModal" :initial-text="selectedLinkText" @submit="insertLink" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import ImageExtension from '@tiptap/extension-image'
import LinkExtension from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import { Bold, Image as ImageIcon, Italic, Link as LinkIcon, Strikethrough, Underline as UnderlineIcon } from 'lucide-vue-next'

import ImageUpload from '@/components/tiptap/editor/ImageUpload.vue'
import InsertLink from '@/components/tiptap/editor/InsertLink.vue'
import {
  ANNOUNCEMENT_IMAGE_SIZES,
  guestbookPasteContent,
  sanitizeAnnouncementHtml,
  sanitizeGuestbookHtml,
  type AnnouncementImageSize,
} from '@/lib/guestbook'

const props = withDefaults(defineProps<{ modelValue: string; placeholder?: string; disabled?: boolean; allowImages?: boolean }>(), {
  allowImages: false,
})
const emit = defineEmits<{ (event: 'update:modelValue', value: string): void }>()
const sanitize = (value: string) => props.allowImages ? sanitizeAnnouncementHtml(value) : sanitizeGuestbookHtml(value)
const showImageUpload = ref(false)
const showLinkModal = ref(false)
const selectedLinkText = ref('')
const imageSizes = ANNOUNCEMENT_IMAGE_SIZES

const AnnouncementImage = ImageExtension.extend({
  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
      size: {
        default: '100',
        parseHTML: element => {
          const value = element.getAttribute('data-size')
          return ANNOUNCEMENT_IMAGE_SIZES.some(size => size === value) ? value : '100'
        },
        renderHTML: attributes => ({ 'data-size': attributes.size || '100' }),
      },
    }
  },
})

const editor = useEditor({
  content: sanitize(props.modelValue),
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
    ...(props.allowImages ? [
      AnnouncementImage.configure({ allowBase64: false }),
      LinkExtension.configure({ openOnClick: false, autolink: false }),
    ] : []),
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
  onUpdate: ({ editor: currentEditor }) => emit('update:modelValue', sanitize(currentEditor.getHTML())),
})

watch(() => props.modelValue, (value) => {
  if (editor.value && value !== editor.value.getHTML()) {
    editor.value.commands.setContent(sanitize(value), false)
  }
})
watch(() => props.disabled, disabled => editor.value?.setEditable(!disabled))

const buttons = computed(() => [
  { name: 'bold', title: '加粗', icon: Bold, toggle: () => editor.value?.chain().focus().toggleBold().run() },
  { name: 'italic', title: '斜体', icon: Italic, toggle: () => editor.value?.chain().focus().toggleItalic().run() },
  { name: 'strike', title: '删除线', icon: Strikethrough, toggle: () => editor.value?.chain().focus().toggleStrike().run() },
  { name: 'underline', title: '下划线', icon: UnderlineIcon, toggle: () => editor.value?.chain().focus().toggleUnderline().run() },
  ...(props.allowImages ? [
    { name: 'link', title: '添加链接', icon: LinkIcon, toggle: () => {
      const selection = editor.value?.state.selection
      selectedLinkText.value = selection && !selection.empty
        ? editor.value?.state.doc.textBetween(selection.from, selection.to, ' ') || ''
        : ''
      showLinkModal.value = true
    } },
    { name: 'image', title: '上传图片', icon: ImageIcon, toggle: () => { showImageUpload.value = true } },
  ] : []),
])

const insertImage = (url: string) => {
  editor.value?.chain().focus().insertContent({ type: 'image', attrs: { src: url, size: '100' } }).run()
  showImageUpload.value = false
}

const setImageSize = (size: AnnouncementImageSize) => {
  editor.value?.chain().focus().updateAttributes('image', { size }).run()
}

const insertLink = ({ url, text }: { url: string; text: string }) => {
  editor.value?.chain().focus().insertContent({
    type: 'text',
    text,
    marks: [{ type: 'link', attrs: { href: url } }],
  }).run()
}

const focus = () => editor.value?.commands.focus()
defineExpose({ focus })

onBeforeUnmount(() => editor.value?.destroy())
</script>

<style>
.guestbook-editor .ProseMirror p { margin: 0 0 0.5rem; }
.guestbook-editor .ProseMirror p:last-child { margin-bottom: 0; }
.guestbook-editor .ProseMirror a { color: #1d4ed8; text-decoration: underline; text-underline-offset: 0.2em; }
.guestbook-editor .ProseMirror img { display: block; height: auto; margin: 0.75rem auto; max-width: 100%; border-radius: 0.5rem; }
.guestbook-editor .ProseMirror img[data-size="25"] { width: 25%; }
.guestbook-editor .ProseMirror img[data-size="50"] { width: 50%; }
.guestbook-editor .ProseMirror img[data-size="75"] { width: 75%; }
.guestbook-editor .ProseMirror img[data-size="100"] { width: 100%; }
/* Keep the placeholder in the empty paragraph's line box, so it uses the
   same baseline as the caret instead of the separate float layout. */
.guestbook-editor .ProseMirror p.is-editor-empty:first-child::before {
  color: #8e8e93;
  content: attr(data-placeholder);
  display: inline-block;
  font: inherit;
  letter-spacing: inherit;
  line-height: inherit;
  overflow: visible;
  pointer-events: none;
  vertical-align: baseline;
  white-space: nowrap;
  width: 0;
}
</style>
