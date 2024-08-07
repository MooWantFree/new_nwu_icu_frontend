<template>

  <template v-if="myReviews">
    <n-infinite-scroll style="height: 600px" :distance="10" @load="handleLoad">
      <div v-for="review in myReview" class="item">
        <MyReviewItems
            :review="review"
        />
        <n-divider/>
      </div>
    </n-infinite-scroll>
  </template>

</template>

<script lang="ts" setup>
import {onMounted, ref} from 'vue'
import {MyReviews, Review} from "@/types/myReview";
import MyReviewItems from "@/components/courseReview/MyReviewItems.vue";


const myReviews = ref<MyReviews | null>(null);
const myReview = ref<Review[] | null>(null);
let counter = ref<number>(6);
const myReviewsReq = async () => {
  try {
    const resp = await fetch(`/api/review/my-review`)
    myReviews.value = await resp.json()
    myReview.value = myReviews.value.message.reviews.slice(0, counter.value)
  } catch (error) {
    console.error('Failed to load reviews:', error)
  }
}
const handleLoad = () => {
  counter.value = counter.value + 1
  if (counter.value > myReviews.value.message.reviews.length) {
    console.log("no more data")
  } else {
    myReview.value.push(myReviews.value.message.reviews[counter.value])
  }

}

onMounted(() => {
  myReviewsReq();

});

</script>

<style scoped>
.item {
  display: flex;
  margin-bottom: 10px;
  flex-direction: column;
}

.item:last-child {
  margin-bottom: 0;
}
</style>