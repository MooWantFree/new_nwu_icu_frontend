<template>
  <a-space direction="vertical" style="width: 100%;">
    <template v-for="(review, index) in reviews" :key="index">
      <ReviewItems
        :author="review.author"
        :datetime="review.datetime"
        :course="review.course"
        :content="review.content"
        :edited="review.edited"
      />
      <!-- 仅在不是最后一条评价时添加分隔线 -->
      <a-divider v-if="index < reviews.length - 1" />
    </template>
  </a-space>
</template>

<script lang="ts" setup>
import {onMounted, ref} from 'vue';
import axios from 'axios';
import ReviewItems from '@/components/ReviewItems.vue';

const reviews = ref([]);

const fetchReviews = async () => {
  const response = await axios.get('/api/review');
  reviews.value = response.data;
};

onMounted(() => {
  fetchReviews();
});
</script>

<style scoped>
/* 添加一些基本样式，确保你的组件显示正常 */
</style>
