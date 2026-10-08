<template>
  <div class="rounded-md border border-zinc-200 bg-white p-2">
    <div class="flex flex-wrap items-center gap-1" aria-label="文字格式">
      <DropdownMenuRoot>
        <DropdownMenuTrigger :class="buttonClass" aria-label="字体选项">Aa<ChevronDown class="h-3 w-3" aria-hidden="true" /></DropdownMenuTrigger>
        <DropdownMenuPortal>
          <DropdownMenuContent :side-offset="4" :collision-padding="8" :class="menuClass" aria-label="字体选项">
            <DropdownMenuItem v-for="option in fontOptions" :key="option.key" :class="menuItemClass" @select="handleFontSelect(option.key)">{{ option.label }}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenuRoot>
      <span class="mx-1 h-5 w-px bg-zinc-200" aria-hidden="true" />
      <ShadcnTooltip v-for="button in formatButtons" :key="button.name">
        <template #trigger>
          <button type="button" :class="[buttonClass, editor.isActive(button.name) ? activeClass : '']" :aria-label="button.label" :aria-pressed="editor.isActive(button.name)" @click="button.action"><component :is="button.icon" class="h-4 w-4" aria-hidden="true" /></button>
        </template>
        {{ button.label }}
      </ShadcnTooltip>
      <span class="mx-1 h-5 w-px bg-zinc-200" aria-hidden="true" />
      <DropdownMenuRoot>
        <DropdownMenuTrigger :class="buttonClass" aria-label="对齐选项"><AlignLeft class="h-4 w-4" aria-hidden="true" /><ChevronDown class="h-3 w-3" aria-hidden="true" /></DropdownMenuTrigger>
        <DropdownMenuPortal>
          <DropdownMenuContent :side-offset="4" :collision-padding="8" :class="menuClass" aria-label="对齐选项">
            <DropdownMenuItem v-for="option in alignmentOptions" :key="option.key" :class="menuItemClass" @select="handleAlignSelect(option.key)">{{ option.label }}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenuRoot>
      <ShadcnTooltip v-for="button in listButtons" :key="button.name">
        <template #trigger>
          <button type="button" :class="[buttonClass, editor.isActive(button.name) ? activeClass : '']" :aria-label="button.label" :aria-pressed="editor.isActive(button.name)" @click="button.action"><component :is="button.icon" class="h-4 w-4" aria-hidden="true" /></button>
        </template>
        {{ button.label }}
      </ShadcnTooltip>
      <span class="mx-1 h-5 w-px bg-zinc-200" aria-hidden="true" />
      <ShadcnTooltip>
        <template #trigger><button type="button" :class="buttonClass" aria-label="添加链接" @click="showLinkModal = true"><LinkIcon class="h-4 w-4" aria-hidden="true" /></button></template>
        添加链接
      </ShadcnTooltip>
      <ShadcnTooltip>
        <template #trigger><button type="button" :class="buttonClass" aria-label="上传图片" @click="showImageUpload = true"><ImageIcon class="h-4 w-4" aria-hidden="true" /></button></template>
        上传图片
      </ShadcnTooltip>
      <PopoverRoot v-model:open="showEmojiPicker" modal>
        <PopoverTrigger :class="buttonClass" aria-label="表情"><Smile class="h-4 w-4" aria-hidden="true" /></PopoverTrigger>
        <PopoverPortal>
          <PopoverContent :side-offset="4" :collision-padding="8" align="start" :class="popoverClass" aria-label="常用表情">
            <EmojiPicker @select="insertEmoji" />
          </PopoverContent>
        </PopoverPortal>
      </PopoverRoot>
      <PopoverRoot v-model:open="showTableInsert" modal>
        <PopoverTrigger :class="buttonClass" aria-label="表格"><LayoutGrid class="h-4 w-4" aria-hidden="true" /></PopoverTrigger>
        <PopoverPortal>
          <PopoverContent :side-offset="4" :collision-padding="8" align="start" :class="popoverClass" aria-label="插入表格">
            <InsertTable @insert="insertTable" />
          </PopoverContent>
        </PopoverPortal>
      </PopoverRoot>
      <ShadcnTooltip v-for="button in codeButtons" :key="button.name">
        <template #trigger>
          <button type="button" :class="[buttonClass, editor.isActive(button.name) ? activeClass : '']" :aria-label="button.label" :aria-pressed="editor.isActive(button.name)" @click="button.action"><component :is="button.icon" class="h-4 w-4" aria-hidden="true" /></button>
        </template>
        {{ button.label }}
      </ShadcnTooltip>
      <ShadcnTooltip>
        <template #trigger><button type="button" :class="buttonClass" aria-label="上传文件" @click="showFileUpload = true"><CloudUpload class="h-4 w-4" aria-hidden="true" /></button></template>
        上传文件
      </ShadcnTooltip>
    </div>
    <ImageUpload v-if="showImageUpload" @close="showImageUpload = false" @upload="handleImageUpload" />
    <InsertLink v-model="showLinkModal" @submit="handleLinkSubmit" />
    <FileUpload v-if="showFileUpload" @close="showFileUpload = false" @upload="handleFileUpload" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Editor } from '@tiptap/vue-3'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuTrigger, PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'reka-ui'
