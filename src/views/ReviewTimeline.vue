<template>
  <ReviewTimeline/>
</template>

<script>
import {defineComponent} from "vue";
import ReviewTimeline from "@/components/ReviewTimeline.vue";

export default defineComponent({
  mounted() {
    document.title = '最新课程评价';
  },
  components: {
    ReviewTimeline,
  },
});
</script>