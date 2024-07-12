<template>
  <div class="review-timeline">
  <template v-for="(review, index) in reviews" :key="index">
    <ReviewItems
        :author="review.author"
        :datetime="review.datetime"
        :course="review.course"
        :content="review.content"
        :teachers="review.teachers"
        :edited="review.edited"
    />
  </template>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, ref} from 'vue';
import axios from 'axios';
import ReviewItems from '@/components/ReviewItems.vue';

const reviews = ref([]);

const fetchReviews = async () => {
  const response = await axios.get('/api/review');
  // 正确的从响应数据中提取reviews数组
  reviews.value = response.data.content.reviews;
  console.log(reviews.value);
};

onMounted(() => {
  fetchReviews();
  document.title = '最新课程评价';
});
</script>

<style scoped>
.review-timeline{
  background-color: white;
  padding: 20px;
}
</style>
