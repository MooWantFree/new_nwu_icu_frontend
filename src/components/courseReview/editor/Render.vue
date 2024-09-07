<template>
  <Milkdown :editable="false" />
</template>

<script setup lang="ts">
import { Milkdown, useEditor } from "@milkdown/vue"
import { defaultValueCtx, Editor, rootCtx, editorViewOptionsCtx } from "@milkdown/core"
import { nord } from "@milkdown/theme-nord"
import { commonmark } from "@milkdown/preset-commonmark"
import { ref, onMounted } from 'vue'

const props = defineProps<{
  content: string
}>()
const editable = () => false

useEditor(root =>
  Editor
    .make()
    .config((ctx) => {
      ctx.set(rootCtx, root)
      ctx.set(defaultValueCtx, props.content)
      ctx.update(editorViewOptionsCtx, (prev) => ({
        ...prev,
        editable,
      }))
    })
    .config(nord)
    .use(commonmark)
)

</script>

<style lang="postcss"></style>