import { AlignLeft, Bold, ChevronDown, CloudUpload, Code, FileCode, Image as ImageIcon, Italic, LayoutGrid, Link as LinkIcon, List, ListOrdered, Smile, Strikethrough, Underline } from 'lucide-vue-next'
import ShadcnTooltip from '@/components/common/ShadcnTooltip.vue'
import ImageUpload from './ImageUpload.vue'
import FileUpload from './FileUpload.vue'
import InsertLink from './InsertLink.vue'
import EmojiPicker from './EmojiPicker.vue'
import InsertTable from './InsertTable.vue'

const { editor } = defineProps<{ editor: Editor }>()
const showImageUpload = ref(false)
const showEmojiPicker = ref(false)
const showTableInsert = ref(false)
const showFileUpload = ref(false)
const showLinkModal = ref(false)
const buttonClass = 'inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-md px-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50'
const activeClass = 'bg-zinc-100 text-zinc-950'
const menuClass = 'z-[200] min-w-36 rounded-md border border-zinc-200 bg-white p-1 text-zinc-950 shadow-md outline-none'
const menuItemClass = 'flex min-h-9 cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-zinc-100'
const popoverClass = 'z-[200] max-w-[calc(100vw-2rem)] rounded-md border border-zinc-200 bg-white p-3 text-zinc-950 shadow-md outline-none'
const formatButtons = [
  { name: 'bold', label: '粗体', icon: Bold, action: () => editor.chain().focus().toggleBold().run() },
  { name: 'italic', label: '斜体', icon: Italic, action: () => editor.chain().focus().toggleItalic().run() },
  { name: 'strike', label: '删除线', icon: Strikethrough, action: () => editor.chain().focus().toggleStrike().run() },
  { name: 'underline', label: '下划线', icon: Underline, action: () => editor.chain().focus().toggleUnderline().run() },
]
const listButtons = [
  { name: 'bulletList', label: '无序列表', icon: List, action: () => editor.chain().focus().toggleBulletList().run() },
  { name: 'orderedList', label: '有序列表', icon: ListOrdered, action: () => editor.chain().focus().toggleOrderedList().run() },
]
const codeButtons = [
  { name: 'code', label: '行内代码', icon: Code, action: () => editor.chain().focus().toggleCode().run() },
  { name: 'codeBlock', label: '代码块', icon: FileCode, action: () => editor.chain().focus().toggleCodeBlock().run() },
]
const fontOptions = [{ label: '正文', key: 'normal' }, { label: '标题 1', key: 'h1' }, { label: '标题 2', key: 'h2' }, { label: '标题 3', key: 'h3' }]
const alignmentOptions = [{ label: '左对齐', key: 'left' }, { label: '居中', key: 'center' }, { label: '右对齐', key: 'right' }]
const handleFontSelect = (key: string) => {
  if (key === 'h1' || key === 'h2' || key === 'h3') editor.chain().focus().toggleHeading({ level: Number(key.slice(1)) as 1 | 2 | 3 }).run()
  else editor.chain().focus().setParagraph().run()
}
const handleAlignSelect = (key: string) => { editor.chain().focus().setTextAlign(key).run() }
const handleImageUpload = (imageData: string) => {
  const currentPos = editor.view.state.selection.anchor
  editor.chain().focus().insertContent({ type: 'text', text: ' ' }).run()
  editor.chain().focus(currentPos).setImage({ src: imageData }).run()
  showImageUpload.value = false
}
const insertEmoji = (emoji: string) => { editor.chain().focus().insertContent(emoji).run(); showEmojiPicker.value = false }
const insertTable = (rows: number, cols: number) => { editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run(); showTableInsert.value = false }
const handleLinkSubmit = ({ url, text }: { url: string; text: string }) => {
  if (text) editor.chain().focus().insertContent([
    { type: 'text', text: ' ' },
    { type: 'text', text, marks: [{ type: 'link', attrs: { href: url } }] },
    { type: 'text', text: ' ' },
  ]).run()
  else editor.chain().focus().setLink({ href: url }).run()
}
const handleFileUpload = (filename: string, url: string) => {
  editor.chain().focus().insertContent([
    { type: 'text', text: filename, marks: [{ type: 'link', attrs: { href: url } }] },
    { type: 'text', text: ' ' }, { type: 'hardBreak' },
  ]).run()
}
</script>
