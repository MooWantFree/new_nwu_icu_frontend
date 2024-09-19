<template>
    <div class="flex space-x-4 mb-6 p-4 bg-white shadow-md rounded-lg">
    <button @click="editor.chain().focus().toggleBold().run()" :class="{ 'bg-gray-200': editor.isActive('bold') }"
      class="px-2 py-1 border rounded">Bold</button>
    <button @click="editor.chain().focus().toggleItalic().run()" :class="{ 'bg-gray-200': editor.isActive('italic') }"
      class="px-2 py-1 border rounded">Italic</button>
    <button @click="editor.chain().focus().toggleUnderline().run()"
      :class="{ 'bg-gray-200': editor.isActive('underline') }" class="px-2 py-1 border rounded">Underline</button>
    <button @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
      :class="{ 'bg-gray-200': editor.isActive('heading', { level: 1 }) }" class="px-2 py-1 border rounded">H1</button>
    <button @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
      :class="{ 'bg-gray-200': editor.isActive('heading', { level: 2 }) }" class="px-2 py-1 border rounded">H2</button>
    <button @click="editor.chain().focus().toggleBulletList().run()"
      :class="{ 'bg-gray-200': editor.isActive('bulletList') }" class="px-2 py-1 border rounded">Bullet List</button>
    <button @click="editor.chain().focus().toggleOrderedList().run()"
      :class="{ 'bg-gray-200': editor.isActive('orderedList') }" class="px-2 py-1 border rounded">Ordered List</button>
  </div>
</template>

<script setup lang="ts">
import { Editor } from '@tiptap/vue-3'
import { ShallowRef } from 'vue';

const { editor } = defineProps<{
  editor: ShallowRef<Editor>
}>()
</script>