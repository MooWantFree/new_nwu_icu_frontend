<template>

  <div class="all-review-items">
    <div class="review-avatar">
      <n-avatar
            round
            size="large"
            :src="props.author.avatar_url"
            fallback-src="https://www.loliapi.com/acg/pp/"
        />
    </div>
    <div class="review-container">
      <div class="review-operation-time">
        <div>
          <span style="color: #18A058;">{{ props.author.name }}</span>
          <span style="color: #999999;">{{ props.edited ? '&nbsp;更新了点评&nbsp;' : '&nbsp;点评了&nbsp;' }}</span>
          <router-link to="`/review/course/${props.course.course_id}`">
            <span style="color: #18A058;">{{ props.course.course_name }}</span>
          </router-link>
        </div>

        <n-tooltip placement="bottom" trigger="hover">
          <template #trigger>
            <n-time :time="new Date(props.datetime)" type="relative"/>
          </template>
          <span>{{ new Date(props.datetime).toLocaleDateString() }}</span>
        </n-tooltip>
      </div>
      <span style="color: #999999;">任课教师: </span>
      <template v-for="(teacher,index) in props.teachers">
        <router-link :to="`/review/teacher/${teacher.teacher_id}`">
          <span style="color: #18A058;">{{ teacher.teacher_name }}</span>
        </router-link>
        {{ index < props.teachers.length - 1 ? ',' : '' }}
      </template>
      <div class="review-content">
        <span style="color: #808080;">{{ props.content }}</span>


      </div>
      <div>
        <router-link :to="`/review/course/${props.course.course_id}`">
          <span style="color: #2e2e2e;">>>更多</span>
        </router-link>
      </div>
    </div>

  </div>


</template>

<script lang="ts" setup>
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const props = defineProps<{
  author: {
    id: number,
    name: string,
    avatar_url: string,
  };
  datetime: string;
  course: {
    course_name: string;
    course_id: number;
  };
  content: string;
  teachers: {
    teacher_name: string;
    teacher_id: number;
  }[];
  edited: boolean;
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
