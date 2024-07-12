<template>

    <Markdown/>

</template>

<script>

import Markdown from '@/components/Markdown.vue';

export default {
  mounted() {
    document.title = '关于本站';
  },
  components: {
    Markdown
  }
};
</script>