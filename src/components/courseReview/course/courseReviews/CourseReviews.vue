<template>
  <div class="p-6 mt-6 bg-white rounded-md shadow-md">
    <div class="flex">
      <h2 class="text-xl font-bold">点评</h2>
      <n-button @click="handleNewReviewButtonClicked" class="ml-auto" type="primary">提交一条新的点评</n-button>
    </div>
    <div class="flex items-center mt-4 space-x-4">
      <p class="whitespace-nowrap">排序</p>
      <n-select :options="sortSelectorOptions" v-model:value="sortSelectorValue"/>
      <p class="whitespace-nowrap">学期</p>
      <n-select :options="semesterSelectorOptions" v-model:value="semesterSelectorValue"/>
      <p class="whitespace-nowrap">评分</p>
      <n-select :options="rankSelectorOptions" v-model:value="rankSelectorValue"/>
      <n-button @click="handleSemesterRankingChartButtonClicked">课程学期评分趋势</n-button>
    </div>
    <div class="mt-6 space-y-4">
      <div v-for="(review, index) in reviewsDisplayed" :key="index">
        <CourseReviewItem :review="review" />
      </div>
      <div v-if="reviewsDisplayed.length === 0">
        <n-empty size="huge" description="暂时没有内容呢">
          <template #extra>
            <n-button size="large" @click="handleNewReviewButtonClicked">
              新建一个评价
            </n-button>
          </template>
        </n-empty>
      </div>
    </div>
  </div>
  <!-- TODO: mobile editor -->
  <n-modal v-model:show="showEditor">
    <n-card>
      <Editor :content="null" :allowEdit="true" :withToolbar="true" />
    </n-card>
  </n-modal>
</template>

<script lang="ts" setup>
import {ref, computed} from "vue"
import {CourseData} from "@/types/courses"
import CourseReviewItem from "@/components/courseReview/course/courseReviews/CourseReviewItem.vue"
import Editor from "@/components/courseReview/editor/Editor.vue"

const props = defineProps<{
  courseData: CourseData,
  loading: boolean,
}>()
// Reviews Toolbar
// - sort
enum SortMethods {
  MostlyLiked,
  Newest,
  Oldest,
  HighestRated,
  LowestRated,
}

const sortSelectorValue = ref<SortMethods>(SortMethods.MostlyLiked)
const sortSelectorOptions = [
  {
    label: '最多点赞',
    value: SortMethods.MostlyLiked,
  },
  {
    label: '最新点评',
    value: SortMethods.Newest,
  },
  {
    label: '最旧点评',
    value: SortMethods.Oldest,
  },
  {
    label: '评分: 高-低',
    value: SortMethods.HighestRated,
  },
  {
    label: '评分: 低-高',
    value: SortMethods.LowestRated,
  },
]

// - semester
const semesterSelectorValue = ref('all')
const semesterSelectorOptions = computed(() => [
  {
    label: `全部 (${props.courseData.reviews.length})`,
    value: 'all',
  },
  ...props.courseData.semester.map(it => ({
    label: `${it} (${props.courseData.reviews.filter(review => review.semester === it).length})`,
    value: it,
  })),
])

// - rank filter
enum Rank {
  All = 0,
  Five = 5,
  Four = 4,
  Three = 3,
  Two = 2,
  One = 1,
}

const rankSelectorValue = ref(Rank.All)
const rankSelectorOptions = computed(() => [
  {
    label: `全部 (${props.courseData.reviews.length})`,
    value: Rank.All,
  },
  {
    label: `★★★★★ (${props.courseData.reviews.filter(review => review.rating >= 4.5).length})`,
    value: Rank.Five,
  },
  {
    label: `★★★★ (${props.courseData.reviews.filter(review => review.rating >= 3.5 && review.rating < 4.5).length})`,
    value: Rank.Four,
  },
  {
    label: `★★★ (${props.courseData.reviews.filter(review => review.rating >= 2.5 && review.rating < 3.5).length})`,
    value: Rank.Three,
  },
  {
    label: `★★ (${props.courseData.reviews.filter(review => review.rating >= 1.5 && review.rating < 2.5).length})`,
    value: Rank.Two,
  },
  {
    label: `★ (${props.courseData.reviews.filter(review => review.rating < 1.5).length})`,
    value: Rank.One,
  },
])

// - calculate result
const reviewsDisplayed = computed(() => props.courseData.reviews.filter(review => (
            (semesterSelectorValue.value === 'all' || review.semester === semesterSelectorValue.value) &&
            (rankSelectorValue.value === Rank.All || (
                rankSelectorValue.value + 0.5 > review.rating &&
                rankSelectorValue.value - 0.5 <= review.rating
            ))
        )
    )
)

// 课程学期评分趋势
const handleSemesterRankingChartButtonClicked = () => {

}

const showEditor = ref(false)
// New review
const handleNewReviewButtonClicked = () => {
  showEditor.value = true
}
</script>