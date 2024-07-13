<template>
  <div class="review-list">
    <!--      <template v-if="loading">-->
    <!--        <n-list-item v-for="i in pageLength" :key="i">-->
    <!--          <n-skeleton circle size="medium" />-->
    <!--          <n-skeleton text :repeat="3">-->
    <!--&lt;!&ndash;            TODO: 还得改，表现的和Card一样&ndash;&gt;-->
    <!--          </n-skeleton>-->
    <!--        </n-list-item>-->
    <!--      </template>-->
    <!--      <template v-else>-->
    <template v-for="(review, index) in reviews" :key="index">
          <review-items
              :author="review.author"
              :datetime="review.datetime"
              :course="review.course"
              :content="review.content"
              :teachers="review.teachers"
              :edited="review.edited"
          />
    </template>
    <!--      </template>-->

  </div>
</template>

<script lang="ts" setup>
import {onMounted, ref} from "vue";
import ReviewItems from "@/components/ReviewItems.vue";

const reviews = ref([])
const loading = ref(true)
const pageLength = ref(5)

const fetchReviews = async () => {
  const resp = await fetch('/api/review')
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
  width: 80%;
  justify-content: center;
  margin: 0 auto;
}
</style>