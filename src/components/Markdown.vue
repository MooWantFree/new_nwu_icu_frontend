<template>
  <div class="markdown-body" v-html="htmlContent"></div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      htmlContent: ''
    };
  },
  async created() {
    try {
      const response = await axios.get('/api/about');
      // content = content.replace(/<img\s+src="([^"]+)"\s+alt="([^"]*)"\s*\/?>/g, '<n-image src="$1" alt="$2" />')
      this.htmlContent = response.data.detail.content
    } catch (error) {
      console.error('Failed to fetch markdown content:', error);
    }
  }
};
</script>

<style scoped>
.markdown-body {
  @apply prose;
  /* Tailwind CSS Typography plugin */
}

.markdown-body img {
  @apply mx-auto w-1/2;
}

.markdown-body table {
  @apply table-auto w-full;
}

.markdown-body th,
.markdown-body td {
  @apply px-4 py-2 border;
}

.markdown-body th {
  @apply bg-gray-200;
}
</style>
