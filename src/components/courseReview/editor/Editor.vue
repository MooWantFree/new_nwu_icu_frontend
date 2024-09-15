<template>
  <Milkdown />
</template>
<script setup lang="ts">
import { Milkdown, useEditor } from "@milkdown/vue"
import { defaultValueCtx, Editor, rootCtx, editorViewOptionsCtx } from "@milkdown/core";
import { nord } from "@milkdown/theme-nord";
import { commonmark } from "@milkdown/preset-commonmark";

const props = defineProps<{
  content: string | null,
  allowEdit: boolean,
  withToolbar: boolean,
}>()

useEditor((root) =>
  Editor
    .make()
    .config(ctx => {
      ctx.set(rootCtx, root)
      // If content is provided, set the content to the editor
      if (props.content) {
        ctx.set(defaultValueCtx, props.content)
      }
      // If allowEdit is true, set the editor to be editable
      if (props.allowEdit) {
        ctx.update(editorViewOptionsCtx, (prev) => ({
          ...prev,
          editable: () => props.allowEdit,
        }))
      }
      
      if (props.withToolbar) {

      }
    })
    .config(nord)
    .use(commonmark)
)
</script>

<style scoped></style>