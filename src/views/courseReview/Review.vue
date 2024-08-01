<template>
  <div class="review-list">
    <template v-if="loading">
      <template v-for="i in pageLength" :key="i">
        <n-skeleton circle size="medium" />
        <n-skeleton text :repeat="3">
        </n-skeleton>
      </template>
    </template>
    <template v-else>
      <review-items
        v-for="(review, index) in reviews"
        :key="index"
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
import {onMounted, ref} from "vue";
import ReviewItems from "@/components/ReviewItems.vue";

const reviews = ref([])
const loading = ref(true)
const pageLength = ref(5)

const fetchReviews = async () => {
  const resp = await fetch('/api/review/latest')
  const data = await resp.json()
  // TODO: 错误处理
  reviews.value = data.content.reviews
}

onMounted(async ()=>{
  await fetchReviews()
  loading.value = false
})

</script>

<style scoped>
.review-list {
  display: flex;
  flex-direction: column;
  width: 60%;
  justify-content: center;
  margin: 0 auto;
  background-color: white;
}
</style>