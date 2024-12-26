<template>
  <div
    class="flex flex-col gap-2 p-4 bg-white border border-gray-200 rounded-lg"
  >
    <div class="flex flex-wrap items-center gap-2">
      <div class="flex items-center gap-1 px-2 border-r border-gray-200">
        <div class="relative" ref="fontDropdownRef">
          <button
            class="flex items-center gap-1 p-2 text-gray-700 rounded hover:bg-gray-100"
            @click="showFontDropdown = !showFontDropdown"
            title="字体选项"
          >
            Aa
            <chevron-down-icon class="w-4 h-4" />
          </button>
          <div
            v-if="showFontDropdown"
            class="absolute left-0 z-10 w-40 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg"
          >
            <button
              v-for="option in fontOptions"
              :key="option.key"
              @click="
                handleFontSelect(option.key);
                showFontDropdown = false
              "
              class="w-full px-4 py-2 text-left hover:bg-gray-100"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-1 px-2 border-r border-gray-200">
        <button
          class="p-2 text-gray-700 rounded hover:bg-gray-100"
          :class="{ 'bg-gray-100': editor.isActive('bold') }"
          @click="editor.chain().focus().toggleBold().run()"
          title="粗体"
        >
          <bold-icon class="w-4 h-4" />
        </button>
        <button
          class="p-2 text-gray-700 rounded hover:bg-gray-100"
          :class="{ 'bg-gray-100': editor.isActive('italic') }"
          @click="editor.chain().focus().toggleItalic().run()"
          title="斜体"
        >
          <italic-icon class="w-4 h-4" />
        </button>
        <button
          class="p-2 text-gray-700 rounded hover:bg-gray-100"
          :class="{ 'bg-gray-100': editor.isActive('strike') }"
          @click="editor.chain().focus().toggleStrike().run()"
          title="删除线"
        >
          <strikethrough-icon class="w-4 h-4" />
        </button>
        <button
          class="p-2 text-gray-700 rounded hover:bg-gray-100"
          :class="{ 'bg-gray-100': editor.isActive('underline') }"
          @click="editor.chain().focus().toggleUnderline().run()"
          title="下划线"
        >
          <underline-icon class="w-4 h-4" />
        </button>
      </div>

      <div class="flex items-center gap-1 px-2 border-r border-gray-200">
        <div class="relative" ref="alignDropdownRef">
          <button
            class="flex items-center gap-1 p-2 text-gray-700 rounded hover:bg-gray-100"
            @click="showAlignDropdown = !showAlignDropdown"
            title="对齐选项"
          >
            <align-left-icon class="w-4 h-4" />
            <chevron-down-icon class="w-4 h-4" />
          </button>
          <div
            v-if="showAlignDropdown"
            class="absolute left-0 z-10 w-32 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg"
          >
            <button
              v-for="option in alignmentOptions"
              :key="option.key"
              @click="
                handleAlignSelect(option.key);
                showAlignDropdown = false
              "
              class="w-full px-4 py-2 text-left hover:bg-gray-100"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
        <button
          class="p-2 text-gray-700 rounded hover:bg-gray-100"
          :class="{ 'bg-gray-100': editor.isActive('bulletList') }"
          @click="editor.chain().focus().toggleBulletList().run()"
          title="无序列表"
        >
          <list-icon class="w-4 h-4" />
        </button>
        <button
          class="p-2 text-gray-700 rounded hover:bg-gray-100"
          :class="{ 'bg-gray-100': editor.isActive('orderedList') }"
          @click="editor.chain().focus().toggleOrderedList().run()"
          title="有序列表"
        >
          <list-ordered-icon class="w-4 h-4" />
        </button>
      </div>

      <div class="flex items-center gap-1 px-2 border-r border-gray-200">
        <!-- <button
          class="p-2 text-gray-700 rounded hover:bg-gray-100"
          @click="editor.chain().focus().toggleTaskList().run()"
          title="任务列表"
        >
          <check-square-icon class="w-4 h-4" />
        </button> -->
        <button
          class="p-2 text-gray-700 rounded hover:bg-gray-100"
          @click="showLinkModal = true"
          title="添加链接"
        >
          <link-icon class="w-4 h-4" />
        </button>
        <button
          class="p-2 text-gray-700 rounded hover:bg-gray-100"
          @click="showImageUpload = true"
          title="上传图片"
        >
          <image-icon class="w-4 h-4" />
        </button>
        <div class="relative" ref="emojiPickerRef">
          <button
            class="p-2 text-gray-700 rounded hover:bg-gray-100"
            @click="showEmojiPicker = !showEmojiPicker"
            title="表情"
          >
            <smile-icon class="w-4 h-4" />
          </button>
          <EmojiPicker v-if="showEmojiPicker" @select="insertEmoji" />
        </div>
        <div class="relative" ref="tableInsertRef">
          <button
            class="p-2 text-gray-700 rounded hover:bg-gray-100"
            @click="showTableInsert = !showTableInsert"
            title="表格"
          >
            <layout-grid-icon class="w-4 h-4" />
          </button>
          <InsertTable v-if="showTableInsert" @insert="insertTable" />
        </div>
        <button
          class="p-2 text-gray-700 rounded hover:bg-gray-100"
          :class="{ 'bg-gray-100': editor.isActive('code') }"
          @click="editor.chain().focus().toggleCode().run()"
          title="行内代码"
        >
          <code-icon class="w-4 h-4" />
        </button>
        <button
          class="p-2 text-gray-700 rounded hover:bg-gray-100"
          :class="{ 'bg-gray-100': editor.isActive('codeBlock') }"
          @click="editor.chain().focus().toggleCodeBlock().run()"
          title="代码块"
        >
          <file-code-icon class="w-4 h-4" />
        </button>
      </div>
    </div>
    <ImageUpload
      v-if="showImageUpload"
      @close="showImageUpload = false"
      @upload="handleImageUpload"
    />
    <InsertLink v-model="showLinkModal" @submit="handleLinkSubmit" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Editor } from '@tiptap/vue-3'
