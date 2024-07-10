<!--<template>-->
<!--  <div class="markdown-body" v-html="htmlContent"></div>-->
<!--</template>-->

<!--<script>-->
<!--import axios from 'axios';-->
<!--import {marked} from 'marked';-->

<!--export default {-->
<!--  data() {-->
<!--    return {-->
<!--      htmlContent: ''-->
<!--    };-->
<!--  },-->
<!--  async created() {-->
<!--    try {-->
<!--      const response = await axios.get('/api/about');-->
<!--      console.log('API Response:', response.data); // 调试输出-->
<!--      this.htmlContent = marked(response.data.detail.content);-->
<!--      console.log('Converted HTML:', this.htmlContent); // 调试输出-->
<!--    } catch (error) {-->
<!--      console.error('Failed to fetch markdown content:', error);-->
<!--    }-->
<!--  }-->
<!--};-->
<!--</script>-->

<!--<style scoped>-->
<!--.markdown-body {-->
<!--  @apply prose;-->
<!--  /* Tailwind CSS Typography plugin */-->
<!--}-->

<!--.markdown-body img {-->
<!--  @apply mx-auto w-1/2;-->
<!--}-->

<!--.markdown-body table {-->
<!--  @apply table-auto w-full;-->
<!--}-->

<!--.markdown-body th,-->
<!--.markdown-body td {-->
<!--  @apply px-4 py-2 border;-->
<!--}-->

<!--.markdown-body th {-->
<!--  @apply bg-gray-200;-->
<!--}-->
<!--</style>-->
