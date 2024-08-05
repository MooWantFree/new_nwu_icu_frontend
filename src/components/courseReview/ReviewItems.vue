<template>
  <div class="all-review-items">
    <div class="review-avatar">
      <n-avatar
          round
          size="large"
          :src="review.author.avatar_url"
          fallback-src="https://www.loliapi.com/acg/pp/"
      />
    </div>
    <div class="review-container">
      <div class="review-operation-time">
        <div>
          <template v-if="review.author.id > 0">
            <router-link :to="`/user/profile/${review.author.id}`">
              <span style="color: #18A058;">{{ review.author.name }}</span>
            </router-link>
          </template>
          <template v-else>
            <span style="color: #18A058;">{{ review.author.name }}</span>
          </template>

          <span style="color: #999999;">{{ review.edited ? '&nbsp;更新了点评&nbsp;' : '&nbsp;点评了&nbsp;' }}</span>
          <router-link :to="`/review/course/${review.course.id}`">
            <span style="color: #18A058;">{{ review.course.name }}</span>
          </router-link>
        </div>

        <n-tooltip placement="bottom" trigger="hover">
          <template #trigger>
            <n-time :time="new Date(review.datetime)" type="relative"/>
          </template>
          <span>{{ new Date(review.datetime).toLocaleDateString() }}</span>
        </n-tooltip>
      </div>
      <span style="color: #999999;">任课教师: </span>
      <template v-for="(teacher,index) in review.teachers">
        <router-link :to="`/review/teacher/${teacher.id}`">
          <span style="color: #18A058;">{{ teacher.name }}</span>
        </router-link>
        {{ index < review.teachers.length - 1 ? ',' : '' }}
      </template>
      <div class="review-content">
        <span style="color: #808080;">{{ review.content }}</span>


      </div>
      <div>
        <router-link :to="`/review/course/${review.course.id}`">
          <span style="color: #2e2e2e;">>>更多</span>
        </router-link>
      </div>
    </div>

  </div>


</template>

<script lang="ts" setup>
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type {LatestCourseReview, Review} from "@/types/courseReview";

dayjs.extend(relativeTime);

const props = defineProps<{
  review?: Review
}>();

</script>

<style scoped>
a {
  text-decoration: none;
}

.all-review-items {
  display: flex;
  padding: 1rem;
  box-shadow: 0 .5em 1em -.125em rgba(10, 10, 10, .1);
  border-radius: 25px;
  margin-top: 1rem;

}

.review-avatar {
  display: block;
  margin-right: 1rem;
}

@media (max-width: 768px) {
  .review-avatar {
    display: block;
  }

}

.review-operation-time {
  display: flex;
  justify-content: space-between;
}

.review-container {
  width: 100%;
}

.review-content {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
}

</style>
