<template>
  <div class="review-item">
    <n-avatar
        round
        size="medium"
        src="https://07akioni.oss-cn-beijing.aliyuncs.com/07akioni.jpeg"
    />
    <h3>{{ author }} {{ operation }}了一条点评</h3>
    <p><strong>Course:</strong> {{ course.course_name }} (ID: {{ course.course_id }})</p>
    <p><strong>Teachers:</strong>
      <span v-for="(teacher, index) in teachers" :key="index">
        {{ teacher.teacher_name }} (ID: {{ teacher.teacher_id }})
      </span>
    </p>
    <p><strong>Date:</strong> {{ new Date(datetime).toLocaleString() }}</p>
    <p>{{ content }}</p>
  </div>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
let operation: String = "添加"
const props = defineProps<{
  author: string;
  datetime: string;
  course: {
    course_name: string;
    course_id: number;
  };
  content: string;
  teachers: Array<{
    teacher_name: string;
    teacher_id: number;
  }>;
  edited: boolean;
}>();
if (props.edited) {
  operation = "编辑"
}
</script>

<style scoped>
.review-item {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  background-color: white;
}
</style>
