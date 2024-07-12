<template>
  <div>
    <iframe ref="iframe" class="iframe-content"></iframe>
  </div>
</template>

<script>
import axios from 'axios';

export default {
    mounted() {
    document.title = '关于本站';
  },
  data() {
    return {
      htmlContent: ''
    };
  },
  async created() {
    try {
      const response = await axios.get('/api/about');
      this.htmlContent = response.data.detail.content;
      this.updateIframeContent();
    } catch (error) {
      console.error('Failed to fetch markdown content:', error);
    }
  },
  methods: {
    updateIframeContent() {
      const iframe = this.$refs.iframe;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.document.open();
        iframe.contentWindow.document.write(this.htmlContent);
        iframe.contentWindow.document.close();
      }
    }
  },
  watch: {
    htmlContent() {
      this.updateIframeContent();
    }
  }
};
</script>

<style scoped>
.iframe-content {
  width: 100%;
  height: 100vh;
  border: none;
}
</style>
