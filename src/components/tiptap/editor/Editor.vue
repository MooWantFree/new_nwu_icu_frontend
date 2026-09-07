<template>
  <div ref="editorContainer" class="flex min-h-full flex-col">
    <editor-toolbar :editor="editor" v-if="editor && showToolbar" />
    <div class="editor-input-area max-w-none flex flex-1 cursor-text p-4" @mousedown="focusEditorFromBlankArea">
      <editor-content
        :editor="editor"
        class="editor-content prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl flex-1"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'
import FileHandler from '@tiptap/extension-file-handler'
import { useFileUpload } from '@/lib/fileUploads'
import { useMessage } from 'naive-ui'
import EditorToolbar from './EditorToolbar.vue'
import { AllowedMimeTypes } from './vars'
import 'prosemirror-view/style/prosemirror.css'
import TextAlign from '@tiptap/extension-text-align'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import Link from '@tiptap/extension-link'
import { sanitizeUserRichText } from '@/lib/richText'

const {
  placeholder = '点击此处，在这里输入新内容...',
  showToolbar = true,
  defaultContent = '',
} = defineProps<{
  placeholder?: string
  showToolbar?: boolean
  defaultContent?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
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
          return
        }
        for (const file of files) {
          await handleFile(
            currentEditor,
            file,
            currentEditor.state.selection.anchor
          )
        }
      },
      onDrop: (currentEditor, files, pos) => {
        files.forEach((file) => handleFile(currentEditor, file, pos))
      },
    }),
    Underline,
    Image,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableHeader,
    TableCell,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-blue-700 hover:text-blue-700',
      },
      defaultProtocol: 'https',
    }),
  ],
  editorProps: {
    attributes: {
      class:
        'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none',
    },
  },
  autofocus: true,
  injectCSS: true,
  content: sanitizeUserRichText(content.value || ''),
  onUpdate: ({ editor }) => {
    emit('update:modelValue', sanitizeUserRichText(editor.getHTML()))
  },
})

watch(
  () => content.value,
  (newContent) => {
    if (
      editor.value &&
      newContent !== editor.value.getHTML() &&
      newContent !== undefined
    ) {
      editor.value.commands.setContent(sanitizeUserRichText(newContent), false)
    }
  }
)

const handleFile = async (currentEditor: any, file: File, pos: number) => {
  const { uploadFile, succeed, imageUrl, errors } = useFileUpload('img')

  await uploadFile(file)

  if (succeed.value) {
    if (succeed.value && imageUrl.value) {
      currentEditor
        .chain()
        .insertContentAt(pos, {
          type: 'image',
          attrs: {
            src: imageUrl.value,
          },
        })
        .run()
    } else if (errors.value.length > 0) {
      message.error(`上传文件失败: ${errors.value.join(', ')}`)
    }
  }
}

const focusEditorFromBlankArea = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (target.closest('.ProseMirror')) return

  event.preventDefault()
  editor.value?.commands.focus('end')
}
</script>

<style>
/* Share the text baseline with the empty paragraph's caret. Absolute positioning
   and floats create a separate line box, whose font fallback metrics can differ. */
.tiptap p.is-editor-empty:first-child::before {
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

.editor-content > .ProseMirror {
  min-height: 100%;
}

/* Table styles */
.ProseMirror table {
  border-collapse: collapse;
  margin: 0;
  overflow: hidden;
  table-layout: fixed;
  width: 100%;
}

.ProseMirror td,
.ProseMirror th {
  border: 2px solid #d1d1d6;
  box-sizing: border-box;
  min-width: 1em;
  padding: 8px;
  position: relative;
  vertical-align: top;
}

.ProseMirror th {
  background-color: #f5f5f7;
  font-weight: bold;
  text-align: left;
}

.ProseMirror .selectedCell:after {
  background: rgba(10, 132, 255, 0.18);
  content: '';
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  pointer-events: none;
  position: absolute;
  z-index: 2;
}

.ProseMirror .column-resize-handle {
  background-color: #dceeff;
  bottom: -2px;
  position: absolute;
  right: -2px;
  pointer-events: none;
  top: 0;
  width: 4px;
}

.tableWrapper {
  padding: 1rem 0;
  overflow-x: auto;
}

.resize-cursor {
  cursor: ew-resize;
  cursor: col-resize;
}
</style>
