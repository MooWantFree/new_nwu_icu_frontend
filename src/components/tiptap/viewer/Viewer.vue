<!-- TODO: Remove tiptap dependency for viewer -->
<template>
  <div class="relative">
    <div :class="{ 'max-h-60 overflow-hidden': !expanded && needExpand }">
      <div ref="editorContainer">
        <div class="max-w-none viewer">
          <editor-content :editor="editor" />
        </div>
      </div>
    </div>
    <div
      v-if="!expanded && isContentOverflowing && needExpand"
      :class="[
        `${expandColor}`,
        'absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t to-transparent flex items-end justify-center',
      ]"
    >
      <ExpandButton
        :expandButtonText="expandButtonText"
        :expanded="expanded"
        @toggle="handleToggleExpand"
      />
      <div class="mt-3"></div>
    </div>
    <div
      v-if="expanded && isContentOverflowing && needExpand"
      class="flex justify-center w-full mt-4 mb-6"
    >
      <ExpandButton
        :expandButtonText="expandButtonText"
        :expanded="expanded"
        @toggle="handleToggleExpand"
      />
      <div class="mt-3"></div>
    </div>
    <LinkConfirmModal
      :show="showModal"
      :url="currentUrl"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, onUnmounted } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'
import ExpandButton from './ExpandButton.vue'
import 'prosemirror-view/style/prosemirror.css'
import TextAlign from '@tiptap/extension-text-align'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import Link from '@tiptap/extension-link'
import LinkConfirmModal from './LinkConfirmModal.vue'

const {
  value = '',
  needExpand = true,
  expandColor = 'from-gray-100',
  expandButtonText,
  emitToggle,
} = defineProps<{
  expandColor?: string
  value: string
  needExpand?: boolean
  expandButtonText?: string
  emitToggle?: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
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
      defaultProtocol: 'https',
      autolink: false,
      HTMLAttributes: {
        class: 'text-blue-500 hover:text-blue-600',
      },
    }),
  ],
  editorProps: {
    attributes: {
      class:
        'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none',
    },
    handleClick: (view, pos, event) => {
      // FIXME: Jump before clicked
      // const link = (event.target as HTMLElement).closest('a')
      // if (link) {
      //   event.preventDefault()
      //   const href = link.getAttribute('href')
      //   if (href) {
      //     showLinkConfirm(href)
      //   }
      // }
    },
  },
  injectCSS: true,
  editable: false,
  content: value,
})

const editorContainer = ref<HTMLElement | null>()
let resizeObserver: ResizeObserver | null = null

onMounted(async () => {
  await nextTick()
  if (editorContainer.value) {
    checkContentOverflow(editorContainer.value.scrollHeight)

    // Create and start the ResizeObserver
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        checkContentOverflow(entry.target.scrollHeight)
      }
    })
    resizeObserver.observe(editorContainer.value)
  }
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
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

const handleToggleExpand = () => {
  if (emitToggle) {
    emit('toggle')
  } else {
    expanded.value = !expanded.value
  }
}

const showModal = ref(false)
const currentUrl = ref('')

const showLinkConfirm = (url: string) => {
  currentUrl.value = url
  showModal.value = true
}

const handleConfirm = () => {
  window.open(currentUrl.value, '_blank')
  showModal.value = false
}

const handleCancel = () => {
  showModal.value = false
}
</script>

<style>
.tiptap {
  blockquote {
    quotes: none;
    font-style: normal;
  }

  p {
    @apply text-base;
  }

  @apply ml-2;
}

/* TODO: Not sure if this is a good fix */
.tiptap * {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}
/* 
.viewer > * > .ProseMirror-selectednode {
  outline: none !important;
} */
</style>
