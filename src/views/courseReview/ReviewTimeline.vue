<template>
  <div class="review-list">
    <template v-if="loading">
      <template v-for="i in pageLength" :key="i">
        <review-item-skeleton/>
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
  <div class="pagination" v-if="totalReviewCount !== 0">
    <n-pagination
        style="margin-left: auto;margin-right: auto;margin-top: 2rem"
        :item-count="totalReviewCount"
        :page-solt="7"
        :page-size="5"
        @update:page="onPageUpdate"
        v-model:page="currentPage"
    >
      <template #prefix="{ itemCount, startIndex, endIndex }">
        共{{ itemCount }}个点评
      </template>
    </n-pagination>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, ref} from "vue";
import ReviewItems from "@/components/courseReview/ReviewItems.vue";
import {useMessage} from "naive-ui";
import {LatestCourseReview} from "@/types/courseReview";
import ReviewItemSkeleton from "@/components/courseReview/ReviewItemSkeleton.vue";
import {useRoute, useRouter} from "vue-router";

const message = useMessage()

const reviews = ref<LatestCourseReview["content"]["reviews"]>()
const totalReviewCount = ref(0)
const loading = ref(true)
const pageLength = ref(5)

const router = useRouter()
const route = useRoute()

const fetchReviews = async (currentPage: number, pageSize: number = 5, desc: number = 1) => {
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
  await fetchReviews(currentPage.value)
  loading.value = false
})

// Page
const queryPage = parseInt(route.query.page as string)
const currentPage = ref(isNaN(queryPage) ? 1 : queryPage)
const onPageUpdate = async (page: number) => {
  loading.value = true
  await Promise.all([
    router.replace({path: route.path, query: {page: page}}),
    fetchReviews(page)
  ])
  loading.value = false
}
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

.pagination {
  display: flex;
}
</style>