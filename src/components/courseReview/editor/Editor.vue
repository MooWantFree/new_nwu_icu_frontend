<template>
  <Milkdown />
</template>
<script setup lang="ts">
import {Milkdown, useEditor} from "@milkdown/vue"
import {defaultValueCtx, Editor, rootCtx} from "@milkdown/core";
import {nord} from "@milkdown/theme-nord";
import {commonmark} from "@milkdown/preset-commonmark";

useEditor((root)=>
    Editor
      .make()
      .config(ctx => {
        ctx.set(rootCtx, root)
      })
      .config(nord)
      .use(commonmark)
)
</script>

<style scoped>

</style>