import ImageUpload from './ImageUpload.vue'
import InsertLink from './InsertLink.vue'
import EmojiPicker from './EmojiPicker.vue'
import InsertTable from './InsertTable.vue'
import { onClickOutside } from '@vueuse/core'
import {
  ChevronDown as ChevronDownIcon,
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Strikethrough as StrikethroughIcon,
  Underline as UnderlineIcon,
  AlignLeft as AlignLeftIcon,
  List as ListIcon,
  ListOrdered as ListOrderedIcon,
  Link as LinkIcon,
  Image as ImageIcon,
  Smile as SmileIcon,
  LayoutGrid as LayoutGridIcon,
  Code as CodeIcon,
  FileCode as FileCodeIcon,
} from 'lucide-vue-next'

const { editor } = defineProps<{
  editor: Editor
}>()

const showImageUpload = ref(false)
const showFontDropdown = ref(false)
const showAlignDropdown = ref(false)
const showEmojiPicker = ref(false)
const showTableInsert = ref(false)

const fontDropdownRef = ref<HTMLElement | null>(null)
const alignDropdownRef = ref<HTMLElement | null>(null)
const emojiPickerRef = ref<HTMLElement | null>(null)
const tableInsertRef = ref<HTMLElement | null>(null)

onClickOutside(fontDropdownRef, () => {
  showFontDropdown.value = false
})

onClickOutside(alignDropdownRef, () => {
  showAlignDropdown.value = false
})

onClickOutside(emojiPickerRef, () => {
  showEmojiPicker.value = false
})

onClickOutside(tableInsertRef, () => {
  showTableInsert.value = false
})

const fontOptions = [
  { label: '正文', key: 'normal' },
  { label: '标题 1', key: 'h1' },
  { label: '标题 2', key: 'h2' },
  { label: '标题 3', key: 'h3' },
]

const alignmentOptions = [
  { label: '左对齐', key: 'left' },
  { label: '居中', key: 'center' },
  { label: '右对齐', key: 'right' },
]

const handleFontSelect = (key: string) => {
  switch (key) {
    case 'h1':
      editor.chain().focus().toggleHeading({ level: 1 }).run()
      break
    case 'h2':
      editor.chain().focus().toggleHeading({ level: 2 }).run()
      break
    case 'h3':
      editor.chain().focus().toggleHeading({ level: 3 }).run()
      break
    default:
      editor.chain().focus().setParagraph().run()
  }
}

const handleAlignSelect = (key: string) => {
  editor.chain().focus().setTextAlign(key).run()
}

const handleImageUpload = (imageData: string) => {
  editor.chain().focus().setImage({ src: imageData }).run()
  showImageUpload.value = false
}

const insertEmoji = (emoji: string) => {
  editor.chain().focus().insertContent(emoji).run()
  showEmojiPicker.value = false
}

const insertTable = (rows: number, cols: number) => {
  // FIXME: Not work properly
  editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()
  showTableInsert.value = false
}

const showLinkModal = ref(false)

const handleLinkSubmit = ({ url, text }: { url: string; text: string }) => {
  // FIXME: Not work properly
  if (text) {
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'text',
        text: text,
        marks: [
          {
            type: 'link',
            attrs: { href: url },
          },
        ],
      })
      .run()
  } else {
    editor.chain().focus().setLink({ href: url }).run()
  }
}
</script>
