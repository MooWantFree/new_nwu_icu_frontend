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

</style>
