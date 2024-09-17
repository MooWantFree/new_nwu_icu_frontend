<template>
  <div v-if="!content">
    <!-- TODO: Loading...  -->
  </div>
  <div v-else>
    <Editor :content="content" :allow-edit="false" :with-toolbar="false" />
  </div>
</template>

<script lang="ts" setup>
import Editor from "@/components/courseReview/editor/Editor.vue"
import { ref, onMounted } from "vue"
const content = ref<string | null>(null)

onMounted(async () => {
  const res = await getAboutContent()
  content.value = res.data.content
})

const getAboutContent = async () => {
  const resp = await fetch("")
}
</script>