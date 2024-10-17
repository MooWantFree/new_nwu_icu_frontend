<template>
  <div class="flex space-x-4 mb-6 p-4 bg-white shadow-md rounded-lg">
    <button @click="editor.chain().focus().toggleBold().run()" :class="{ 'bg-gray-200': editor.isActive('bold') }"
      class="px-2 py-1 border rounded">粗体</button>
    <button @click="editor.chain().focus().toggleItalic().run()" :class="{ 'bg-gray-200': editor.isActive('italic') }"
      class="px-2 py-1 border rounded">斜体</button>
    <button @click="editor.chain().focus().toggleUnderline().run()"
      :class="{ 'bg-gray-200': editor.isActive('underline') }" class="px-2 py-1 border rounded">下划线</button>
    <button @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
      :class="{ 'bg-gray-200': editor.isActive('heading', { level: 1 }) }" class="px-2 py-1 border rounded">一级标题</button>
    <button @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
      :class="{ 'bg-gray-200': editor.isActive('heading', { level: 2 }) }" class="px-2 py-1 border rounded">二级标题</button>
    <button @click="editor.chain().focus().toggleBulletList().run()"
      :class="{ 'bg-gray-200': editor.isActive('bulletList') }" class="px-2 py-1 border rounded">无序列表</button>
    <button @click="editor.chain().focus().toggleOrderedList().run()"
      :class="{ 'bg-gray-200': editor.isActive('orderedList') }" class="px-2 py-1 border rounded">有序列表</button>
    <button @click="showImageUpload = true" class="px-2 py-1 border rounded">添加图片</button>
    <ImageUpload v-if="showImageUpload" @close="showImageUpload = false" @upload="handleImageUpload" />
  </div>
</template>

<script setup lang="ts">
import { Editor } from '@tiptap/vue-3'
import { ref } from 'vue';
import ImageUpload from './ImageUpload.vue';

const { editor } = defineProps<{
  editor: Editor
}>()

const showImageUpload = ref(false)

const handleImageUpload = (imageData: string) => {
  editor.chain().focus().setImage({ src: imageData }).run()
  showImageUpload.value = false
}
</script>