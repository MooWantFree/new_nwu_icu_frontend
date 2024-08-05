<template>
  <div class="review-list">
    <template v-if="loading">
      <template v-for="i in pageLength" :key="i">
        <review-item-skeleton />
      </template>
    </template>
    <template v-else>
      <review-items
          v-for="(review, index) in reviews"
          :review="review"
          :key="index"
      />
    </template>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, ref} from "vue";
import ReviewItems from "@/components/courseReview/ReviewItems.vue";
import {useMessage} from "naive-ui";
import {LatestCourseReview} from "@/types/courseReview";
import ReviewItemSkeleton from "@/components/courseReview/ReviewItemSkeleton.vue";

const message = useMessage()

const reviews = ref<LatestCourseReview["content"]["reviews"]>()
const totalReviewCount = ref(0)
const loading = ref(true)
const pageLength = ref(5)

const fetchReviews = async (currentPage: number, pageSize: number = 5, desc: number = 0) => {
  const searchParams = new URLSearchParams({
    currentPage: currentPage.toString(),
    pageSize: pageSize.toString(),
    desc: desc.toString(),
  })
  const reqUrl = "/api/review/latest/?" + searchParams.toString()
  const resp = await fetch(reqUrl)
  if (!resp.ok) {
    // TODO:
  }
  const data = await resp.json() as LatestCourseReview
  reviews.value = data.content.reviews
  totalReviewCount.value = data.content.total
}

onMounted(async () => {
  loading.value = true
  await fetchReviews(1)
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