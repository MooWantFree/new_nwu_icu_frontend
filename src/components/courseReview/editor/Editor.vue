<template>
  <div ref="editorContainer">
    <editor-toolbar :editor="editor" v-if="editor && showToolbar && editable" />
    <div class="max-w-none">
      <editor-content :editor="editor" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEditor, EditorContent, Editor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'
import { ref, watch } from 'vue'
import EditorToolbar from './EditorToolbar.vue'
import 'prosemirror-view/style/prosemirror.css'
import FileHandler from '@tiptap-pro/extension-file-handler'
import { AllowedMimeTypes } from './vars'
import { useFileUpload } from '@/lib/fileUploads'
import { useMessage } from 'naive-ui'
import { onMounted } from 'vue'
import { nextTick } from 'vue'

const { editable = true, placeholder = '点击此处，在这里输入新内容...', showToolbar = true, defaultContent = '' } = defineProps<{
  editable?: boolean,
  placeholder?: string,
  showToolbar?: boolean,
  defaultContent?: string,
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'content-loaded', contentHeight: number): void
}>()

const content = defineModel<string>()
if (defaultContent) {
  content.value = defaultContent
}
const message = useMessage()

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
    Placeholder.configure({
      placeholder,
    }),
    FileHandler.configure({
      allowedMimeTypes: AllowedMimeTypes,
      onPaste: async (currentEditor, files, htmlContent) => {
        if (htmlContent) {
          console.log(htmlContent)
          return
        }
        for (const file of files) {
          await handleFile(currentEditor, file, currentEditor.state.selection.anchor)
        }
      },
      onDrop: (currentEditor, files, pos) => {
        files.forEach(file => handleFile(currentEditor, file, pos))
      }
    }),
    Underline,
    Image,
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

const handleFile = async (currentEditor, file: File, pos: number) => {
  const { uploadFile, loading, succeed, imageUrl, errors } = useFileUpload()
  
  await uploadFile(file)

  if (succeed.value) {
    if (succeed.value && imageUrl.value) {
      currentEditor.chain().insertContentAt(pos, {
      type: 'image',
      attrs: {
        src: imageUrl.value,
      }
    }).run()
  } else if (errors.value.length > 0) {
      message.error(`上传文件失败: ${errors.value.join(', ')}`)
    }
  }
}

const editorContainer = ref<HTMLElement | null>(null)

onMounted(async () => {
  await nextTick()
  if (editorContainer.value) {
    const contentHeight = editorContainer.value.scrollHeight
    emit('content-loaded', contentHeight)
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
